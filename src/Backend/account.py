# src/Backend/account.py
from flask import Blueprint, jsonify, request
from utils.db import get_db_connection
import jwt
import os

account_bp = Blueprint("account", __name__)

SENSITIVE_USER_FIELDS = {"ssn"}          # never return these
HIDE_TECH_FIELDS      = {"email_lc"}     # hide computed/lowercase helper

def _get_current_user_id_from_auth_header():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1].strip()
    try:
        decoded = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
        return decoded.get("user_id") or decoded.get("sub")
    except Exception:
        return None

@account_bp.route("/api/account", methods=["GET"])
def account_api():
    """
    Returns the current user's profile (sans ssn/email_lc), their user_type row,
    and role-specific details (admin | sponsor | driver).
    """
    user_id = _get_current_user_id_from_auth_header()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1) Base user
            cur.execute("SELECT * FROM `user` WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "User not found"}), 404
            cols = [d[0] for d in cur.description]
            user_data = {
                c: v for c, v in zip(cols, row)
                if c.lower() not in SENSITIVE_USER_FIELDS
                and c.lower() not in HIDE_TECH_FIELDS
            }

            # 2) Type info
            type_info, role_blob, role_name = None, None, None
            type_id = user_data.get("type_id")

            if type_id is not None:
                cur.execute("SELECT * FROM user_type WHERE type_id = %s", (type_id,))
                trow = cur.fetchone()
                if trow:
                    tcols = [d[0] for d in cur.description]
                    type_info = {c: v for c, v in zip(tcols, trow)}
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
                    rc = [d[0] for d in cur.description]
                    role_blob = {c: v for c, v in zip(rc, r)}

            elif type_id == 2:  # Sponsor
                cur.execute("""
                    SELECT sponsor_id, user_id, name, description
                    FROM sponsor
                    WHERE user_id = %s
                """, (user_id,))
                r = cur.fetchone()
                if r:
                    rc = [d[0] for d in cur.description]
                    role_blob = {c: v for c, v in zip(rc, r)}

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
                    rc = [d[0] for d in cur.description]
                    role_blob = {c: v for c, v in zip(rc, r)}

            return jsonify({
                "user": user_data,
                "type": type_info,
                "role_name": role_name,
                "role": role_blob
            })
    finally:
        conn.close()
