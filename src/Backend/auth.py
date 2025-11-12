import os
import datetime
import logging
import traceback
import datetime
from flask import Blueprint, request, jsonify, g, redirect, current_app
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token,
    set_access_cookies,
    unset_jwt_cookies,
    verify_jwt_in_request,
    get_jwt,
)
from utils.db import get_db_connection
from audit_logging.login_audit_logs import log_login_attempt, log_password_change

# =========================
# Logging setup
# =========================
logger = logging.getLogger("auth")
if not logger.handlers:
    level = os.getenv("AUTH_LOG_LEVEL", "INFO").upper()
    logger.setLevel(getattr(logging, level, logging.INFO))

    fmt = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s")
    sh = logging.StreamHandler()
    sh.setFormatter(fmt)
    logger.addHandler(sh)

    log_file = os.getenv("AUTH_LOG_FILE")  # e.g. /var/log/app/auth.log
    if log_file:
        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setFormatter(fmt)
        logger.addHandler(fh)

def _redact(d: dict) -> dict:
    safe = dict(d or {})
    for k in ("password", "ssn", "token", "security_answer"):
        if k in safe and safe[k] is not None:
            safe[k] = "***REDACTED***"
    return safe

def _log_db_identity(cur):
    cur.execute("SELECT DATABASE(), @@hostname, CURRENT_USER()")
    db, host, user = cur.fetchone()
    logger.info(f"DB identity => database={db} host={host} current_user={user}")
    return db, host, user

def _exec(cur, sql, params=None, label=None):
    label = f"{label}: " if label else ""
    logger.debug(f"{label}SQL => {sql}  PARAMS => {params}")
    cur.execute(sql, params or ())
    logger.info(f"{label}rowcount => {cur.rowcount}")

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api")

# =========================
# REGISTER
# =========================
@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    logger.info(f"POST /api/register payload => {_redact(data)}")

    # --- Required fields (driver-only flow)
    first_name = data.get('firstname')
    last_name  = data.get('lastname')
    email      = data.get('email')
    ssn        = data.get('ssn')
    city       = data.get('city')
    state      = data.get('state')
    country    = data.get('country')
    username   = data.get('username') or email
    password   = data.get('password')
    sec_q = data.get('security_question') or 'Default question'
    sec_a = data.get('security_answer')  or 'Default answer'

    # Validate basics
    required = [first_name, last_name, email, city, state, country, username, password]
    if not all(required):
        return jsonify({'error': 'Missing required fields.'}), 400

    # Force driver type (3). We no longer register admins/sponsors from this endpoint.
    type_id = 3

    hashed_password = generate_password_hash(password)
    conn = None
    try:
        conn = get_db_connection()
        conn.autocommit = False
        cur = conn.cursor()

        _ = _log_db_identity(cur)

        # 1) user
        _exec(cur,
              "INSERT INTO `user` (first_name, last_name, email, ssn, city, state, country, type_id) "
              "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
              (first_name, last_name, email, ssn, city, state, country, type_id),
              label="insert user")
        user_id = cur.lastrowid
        logger.info(f"Created user_id => {user_id}")

        # 2) credentials
        _exec(cur,
              "INSERT INTO user_credentials (user_id, username, password) VALUES (%s,%s,%s)",
              (user_id, username, hashed_password),
              label="insert credentials")

        # 3) login_info (NOT NULL fields present)
        _exec(cur,
              "INSERT INTO login_info (user_id, failed_attempts, is_locked, locked_until, security_question, security_answer) "
              "VALUES (%s, 0, 0, NULL, %s, %s)",
              (user_id, sec_q, sec_a),
              label="insert login_info")


        # 4) driver
        _exec(cur,
              "INSERT INTO driver (user_id) VALUES (%s)",
              (user_id,),
              label="insert driver")

        conn.commit()
        logger.info("Transaction committed (register)")

        _exec(cur, "SELECT user_id, email, type_id FROM `user` WHERE user_id=%s", (user_id,), label="verify user")
        created = cur.fetchone()
        logger.info(f"Verification result => {created}")

        return jsonify({
            'message': 'Driver registered successfully',
            'user_id': user_id
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
            logger.info("Transaction rolled back (register)")
        logger.error(f"Error in /api/register: {e}\n{traceback.format_exc()}")
        return jsonify({'error': f'registration failed: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()
            logger.debug("DB connection closed (register)")

# =========================
# LOGIN
# =========================
@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    logger.info(f"POST /api/login payload => {_redact(data)}")

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        logger.warning("Validation failed: missing username or password")
        return jsonify({'error': 'Missing username or password'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        _log_db_identity(cur)

        _exec(cur, "SELECT user_id, password FROM user_credentials WHERE username = %s",
              (username,), label="fetch credentials")
        cred = cur.fetchone()
        if not cred:
            logger.info("Login failed: NO_SUCH_USER")
            log_login_attempt(None, username, False, failure_reason='NO_SUCH_USER')
            return jsonify({'error': 'Invalid username or password'}), 401

        user_id = cred['user_id']
        hashed_password = cred['password']

        ok = check_password_hash(hashed_password, password) or (hashed_password == password)  # temporary fallback
        if not ok:
            logger.info(f"Login failed: BAD_PASSWORD for user_id={user_id}")
            log_login_attempt(user_id, username, False, failure_reason='BAD_PASSWORD')
            return jsonify({'error': 'Invalid username or password'}), 401

        cur.execute("SELECT type_id FROM `user` WHERE user_id = %s", (user_id,))
        urow = cur.fetchone() or {}
        type_id = urow.get('type_id') if isinstance(urow, dict) else (urow[0] if urow else None)
        role_map = {1: 'admin', 2: 'sponsor', 3: 'driver'}
        role = role_map.get(type_id, 'user')

        logger.info(f"Login success: user_id={user_id} role={role}")
        log_login_attempt(user_id, username, True)

        # Create access token and include user info in claims
        remember = bool(data.get('remember'))
        # If the user asked to be remembered, extend token lifetime (30 days).
        if remember:
            expires = datetime.timedelta(days=30)
            logger.info(f"Issuing remembered token for user_id={user_id} (expires in 30 days)")
            access_token = create_access_token(
                identity=str(user_id),
                additional_claims={'role': role, 'user_id': user_id, 'username': username},
                expires_delta=expires
            )
        else:
            access_token = create_access_token(
                identity=str(user_id),
                additional_claims={'role': role, 'user_id': user_id, 'username': username}
            )
        resp = jsonify({'role': role})
        # Set cookie manually so we can control whether it's a session cookie
        cookie_name = current_app.config.get('JWT_ACCESS_COOKIE_NAME', 'access_token_cookie')
        samesite = current_app.config.get('JWT_COOKIE_SAMESITE', 'Lax')
        secure = current_app.config.get('JWT_COOKIE_SECURE', False)

        if remember:
            max_age = 30 * 24 * 3600
            resp.set_cookie(cookie_name, access_token,
                            httponly=True, secure=secure, samesite=samesite,
                            max_age=max_age, path='/')
        else:
            # No max_age -> session cookie (removed when browser is closed)
            resp.set_cookie(cookie_name, access_token,
                            httponly=True, secure=secure, samesite=samesite,
                            path='/')
        return resp, 200

    except Exception as e:
        logger.error(f"Error in /api/login: {e}\n{traceback.format_exc()}")
        log_login_attempt(None, username, False, failure_reason='OTHER')
        return jsonify({'error': 'Login failed'}), 500
    finally:
        if conn:
            conn.close()
            logger.debug("DB connection closed (login)")

@auth_bp.route('/passwordreset', methods=['POST'])
def password_reset():
    data = request.get_json()
    username = data.get('username')
    newpassword = data.get('newpassword')

    if not username or not newpassword:
        return jsonify({'error': 'Missing username or new password'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        _log_db_identity(cur)

        hashed_password = generate_password_hash(newpassword)

        _exec(cur, "UPDATE user_credentials SET password=%s WHERE username=%s",
              (hashed_password, username), label="update password")
        if cur.rowcount == 0:
            return jsonify({'error': 'User not found'}), 404
        
        #log_password_change(None, username, source='WEB')

        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Error in /api/passwordreset: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Password reset failed'}), 500
    finally:
        if conn:
            conn.close()
            logger.debug("DB connection closed (password reset)")

    return jsonify({'success': True, 'message': 'Password reset successfully'}), 200


@auth_bp.post('/logout')
def logout():
    try:
        resp = jsonify({'msg': 'Logout successful'})
        cookie_name = current_app.config.get('JWT_ACCESS_COOKIE_NAME', 'access_token_cookie')
        resp.delete_cookie(cookie_name, path='/')
        try:
            unset_jwt_cookies(resp)
        except Exception:
            pass
        return resp, 200
    except Exception as e:
        logger.error(f"Error during logout: {e}")
        return jsonify({'error': 'Logout failed'}), 500

# To protect api endpoints
def token_required(f):
    """Compatibility wrapper that verifies JWT in request (header or cookie) and
    stores claims in `g.decoded_token` for downstream code expecting that variable.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        cookie_name = current_app.config.get('JWT_ACCESS_COOKIE_NAME', 'access_token_cookie')
        has_cookie = cookie_name in request.cookies
        try:
            verify_jwt_in_request()
            claims = get_jwt() or {}
            g.decoded_token = claims
        except Exception as exc:
            accept = request.headers.get('Accept', '')
            is_json_request = request.path.startswith('/api/') or 'application/json' in accept
            
            if not is_json_request:
                return redirect('/login')
            return jsonify({'error': 'Token missing or invalid'}), 401
        return f(*args, **kwargs)
    return wrapper


def require_role(required):
    """Decorator to require a specific role or list of roles using flask_jwt_extended claims.

    Usage:
      @require_role('admin')
      @require_role(['admin','sponsor'])
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            try:
                verify_jwt_in_request()
                claims = get_jwt() or {}
                role = claims.get('role')
                allowed = required if isinstance(required, (list, tuple, set)) else [required]
                if role not in allowed:
                    accept = request.headers.get('Accept', '')
                    if 'text/html' in accept:
                        return redirect('/login')
                    return jsonify({'error': 'Forbidden'}), 403
                # keep backward compatibility
                g.decoded_token = claims
                return f(*args, **kwargs)
            except Exception as exc:
                logger.info(f"require_role: JWT verification/role check failed -> {type(exc).__name__}: {str(exc)}")
                accept = request.headers.get('Accept', '')
                if 'text/html' in accept:
                    return redirect('/login')
                return jsonify({'error': 'Token missing or invalid'}), 401
        return wrapped
    return decorator


# =========================
# IMPERSONATION ENDPOINTS
# =========================
# NOTE: Impersonation endpoints have been moved to account.py
# The endpoints below are deprecated and commented out to avoid conflicts

# @auth_bp.route("/admin/impersonate", methods=["POST"])
# @token_required
# @require_role("admin")
# def admin_impersonate():
#     admin_user_id = g.decoded_token.get("user_id") or g.decoded_token.get("sub")
#     
#     data = request.get_json() or {}
#     target_user_id = data.get("user_id")
#     
#     if not target_user_id:
#         return jsonify({"error": "Missing user_id"}), 400
#     
#     try:
#         target_user_id = int(target_user_id)
#     except Exception:
#         return jsonify({"error": "Invalid user_id"}), 400
#     
#     conn = None
#     cur = None
#     try:
#         conn = get_db_connection()
#         cur = conn.cursor(dictionary=True)
#         
#         # Get target user details
#         cur.execute("""
#             SELECT u.user_id, u.first_name, u.last_name, u.email, u.type_id, ut.type_name
#             FROM `user` u
#             LEFT JOIN user_type ut ON u.type_id = ut.type_id
#             WHERE u.user_id = %s
#         """, (target_user_id,))
#         
#         user = cur.fetchone()
#         if not user:
#             return jsonify({"error": "User not found"}), 404
#         
#         # Map type_id to role
#         role_map = {1: 'admin', 2: 'sponsor', 3: 'driver'}
#         role = role_map.get(user['type_id'], 'user')
#         
#         # Create impersonation token (30 min expiry for security)
#         impersonation_token = create_access_token(
#             identity=str(target_user_id),
#             additional_claims={
#                 'role': role,
#                 'user_id': target_user_id,
#                 'username': user['email'],
#                 'impersonated_by': admin_user_id,  # Track who is impersonating
#                 'is_impersonation': True
#             },
#             expires_delta=datetime.timedelta(minutes=30)
#         )
#         
#         logger.info(f"Admin {admin_user_id} generated impersonation token for user {target_user_id} ({role})")
#         
#         return jsonify({
#             "token": impersonation_token,
#             "user_info": {
#                 "user_id": user['user_id'],
#                 "first_name": user['first_name'],
#                 "last_name": user['last_name'],
#                 "email": user['email'],
#                 "role": role
#             }
#         }), 200
#         
#     except Exception as e:
#         logger.error(f"Error in admin impersonation: {e}")
#         return jsonify({"error": str(e)}), 500
#     finally:
#         if cur:
#             cur.close()
#         if conn:
#             conn.close()


@auth_bp.route("/sponsor/impersonate-driver", methods=["POST"])
@token_required
@require_role("sponsor")
def sponsor_impersonate_driver():
    sponsor_user_id = g.decoded_token.get("user_id") or g.decoded_token.get("sub")
    
    data = request.get_json() or {}
    driver_id = data.get("driver_id")
    
    if not driver_id:
        return jsonify({"error": "Missing driver_id"}), 400
    
    try:
        driver_id = int(driver_id)
    except Exception:
        return jsonify({"error": "Invalid driver_id"}), 400
    
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Get sponsor_id
        cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (sponsor_user_id,))
        sponsor = cur.fetchone()
        if not sponsor:
            return jsonify({"error": "Sponsor not found"}), 404
        sponsor_id = sponsor['sponsor_id']
        
        # Verify driver belongs to this sponsor (ACTIVE relationship only)
        cur.execute("""
            SELECT d.driver_id, d.user_id, u.first_name, u.last_name, u.email
            FROM driver d
            JOIN `user` u ON d.user_id = u.user_id
            JOIN driver_sponsor ds ON d.driver_id = ds.driver_id
            WHERE d.driver_id = %s 
              AND ds.sponsor_id = %s 
              AND ds.status = 'ACTIVE'
        """, (driver_id, sponsor_id))
        
        driver = cur.fetchone()
        if not driver:
            return jsonify({"error": "Driver not found or not associated with your sponsorship"}), 404
        
        target_user_id = driver['user_id']
        
        # Create impersonation token (30 min expiry)
        impersonation_token = create_access_token(
            identity=str(target_user_id),
            additional_claims={
                'role': 'driver',
                'user_id': target_user_id,
                'username': driver['email'],
                'impersonated_by': sponsor_user_id,  # Track who is impersonating
                'is_impersonation': True,
                'sponsor_impersonation': True  # Flag for sponsor impersonation
            },
            expires_delta=datetime.timedelta(minutes=30)
        )
        
        logger.info(f"Sponsor {sponsor_user_id} generated impersonation token for driver {driver_id} (user {target_user_id})")
        
        return jsonify({
            "token": impersonation_token,
            "user_info": {
                "user_id": target_user_id,
                "driver_id": driver_id,
                "first_name": driver['first_name'],
                "last_name": driver['last_name'],
                "email": driver['email'],
                "role": "driver"
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error in sponsor impersonation: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@auth_bp.route("/auth/impersonate-login", methods=["POST"])
def impersonate_login():
    data = request.get_json() or {}
    token = data.get("token")
    
    if not token:
        return jsonify({"error": "Missing token"}), 400
    
    try:
        # Verify the token is valid and contains impersonation flag
        from flask_jwt_extended import decode_token
        claims = decode_token(token)
        
        if not claims.get("is_impersonation"):
            return jsonify({"error": "Invalid impersonation token"}), 403
        
        # Create response and set the cookie
        response = jsonify({
            "success": True,
            "message": "Impersonation session started",
            "user_id": claims.get("user_id"),
            "role": claims.get("role"),
            "impersonated_by": claims.get("impersonated_by")
        })
        
        set_access_cookies(response, token)
        
        logger.info(f"Impersonation session started for user {claims.get('user_id')} by {claims.get('impersonated_by')}")
        
        return response, 200
        
    except Exception as e:
        logger.error(f"Error in impersonate login: {e}")
        return jsonify({"error": "Invalid token"}), 401
