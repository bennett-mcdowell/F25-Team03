# src/Backend/sponsor.py
from flask import Blueprint, jsonify, g
from utils.db import get_db_connection
from auth import token_required
import mysql.connector

sponsor_bp = Blueprint("sponsor", __name__)

def _claims_user_id():
    claims = getattr(g, "decoded_token", {}) or {}
    return claims.get("user_id") or claims.get("sub")

@sponsor_bp.route("/api/sponsor/pending-drivers", methods=["GET"])
@token_required
def get_pending_drivers():
    """
    Returns all drivers who have a PENDING relationship with THIS sponsor,
    plus how many ACTIVE sponsors each driver already has overall.
    Output per row:
      first_name, last_name, active_sponsor_count
    """

    sponsor_user_id = _claims_user_id()
    if not sponsor_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        sponsor_user_id = int(sponsor_user_id)
    except Exception:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        # 1. Find this sponsor's sponsor_id using their user_id
        cur.execute(
            """
            SELECT sponsor_id
            FROM sponsor
            WHERE user_id = %s
            """,
            (sponsor_user_id,)
        )
        sponsor_row = cur.fetchone()
        if not sponsor_row:
            # User is not a sponsor in the sponsor table
            return jsonify({"error": "Forbidden: not a sponsor"}), 403

        sponsor_id = sponsor_row["sponsor_id"]

        # 2. Pull pending driver requests for THIS sponsor
        # We:
        #   - Filter driver_sponsor to this sponsor_id and status='PENDING'
        #   - Join driver -> user to get first/last name of that driver
        #   - For each driver_id, compute how many ACTIVE sponsors they already have
        #
        # We'll compute active sponsor count using a subquery.
        #
        cur.execute(
            """
            SELECT
                u.first_name AS first_name,
                u.last_name  AS last_name,
                ds.driver_id AS driver_id,
                (
                    SELECT COUNT(*)
                    FROM driver_sponsor ds2
                    WHERE ds2.driver_id = ds.driver_id
                      AND ds2.status = 'ACTIVE'
                ) AS active_sponsor_count
            FROM driver_sponsor ds
            INNER JOIN driver d
                ON ds.driver_id = d.driver_id
            INNER JOIN `user` u
                ON d.user_id = u.user_id
            WHERE ds.sponsor_id = %s
              AND ds.status = 'PENDING'
            ORDER BY u.last_name, u.first_name
            """,
            (sponsor_id,)
        )

        rows = cur.fetchall() or []

        # shape response more explicitly
        pending_list = []
        for r in rows:
            pending_list.append({
                "first_name": r["first_name"],
                "last_name": r["last_name"],
                "driver_id": r["driver_id"],
                "active_sponsor_count": int(r["active_sponsor_count"] or 0),
            })

        return jsonify({
            "pending_drivers": pending_list,
            "count": len(pending_list)
        }), 200

    except mysql.connector.Error as e:
        return jsonify({"error": "DB error", "details": str(e)}), 500
    finally:
        if cur:
            cur.close()
        conn.close()

@sponsor_bp.route("/api/sponsor/driver/<int:driver_id>/approve", methods=["POST"])
@token_required
def approve_pending_driver(driver_id):
    """
    Approve a pending driver for the logged-in sponsor.
    Sets driver_sponsor.status = 'ACTIVE'
    """

    sponsor_user_id = getattr(g, "decoded_token", {}).get("user_id") or getattr(g, "decoded_token", {}).get("sub")
    if not sponsor_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        # Get sponsor_id for logged-in sponsor
        cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (sponsor_user_id,))
        sponsor = cur.fetchone()
        if not sponsor:
            return jsonify({"error": "User is not a sponsor"}), 403
        sponsor_id = sponsor["sponsor_id"]

        # Update driver_sponsor entry if it's pending
        cur.execute(
            """
            UPDATE driver_sponsor
            SET status = 'ACTIVE',
                since_at = NOW()
            WHERE driver_id = %s
              AND sponsor_id = %s
              AND status = 'PENDING'
            """,
            (driver_id, sponsor_id)
        )

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "No pending record found for this driver"}), 404

        conn.commit()

        return jsonify({"message": "Driver approved successfully"}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500
    finally:
        if cur:
            cur.close()
        conn.close()