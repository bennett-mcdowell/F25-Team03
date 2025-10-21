# src/Backend/account.py
from flask import Blueprint, jsonify, g, request
from utils.db import get_db_connection
from auth import token_required
import io
import re
import secrets
import datetime

account_bp = Blueprint("account", __name__)

SENSITIVE_USER_FIELDS = {"ssn"}
HIDE_TECH_FIELDS      = {"email_lc"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def _claims_user_id():
    claims = getattr(g, "decoded_token", {}) or {}
    return claims.get("user_id") or claims.get("sub")

@account_bp.route("/api/account", methods=["GET"])
@token_required
def account_api():
    user_id = _claims_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)  # <-- no context manager; will close manually

        # 1) Base user
        cur.execute("SELECT * FROM `user` WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404

        # Filter sensitive/tech fields
        user_data = {
            k: v for k, v in row.items()
            if k.lower() not in SENSITIVE_USER_FIELDS
            and k.lower() not in HIDE_TECH_FIELDS
        }

        # 2) Type info
        type_info, role_blob, role_name = None, None, None
        type_id = user_data.get("type_id")

        if type_id is not None:
            cur.execute("SELECT * FROM user_type WHERE type_id = %s", (type_id,))
            trow = cur.fetchone()
            if trow:
                type_info = dict(trow)
                role_name = type_info.get("type_name")

        # 3) Role-specific details
        if type_id == 1:  # Admin
            cur.execute("""
                SELECT admin_id, user_id, admin_permissions
                FROM admin
                WHERE user_id = %s
            """, (user_id,))
            r = cur.fetchone()
            if r:
                role_blob = dict(r)

        elif type_id == 2:  # Sponsor
            cur.execute("""
                SELECT sponsor_id, user_id, name, description
                FROM sponsor
                WHERE user_id = %s
            """, (user_id,))
            r = cur.fetchone()
            if r:
                role_blob = dict(r)

        elif type_id == 3:  # Driver
            cur.execute("""
                SELECT d.driver_id, d.user_id, d.balance, d.sponsor_id,
                       sp.name AS sponsor_name
                FROM driver d
                LEFT JOIN sponsor sp ON sp.sponsor_id = d.sponsor_id
                WHERE d.user_id = %s
            """, (user_id,))
            r = cur.fetchone()
            if r:
                role_blob = dict(r)

        return jsonify({
            "user": user_data,
            "type": type_info,
            "role_name": role_name,
            "role": role_blob
        })

    finally:
        if cur is not None:
            cur.close()
        conn.close()

@account_bp.post("/api/sponsor/bulk_drivers")
@token_required
def sponsor_bulk_drivers():
    """
    Sponsor-only bulk loader for Drivers.
    File format per line (pipe-delimited): <type>|organization name|first|last|email
    For Sponsors: <type> must be 'D' and organization name MUST be empty (sponsors cannot set org here).
    Continues on errors; returns per-line results.
    Accepts form fields:
      - file    (multipart file)
      - dry_run (1/0)  -> if 1: validate only; no DB writes
    """
    # Identify caller
    claims = getattr(g, "decoded_token", {}) or {}
    user_id = claims.get("user_id") or claims.get("sub")
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Unauthorized"}), 401

    dry_run = request.form.get("dry_run") in ("1", "true", "True", "yes", "on")

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        # Ensure caller is a Sponsor (type_id == 2)
        cur.execute("SELECT type_id FROM `user` WHERE user_id = %s", (user_id,))
        u = cur.fetchone()
        if not u or u["type_id"] != 2:
            return jsonify({"error": "Only Sponsor users may use this endpoint"}), 403

        # Find this sponsor user's sponsor_id (their org)
        cur.execute("SELECT sponsor_id, name FROM sponsor WHERE user_id = %s", (user_id,))
        srow = cur.fetchone()
        if not srow:
            return jsonify({"error": "Sponsor organization not found for current user"}), 403
        sponsor_id = srow["sponsor_id"]
        sponsor_name = srow.get("name")

        if "file" not in request.files:
            return jsonify({"error": "Missing file"}), 400

        raw = request.files["file"].read()
        try:
            text = raw.decode("utf-8-sig", errors="replace")
        except Exception:
            text = raw.decode("utf-8", errors="replace")

        results = []
        warnings = []
        processed = success = errors = 0

        for idx, line in enumerate(io.StringIO(text), start=1):
            processed += 1
            original = line.rstrip("\r\n")
            line = original.strip()
            if not line:
                results.append({"line": idx, "ok": True, "type": "", "message": "blank line (skipped)"})
                continue

            parts = line.split("|")
            if len(parts) < 5:
                errors += 1
                results.append({"line": idx, "ok": False, "type": "", "message": "Wrong column count; expected 5"})
                continue

            rec_type, org_name, first, last, email = [p.strip() for p in parts[:5]]

            # Enforce Sponsor rules: only 'D' type and org_name must be empty
            if rec_type not in ("D", "d"):
                errors += 1
                results.append({"line": idx, "ok": False, "type": rec_type, "email": email,
                                "message": "Sponsors may only upload 'D' rows (Drivers)."})
                continue
            if org_name:
                errors += 1
                results.append({"line": idx, "ok": False, "type": rec_type, "email": email,
                                "message": "For Sponsors, organization name must be blank."})
                continue
            if not first or not last or not email or not EMAIL_RE.match(email):
                errors += 1
                results.append({"line": idx, "ok": False, "type": rec_type, "email": email,
                                "message": "Missing/invalid first, last, or email."})
                continue

            # Upsert driver under this sponsor_id
            try:
                if dry_run:
                    success += 1
                    results.append({"line": idx, "ok": True, "type": "D", "email": email,
                                    "message": f"[dry-run] would add/update driver for sponsor_id={sponsor_id}"})
                    continue

                # If a user with this email exists, reuse; else create new driver user
                cur.execute("SELECT user_id, type_id FROM `user` WHERE email=%s", (email,))
                existing = cur.fetchone()

                if existing:
                    driver_user_id = existing["user_id"]
                    if existing["type_id"] != 3:
                        warnings.append(f"line {idx}: existing user {email} has type_id={existing['type_id']} (not 3/driver).")
                else:
                    # Create user as driver (type_id = 3)
                    cur.execute("""
                        INSERT INTO `user` (first_name, last_name, email, ssn, city, state, country, type_id)
                        VALUES (%s,%s,%s,NULL,NULL,NULL,NULL,3)
                    """, (first, last, email))
                    driver_user_id = cur.lastrowid

                    # Credentials: username=email, random temp password (hashing handled elsewhere if needed)
                    temp_pw = secrets.token_urlsafe(12)
                    cur.execute("""
                        INSERT INTO user_credentials (user_id, username, password)
                        VALUES (%s, %s, %s)
                    """, (driver_user_id, email, temp_pw))

                    # Minimal login_info
                    cur.execute("""
                        INSERT INTO login_info (user_id, failed_attempts, is_locked, locked_until, security_question, security_answer)
                        VALUES (%s, 0, 0, NULL, %s, %s)
                    """, (driver_user_id, "Default question", "Default answer"))

                # Ensure driver record points to this sponsor
                cur.execute("SELECT driver_id, sponsor_id FROM driver WHERE user_id=%s", (driver_user_id,))
                drow = cur.fetchone()
                if drow:
                    if drow["sponsor_id"] != sponsor_id:
                        cur.execute("UPDATE driver SET sponsor_id=%s WHERE driver_id=%s", (sponsor_id, drow["driver_id"]))
                else:
                    cur.execute("""
                        INSERT INTO driver (user_id, balance, sponsor_id) VALUES (%s, %s, %s)
                    """, (driver_user_id, 0.00, sponsor_id))

                conn.commit()
                success += 1
                results.append({"line": idx, "ok": True, "type": "D", "email": email,
                                "message": "Driver upserted under current sponsor."})

            except Exception as ex:
                conn.rollback()
                errors += 1
                results.append({"line": idx, "ok": False, "type": "D", "email": email,
                                "message": f"DB error: {str(ex)}"})

        return jsonify({
            "processed": processed,
            "success": success,
            "errors": errors,
            "sponsor_id": sponsor_id,
            "sponsor_name": sponsor_name,
            "warnings": warnings,
            "rows": results
        }), 200

    finally:
        if cur is not None:
            cur.close()
        conn.close()

@account_bp.route('/api/purchase', methods=['POST'])
@token_required
def purchase_api():
    """
    Process cart purchase:
    - Verify driver has enough points
    - Deduct points from balance
    - Create transaction records
    """
    user_id = _claims_user_id()
    
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 401
    
    # Get cart items from request
    data = request.get_json() or {}
    cart_items = data.get('items', [])
    
    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400
    
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        conn.autocommit = False
        cur = conn.cursor(dictionary=True)
        
        # 1. Verify user is a driver
        cur.execute("""
            SELECT u.type_id, d.driver_id, d.balance, d.sponsor_id 
            FROM `user` u
            LEFT JOIN driver d ON u.user_id = d.user_id
            WHERE u.user_id = %s
        """, (user_id,))
        user_data = cur.fetchone()
        
        if not user_data or user_data['type_id'] != 3:
            return jsonify({"error": "Only drivers can make purchases"}), 403
        
        if not user_data['driver_id']:
            return jsonify({"error": "Driver record not found"}), 404
        
        current_balance = float(user_data['balance'])
        driver_id = user_data['driver_id']
        sponsor_id = user_data['sponsor_id']
        
        # 2. Calculate total cost (items are already in points)
        total_points = sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items)
        total_dollars = total_points / 100.0  # Convert points back to dollars for DB
        
        # 3. Check if driver has enough balance
        if current_balance < total_dollars:
            return jsonify({
                "error": "Insufficient balance",
                "required": total_points,
                "available": int(current_balance * 100),
                "shortfall": int((total_dollars - current_balance) * 100)
            }), 400
        
        # 4. Deduct from driver balance
        new_balance = current_balance - total_dollars
        cur.execute("""
            UPDATE driver 
            SET balance = %s 
            WHERE driver_id = %s
        """, (new_balance, driver_id))
        
        # 5. Create transaction records for each item
        transaction_time = datetime.datetime.now()
        for item in cart_items:
            item_price_dollars = (item.get('price', 0) * item.get('quantity', 1)) / 100.0
            cur.execute("""
                INSERT INTO transactions (`date`, user_id, amount, item_id)
                VALUES (%s, %s, %s, %s)
            """, (
                transaction_time,
                user_id,
                -item_price_dollars,  # Negative for purchases
                item.get('id', None)  # Product ID from Fake Store API
            ))
        
        # 6. Calculate 1% commission for sponsor (if sponsor exists)
        if sponsor_id:
            commission = total_dollars * 0.01
            print(f"Commission of ${commission:.2f} for sponsor_id {sponsor_id}")
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Purchase completed successfully",
            "items_purchased": len(cart_items),
            "total_spent": total_points,
            "new_balance": int(new_balance * 100),
            "previous_balance": int(current_balance * 100)
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error in /api/purchase: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Purchase failed: {str(e)}"}), 500
        
    finally:
        if cur is not None:
            cur.close()
        if conn:
            conn.close()