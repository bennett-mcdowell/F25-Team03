# src/Backend/sponsor.py
from flask import Blueprint, jsonify, g, request
from utils.db import get_db_connection
from auth import token_required
import mysql.connector
import json

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

@sponsor_bp.route("/api/sponsor/driver/<int:driver_id>/reject", methods=["POST"])
@token_required
def reject_pending_driver(driver_id):
    """
    Reject a pending driver application for the logged-in sponsor.
    Sets driver_sponsor.status = 'INACTIVE'
    """
    sponsor_user_id = getattr(g, "decoded_token", {}).get("user_id") or getattr(g, "decoded_token", {}).get("sub")
    if not sponsor_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    reason = data.get("reason", "No reason provided")

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (sponsor_user_id,))
        sponsor = cur.fetchone()
        if not sponsor:
            return jsonify({"error": "User is not a sponsor"}), 403
        sponsor_id = sponsor["sponsor_id"]

        cur.execute(
            """
            UPDATE driver_sponsor
            SET status = 'INACTIVE',
                last_change_reason = %s
            WHERE driver_id = %s
              AND sponsor_id = %s
              AND status = 'PENDING'
            """,
            (reason, driver_id, sponsor_id)
        )

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "No pending record found for this driver"}), 404

        conn.commit()

        return jsonify({"message": "Driver rejected successfully", "reason": reason}), 200

    except mysql.connector.Error as e:
        conn.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500
    finally:
        if cur:
            cur.close()
        conn.close()


@sponsor_bp.route("/api/sponsor/catalog/filters", methods=["GET"])
@token_required
def get_catalog_filters():
    """
    Get the sponsor's catalog filter settings (allowed categories).
    Returns: { allowed_categories: string[] | null }
    - null means all categories are allowed
    - [] means no categories allowed (disabled catalog)
    - ['electronics', 'jewelery'] means only those categories
    """
    sponsor_user_id = _claims_user_id()
    if not sponsor_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        cur.execute(
            "SELECT allowed_categories FROM sponsor WHERE user_id = %s",
            (sponsor_user_id,)
        )
        sponsor = cur.fetchone()
        if not sponsor:
            return jsonify({"error": "Forbidden: not a sponsor"}), 403

        # Parse JSON if present
        allowed_categories = sponsor.get("allowed_categories")
        if allowed_categories:
            try:
                allowed_categories = json.loads(allowed_categories)
            except (json.JSONDecodeError, TypeError):
                allowed_categories = None  # Invalid JSON, treat as "all allowed"

        return jsonify({
            "allowed_categories": allowed_categories
        }), 200

    except mysql.connector.Error as e:
        return jsonify({"error": "DB error", "details": str(e)}), 500
    finally:
        if cur:
            cur.close()
        conn.close()


@sponsor_bp.route("/api/sponsor/catalog/filters", methods=["PUT"])
@token_required
def update_catalog_filters():
    """
    Update the sponsor's catalog filter settings.
    Body: { allowed_categories: string[] | null }
    - null = allow all categories
    - [] = allow no categories
    - ['electronics'] = only allow electronics
    """
    sponsor_user_id = _claims_user_id()
    if not sponsor_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    allowed_categories = data.get("allowed_categories")

    # Validate input
    if allowed_categories is not None and not isinstance(allowed_categories, list):
        return jsonify({"error": "allowed_categories must be an array or null"}), 400

    # Valid categories from Fake Store API
    VALID_CATEGORIES = ["electronics", "jewelery", "men's clothing", "women's clothing"]
    
    if allowed_categories is not None:
        for cat in allowed_categories:
            if cat not in VALID_CATEGORIES:
                return jsonify({
                    "error": f"Invalid category: {cat}",
                    "valid_categories": VALID_CATEGORIES
                }), 400

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        # Get sponsor_id
        cur.execute(
            "SELECT sponsor_id FROM sponsor WHERE user_id = %s",
            (sponsor_user_id,)
        )
        sponsor = cur.fetchone()
        if not sponsor:
            return jsonify({"error": "Forbidden: not a sponsor"}), 403

        # Convert to JSON string or NULL
        categories_json = json.dumps(allowed_categories) if allowed_categories is not None else None

        # Update the sponsor record
        cur.execute(
            """
            UPDATE sponsor
            SET allowed_categories = %s
            WHERE user_id = %s
            """,
            (categories_json, sponsor_user_id)
        )

        conn.commit()

        return jsonify({
            "message": "Catalog filters updated successfully",
            "allowed_categories": allowed_categories
        }), 200

    except mysql.connector.Error as e:
        conn.rollback()
        return jsonify({"error": "DB error", "details": str(e)}), 500
    finally:
        if cur:
            cur.close()
        conn.close()
@sponsor_bp.route("/api/sponsor/commission-summary", methods=["GET"])
@token_required
def get_commission_summary():
    """
    Get commission summary for the logged-in sponsor:
    - Total purchases made by drivers (points redeemed)
    - Total points awarded
    - Number of active drivers
    - Commission owed to development company (1% of total sales)
    
    Note: Commission is calculated as points_spent × point_value × 0.01
    Default point value is $0.01, so 100 points = $1.00, commission = $0.01
    """
    sponsor_user_id = _claims_user_id()
    if not sponsor_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        # Get sponsor_id and point_value (default to 0.01 if not set)
        cur.execute(
            "SELECT sponsor_id, COALESCE(point_value, 0.01) as point_value FROM sponsor WHERE user_id = %s",
            (sponsor_user_id,)
        )
        sponsor = cur.fetchone()
        if not sponsor:
            return jsonify({"error": "Forbidden: not a sponsor"}), 403
        
        sponsor_id = sponsor["sponsor_id"]
        point_value = float(sponsor.get("point_value", 0.01))  # Default $0.01 per point

        # Get all transactions for this sponsor's drivers
        cur.execute(
            """
            SELECT 
                t.transaction_id,
                t.date,
                t.amount,
                t.item_id,
                u.first_name,
                u.last_name,
                d.driver_id
            FROM transactions t
            INNER JOIN driver_sponsor ds ON t.driver_sponsor_id = ds.driver_sponsor_id
            INNER JOIN driver d ON ds.driver_id = d.driver_id
            INNER JOIN `user` u ON d.user_id = u.user_id
            WHERE ds.sponsor_id = %s
              AND ds.status = 'ACTIVE'
            ORDER BY t.date DESC
            """,
            (sponsor_id,)
        )
        
        transactions = cur.fetchall() or []

        # Calculate summary metrics
        total_points_redeemed = 0.0  # Points spent on purchases (negative transactions)
        total_points_awarded = 0.0   # Points given to drivers (positive transactions)
        purchase_count = 0
        
        for txn in transactions:
            amount = float(txn["amount"])
            if amount < 0:
                # This is a purchase/redemption
                total_points_redeemed += abs(amount)
                purchase_count += 1
            else:
                # This is points being awarded
                total_points_awarded += amount

        # Calculate dollar values and commission
        total_sales_dollars = total_points_redeemed * point_value
        commission_rate = 0.01  # 1% commission to development company
        commission_owed = total_sales_dollars * commission_rate

        # Get active driver count
        cur.execute(
            """
            SELECT COUNT(DISTINCT driver_id) as active_count
            FROM driver_sponsor
            WHERE sponsor_id = %s
              AND status = 'ACTIVE'
            """,
            (sponsor_id,)
        )
        driver_count_row = cur.fetchone()
        active_drivers = int(driver_count_row["active_count"]) if driver_count_row else 0

        # Format transaction history
        transaction_history = []
        for txn in transactions:
            amount = float(txn["amount"])
            transaction_history.append({
                "transaction_id": txn["transaction_id"],
                "date": txn["date"].isoformat() if txn["date"] else None,
                "driver_name": f"{txn['first_name']} {txn['last_name']}",
                "driver_id": txn["driver_id"],
                "points": abs(amount),
                "dollar_value": abs(amount) * point_value,
                "item_id": txn["item_id"],
                "type": "purchase" if amount < 0 else "award"
            })

        return jsonify({
            "summary": {
                "total_points_redeemed": round(total_points_redeemed, 2),
                "total_points_awarded": round(total_points_awarded, 2),
                "total_sales_dollars": round(total_sales_dollars, 2),
                "purchase_count": purchase_count,
                "active_drivers": active_drivers,
                "commission_owed": round(commission_owed, 2),
                "commission_rate": commission_rate,
                "point_value": point_value
            },
            "transactions": transaction_history
        }), 200

    except mysql.connector.Error as e:
        return jsonify({"error": "DB error", "details": str(e)}), 500
    finally:
        if cur:
            cur.close()
        conn.close()


@sponsor_bp.route("/api/sponsor/driver/<int:driver_id>/purchase-history", methods=["GET"])
@token_required
def get_driver_purchase_history(driver_id):
    """
    Get purchase history for a specific driver under this sponsor
    """
    sponsor_user_id = _claims_user_id()
    if not sponsor_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(dictionary=True)

        # Get sponsor_id and point_value
        cur.execute(
            "SELECT sponsor_id, COALESCE(point_value, 0.01) as point_value FROM sponsor WHERE user_id = %s",
            (sponsor_user_id,)
        )
        sponsor = cur.fetchone()
        if not sponsor:
            return jsonify({"error": "Forbidden: not a sponsor"}), 403
        
        sponsor_id = sponsor["sponsor_id"]
        point_value = float(sponsor.get("point_value", 0.01))

        # Verify driver is associated with this sponsor
        cur.execute(
            """
            SELECT driver_sponsor_id
            FROM driver_sponsor
            WHERE driver_id = %s
              AND sponsor_id = %s
              AND status = 'ACTIVE'
            """,
            (driver_id, sponsor_id)
        )
        
        if not cur.fetchone():
            return jsonify({"error": "Driver not found or not associated with this sponsor"}), 404

        # Get transactions for this driver-sponsor pair
        cur.execute(
            """
            SELECT 
                t.transaction_id,
                t.date,
                t.amount,
                t.item_id
            FROM transactions t
            INNER JOIN driver_sponsor ds ON t.driver_sponsor_id = ds.driver_sponsor_id
            WHERE ds.driver_id = %s
              AND ds.sponsor_id = %s
            ORDER BY t.date DESC
            """,
            (driver_id, sponsor_id)
        )
        
        transactions = cur.fetchall() or []

        # Format response
        purchase_history = []
        for txn in transactions:
            amount = float(txn["amount"])
            purchase_history.append({
                "transaction_id": txn["transaction_id"],
                "date": txn["date"].isoformat() if txn["date"] else None,
                "points": abs(amount),
                "dollar_value": abs(amount) * point_value,
                "item_id": txn["item_id"],
                "type": "purchase" if amount < 0 else "award"
            })

        return jsonify({
            "driver_id": driver_id,
            "transactions": purchase_history,
            "count": len(purchase_history),
            "point_value": point_value
        }), 200

    except mysql.connector.Error as e:
        return jsonify({"error": "DB error", "details": str(e)}), 500
    finally:
        if cur:
            cur.close()
        conn.close()
