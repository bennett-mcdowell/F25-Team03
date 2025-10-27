# src/Backend/account.py
from flask import Blueprint, jsonify, g, request
import logging
from utils.db import get_db_connection
from auth import token_required, require_role
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
            log = logging.getLogger('account')
            try:
                # 1) Find this user's driver_id
                cur.execute("SELECT driver_id FROM driver WHERE user_id = %s", (user_id,))
                drow = cur.fetchone()
                if drow:
                    driver_id = drow["driver_id"]

                    # Minimal role blob (no legacy sponsor_id/balance here)
                    role_blob = {"driver_id": driver_id}

                    # 2) Pull all sponsors (and per-pair balances) for this driver
                    cur.execute("""
                        SELECT
                            ds.driver_sponsor_id,
                            ds.balance,
                            ds.status,
                            ds.since_at,
                            ds.until_at,
                            s.sponsor_id,
                            s.name,
                            s.description
                        FROM driver_sponsor ds
                        JOIN sponsor s  ON s.sponsor_id = ds.sponsor_id
                        WHERE ds.driver_id = %s
                        ORDER BY s.name
                    """, (driver_id,))
                    sponsors = cur.fetchall() or []

                    # 3) Attach to response + total balance
                    role_blob["sponsors"] = sponsors
                    role_blob["total_balance"] = float(sum((row.get("balance") or 0) for row in sponsors))

            except Exception as ex:
                log.error('Driver lookup failed: %s', ex)

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

# Admin Accounts API
@account_bp.route("/api/admin/accounts", methods=["GET"])
@token_required
@require_role("admin")
def admin_accounts_api():
    
    
    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        # --- 1) Get all users ---
        cur.execute("SELECT * FROM `user`")
        users = cur.fetchall() or []

        results = []

        for u in users:
            user_id = u["user_id"]
            type_id = u.get("type_id")

            # Remove sensitive/tech fields if your constants exist
            user_data = {
                k: v for k, v in u.items()
                if k.lower() not in ["password", "created_at", "updated_at"]
            }

            # --- 2) Get user type info ---
            cur.execute("SELECT * FROM user_type WHERE type_id = %s", (type_id,))
            trow = cur.fetchone()
            type_info = dict(trow) if trow else None
            role_name = type_info.get("type_name") if type_info else None

            # --- 3) Role-specific details ---
            role_blob = None

            # Admin
            if type_id == 1:
                cur.execute("""
                    SELECT admin_id, user_id, admin_permissions
                    FROM admin
                    WHERE user_id = %s
                """, (user_id,))
                r = cur.fetchone()
                if r:
                    role_blob = dict(r)

            # Sponsor
            elif type_id == 2:
                cur.execute("""
                    SELECT sponsor_id, user_id, name, description
                    FROM sponsor
                    WHERE user_id = %s
                """, (user_id,))
                r = cur.fetchone()
                if r:
                    role_blob = dict(r)

            # Driver
            elif type_id == 3:
                # 1) Find this user's driver_id
                cur.execute("SELECT driver_id FROM driver WHERE user_id = %s", (user_id,))
                drow = cur.fetchone()
                if drow:
                    driver_id = drow["driver_id"]
                    role_blob = {"driver_id": driver_id}

                    # 2) Get sponsors for this driver
                    cur.execute("""
                        SELECT
                            ds.driver_sponsor_id,
                            ds.balance,
                            ds.status,
                            ds.since_at,
                            ds.until_at,
                            s.sponsor_id,
                            s.name,
                            s.description
                        FROM driver_sponsor ds
                        JOIN sponsor s ON s.sponsor_id = ds.sponsor_id
                        WHERE ds.driver_id = %s
                        ORDER BY s.name
                    """, (driver_id,))
                    sponsors = cur.fetchall() or []
                    role_blob["sponsors"] = sponsors
                    role_blob["total_balance"] = float(sum((row.get("balance") or 0) for row in sponsors))

            results.append({
                "user": user_data,
                "type": type_info,
                "role_name": role_name,
                "role": role_blob
            })

        return jsonify({"accounts": results}), 200

    except Exception as e:
        print("Error in /api/admin/accounts:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur:
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
        conn.close()

# Sponsor Accounts API
@account_bp.route("/api/sponsor/accounts", methods=["GET"])
@token_required
@require_role("sponsor")
def sponsor_accounts_api():
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
        cur = conn.cursor(dictionary=True)

        # --- Get sponsor info ---
        cur.execute("SELECT sponsor_id, name FROM sponsor WHERE user_id = %s", (user_id,))
        sponsor = cur.fetchone()
        if not sponsor:
            return jsonify({"error": "Sponsor not found"}), 404

        sponsor_id = sponsor["sponsor_id"]

        # --- Get drivers associated with this sponsor ---
        cur.execute("""   
            SELECT
            d.driver_id,
            u.user_id,
            u.first_name,
            u.last_name,
            u.email,
            ds.balance,
            ds.status,
            ds.since_at,
            ds.until_at
            FROM driver_sponsor ds
            JOIN driver d ON ds.driver_id = d.driver_id
            JOIN `user` u ON d.user_id = u.user_id
            WHERE ds.sponsor_id = %s
            ORDER BY u.last_name, u.first_name
        """, (sponsor_id,))
        drivers = cur.fetchall() or []

        # Count active drivers
        active_drivers = sum(1 for d in drivers if d.get("active"))

        return jsonify({
            "sponsor_id": sponsor_id,
            "sponsor_name": sponsor["name"],
            "active_drivers": active_drivers,
            "drivers": drivers
        })

    finally:
        if cur:
            cur.close()
        conn.close()


@account_bp.route("/api/sponsor/driver/<int:driver_id>/add_points", methods=["POST"])
@token_required
@require_role("sponsor")
def sponsor_add_points(driver_id):
    """
    Allow a sponsor to add points to a driver's balance.
    Expects JSON body: { "points": <number> }
    Returns the updated balance.
    """
    user_id = _claims_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    points = data.get("points")

    # Validate points
    if not points or not isinstance(points, (int, float)) or points <= 0:
        return jsonify({"error": "Invalid points value"}), 400

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        # Get sponsor_id for this user
        cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (user_id,))
        sponsor = cur.fetchone()
        if not sponsor:
            return jsonify({"error": "Sponsor not found"}), 404

        sponsor_id = sponsor["sponsor_id"]

        # Verify that this sponsor is associated with the driver
        cur.execute("""
            SELECT driver_sponsor_id, balance
            FROM driver_sponsor
            WHERE driver_id = %s AND sponsor_id = %s
        """, (driver_id, sponsor_id))
        ds_row = cur.fetchone()

        if not ds_row:
            return jsonify({"error": "Driver not found or not associated with this sponsor"}), 404

        driver_sponsor_id = ds_row["driver_sponsor_id"]
        current_balance = float(ds_row["balance"] or 0)

        # Add points to balance
        new_balance = current_balance + float(points)

        cur.execute("""
            UPDATE driver_sponsor
            SET balance = %s
            WHERE driver_sponsor_id = %s
        """, (new_balance, driver_sponsor_id))
        conn.commit()

        return jsonify({
            "message": "Points added successfully",
            "new_points": new_balance,
            "added": float(points)
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        logging.error(f"Error adding points: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        if cur:
            cur.close()
        conn.close()


@account_bp.post("/api/admin/bulk_accounts")
@token_required
def admin_bulk_accounts():
    """
    Admin-only bulk loader for Organizations (O), Sponsor users (S) and Driver users (D).
    File format (pipe-delimited):
      O|Organization Name
      S|Organization Name|First|Last|email@example.com
      D|Organization Name|First|Last|email@example.com

    Rules:
    - O creates/finds an organization anchor (implemented as a sponsor row with a special "anchor" sponsor user).
    - S creates a sponsor user and a sponsor row using the given organization name.
    - D creates/locates a driver user, ensures driver row, and links to the organization via driver_sponsor (balance starts 0.00).
    - Organization must exist (preexisting or created by 'O') before adding S/D rows.
    - Any invalid <type> => error for that line; processing continues.
    """
    import secrets
    import io
    import re

    EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    claims = getattr(g, "decoded_token", {}) or {}
    user_id = claims.get("user_id") or claims.get("sub")
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        # Ensure caller is Admin (type_id == 1)
        cur.execute("SELECT type_id FROM `user` WHERE user_id = %s", (user_id,))
        u = cur.fetchone()
        if not u or u["type_id"] != 1:
            return jsonify({"error": "Only Admin users may use this endpoint"}), 403

        if "file" not in request.files:
            return jsonify({"error": "Missing file"}), 400

        raw = request.files["file"].read()
        try:
            text = raw.decode("utf-8-sig", errors="replace")
        except Exception:
            text = raw.decode("utf-8", errors="replace")

        processed = success = errors = 0
        warnings = []
        results = []

        # Helper: find or create an "organization anchor"
        # We use the sponsor table as the organization anchor.
        # Because sponsor.user_id is NOT NULL, we create a special hidden sponsor user for 'O' rows if needed.
        def get_or_create_org_anchor(org_name: str):
            # prefer earliest (smallest id) to be canonical for this name
            cur.execute("SELECT sponsor_id FROM sponsor WHERE name = %s ORDER BY sponsor_id ASC LIMIT 1", (org_name,))
            s = cur.fetchone()
            if s:
                return s["sponsor_id"]

            # Create hidden sponsor "anchor" user
            # Make a deterministic-looking but unique email that won't collide with real users
            anchor_email = f"org+{secrets.token_urlsafe(8)}@example.invalid"
            cur.execute("""
                INSERT INTO `user` (first_name, last_name, email, ssn, city, state, country, type_id)
                VALUES (%s,%s,%s,NULL,NULL,NULL,NULL,2)
            """, ("Org", "Anchor", anchor_email))
            anchor_user_id = cur.lastrowid

            temp_pw = secrets.token_urlsafe(16)
            cur.execute("""
                INSERT INTO user_credentials (user_id, username, password)
                VALUES (%s, %s, %s)
            """, (anchor_user_id, anchor_email, temp_pw))

            cur.execute("""
                INSERT INTO login_info (user_id, failed_attempts, is_locked, locked_until, security_question, security_answer)
                VALUES (%s, 0, 0, NULL, %s, %s)
            """, (anchor_user_id, "N/A", "N/A"))

            cur.execute("""
                INSERT INTO sponsor (user_id, name, description)
                VALUES (%s, %s, %s)
            """, (anchor_user_id, org_name, "Organization anchor (auto-created by admin import)"))
            org_sponsor_id = cur.lastrowid
            return org_sponsor_id

        for idx, line in enumerate(io.StringIO(text), start=1):
            processed += 1
            original = line.rstrip("\r\n")
            row = original.strip()
            if not row:
                results.append({"line": idx, "ok": True, "type": "", "message": "blank line (skipped)"})
                continue

            parts = row.split("|")
            t = (parts[0] or "").strip() if len(parts) >= 1 else ""

            try:
                if t not in ("O", "S", "D"):
                    errors += 1
                    results.append({"line": idx, "ok": False, "type": t, "message": "Invalid record type (must be O, S, or D)."})
                    continue

                if t == "O":
                    # Expect: O|Org Name
                    if len(parts) < 2 or not parts[1].strip():
                        errors += 1
                        results.append({"line": idx, "ok": False, "type": "O", "message": "Missing organization name."})
                        continue
                    org_name = parts[1].strip()
                    org_id = get_or_create_org_anchor(org_name)
                    conn.commit()
                    success += 1
                    results.append({"line": idx, "ok": True, "type": "O", "message": f"Organization ensured: '{org_name}' (sponsor_id={org_id})."})
                    continue

                # From this point, require an org name
                if len(parts) < 2 or not parts[1].strip():
                    errors += 1
                    results.append({"line": idx, "ok": False, "type": t, "message": "Missing organization name."})
                    continue
                org_name = parts[1].strip()

                # Find or create anchor if a prior O didn't already
                org_id = get_or_create_org_anchor(org_name)

                if t == "S":
                    # Expect: S|Org Name|First|Last|Email
                    if len(parts) < 5:
                        errors += 1
                        results.append({"line": idx, "ok": False, "type": "S", "message": "Wrong column count; expected 5."})
                        continue
                    first, last, email = parts[2].strip(), parts[3].strip(), parts[4].strip()
                    if not first or not last or not email or not EMAIL_RE.match(email):
                        errors += 1
                        results.append({"line": idx, "ok": False, "type": "S", "email": email, "message": "Missing/invalid first, last, or email."})
                        continue

                    # Create/locate sponsor user
                    cur.execute("SELECT user_id, type_id FROM `user` WHERE email=%s", (email,))
                    existing = cur.fetchone()
                    if existing:
                        sponsor_user_id = existing["user_id"]
                        if existing["type_id"] != 2:
                            warnings.append(f"line {idx}: existing user {email} has type_id={existing['type_id']} (not 2/Sponsor).")
                    else:
                        cur.execute("""
                            INSERT INTO `user` (first_name, last_name, email, ssn, city, state, country, type_id)
                            VALUES (%s,%s,%s,NULL,NULL,NULL,NULL,2)
                        """, (first, last, email))
                        sponsor_user_id = cur.lastrowid

                        temp_pw = secrets.token_urlsafe(12)
                        cur.execute("""
                            INSERT INTO user_credentials (user_id, username, password)
                            VALUES (%s, %s, %s)
                        """, (sponsor_user_id, email, temp_pw))

                        cur.execute("""
                            INSERT INTO login_info (user_id, failed_attempts, is_locked, locked_until, security_question, security_answer)
                            VALUES (%s, 0, 0, NULL, %s, %s)
                        """, (sponsor_user_id, "Default question", "Default answer"))

                    # Create sponsor row for THIS sponsor user (same name as org)
                    cur.execute("""
                        INSERT INTO sponsor (user_id, name, description)
                        VALUES (%s, %s, %s)
                    """, (sponsor_user_id, org_name, f"Sponsor user for org '{org_name}' (admin import)"))
                    new_sponsor_id = cur.lastrowid

                    conn.commit()
                    success += 1
                    results.append({"line": idx, "ok": True, "type": "S", "email": email,
                                    "message": f"Sponsor user created/linked under org '{org_name}' (sponsor_id={new_sponsor_id})."})
                    continue

                if t == "D":
                    # Expect: D|Org Name|First|Last|Email
                    if len(parts) < 5:
                        errors += 1
                        results.append({"line": idx, "ok": False, "type": "D", "message": "Wrong column count; expected 5."})
                        continue
                    first, last, email = parts[2].strip(), parts[3].strip(), parts[4].strip()
                    if not first or not last or not email or not EMAIL_RE.match(email):
                        errors += 1
                        results.append({"line": idx, "ok": False, "type": "D", "email": email, "message": "Missing/invalid first, last, or email."})
                        continue

                    # Create/locate driver user
                    cur.execute("SELECT user_id, type_id FROM `user` WHERE email=%s", (email,))
                    existing = cur.fetchone()
                    if existing:
                        driver_user_id = existing["user_id"]
                        if existing["type_id"] != 3:
                            warnings.append(f"line {idx}: existing user {email} has type_id={existing['type_id']} (not 3/Driver).")
                    else:
                        cur.execute("""
                            INSERT INTO `user` (first_name, last_name, email, ssn, city, state, country, type_id)
                            VALUES (%s,%s,%s,NULL,NULL,NULL,NULL,3)
                        """, (first, last, email))
                        driver_user_id = cur.lastrowid

                        temp_pw = secrets.token_urlsafe(12)
                        cur.execute("""
                            INSERT INTO user_credentials (user_id, username, password)
                            VALUES (%s, %s, %s)
                        """, (driver_user_id, email, temp_pw))

                        cur.execute("""
                            INSERT INTO login_info (user_id, failed_attempts, is_locked, locked_until, security_question, security_answer)
                            VALUES (%s, 0, 0, NULL, %s, %s)
                        """, (driver_user_id, "Default question", "Default answer"))

                    # Ensure driver row
                    cur.execute("SELECT driver_id FROM driver WHERE user_id=%s", (driver_user_id,))
                    drow = cur.fetchone()
                    if drow:
                        driver_id = drow["driver_id"]
                    else:
                        cur.execute("INSERT INTO driver (user_id) VALUES (%s)", (driver_user_id,))
                        driver_id = cur.lastrowid

                    # Link to org anchor via driver_sponsor (balance 0 if new)
                    # Use canonical sponsor_id for the org name = earliest/anchor we ensured
                    try:
                        cur.execute("""
                            INSERT INTO driver_sponsor (driver_id, sponsor_id, balance, status, since_at)
                            VALUES (%s, %s, %s, 'ACTIVE', NOW())
                        """, (driver_id, org_id, 0.00))
                        link_msg = f"Linked to org '{org_name}' (sponsor_id={org_id})."
                    except Exception:
                        link_msg = f"Already linked to org '{org_name}' (sponsor_id={org_id})."

                    conn.commit()
                    success += 1
                    results.append({"line": idx, "ok": True, "type": "D", "email": email, "message": f"Driver upserted. {link_msg}"})
                    continue

            except Exception as ex:
                conn.rollback()
                errors += 1
                results.append({"line": idx, "ok": False, "type": t, "message": f"DB error: {str(ex)}"})

        return jsonify({
            "processed": processed,
            "success": success,
            "errors": errors,
            "warnings": warnings,
            "rows": results
        }), 200

    finally:
        if cur is not None:
            cur.close()
        conn.close()
