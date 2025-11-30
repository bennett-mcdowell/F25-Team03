# src/Backend/orders.py
from flask import Blueprint, jsonify, request, g
from utils.db import get_db_connection
from auth import token_required, require_role
import logging

orders_bp = Blueprint("orders", __name__)
logger = logging.getLogger('orders')

def _claims_user_id():
    """Helper to extract user_id from JWT claims"""
    claims = getattr(g, "decoded_token", {}) or {}
    return claims.get("user_id") or claims.get("sub")

def _get_user_role():
    """Helper to extract role from JWT claims"""
    claims = getattr(g, "decoded_token", {}) or {}
    return claims.get("role")


@orders_bp.route("/api/orders", methods=["GET"])
@token_required
def get_orders():
    """
    Get orders based on user role:
    - Drivers: See only their orders
    - Sponsors: See orders from their enrolled drivers (purchased with their points)
    - Admins: See all orders
    
    Query params:
    - status: Filter by order status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
    - driver_id: Filter by specific driver (admin/sponsor only)
    - sponsor_id: Filter by specific sponsor (admin only)
    - start_date: Filter orders created after this date (YYYY-MM-DD)
    - end_date: Filter orders created before this date (YYYY-MM-DD)
    """
    user_id = _claims_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 401
    
    role = _get_user_role()
    
    # Get query parameters
    status_filter = request.args.get('status')
    driver_id_filter = request.args.get('driver_id')
    sponsor_id_filter = request.args.get('sponsor_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Build the base query based on role
        if role == 'driver':
            # Drivers see only their orders
            cur.execute("SELECT driver_id FROM driver WHERE user_id = %s", (user_id,))
            driver_row = cur.fetchone()
            if not driver_row:
                return jsonify({"error": "Driver not found"}), 404
            
            driver_id = driver_row['driver_id']
            
            base_query = """
                SELECT 
                    o.order_id,
                    o.driver_id,
                    o.sponsor_id,
                    o.total_points,
                    o.status,
                    o.tracking_number,
                    o.notes,
                    o.created_at,
                    o.updated_at,
                    CONCAT(u.first_name, ' ', u.last_name) as driver_name,
                    s.name as sponsor_name
                FROM orders o
                JOIN driver d ON o.driver_id = d.driver_id
                JOIN `user` u ON d.user_id = u.user_id
                JOIN sponsor s ON o.sponsor_id = s.sponsor_id
                WHERE o.driver_id = %s
            """
            params = [driver_id]
            
        elif role == 'sponsor':
            # Sponsors see orders from their drivers (purchased with their points)
            cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (user_id,))
            sponsor_row = cur.fetchone()
            if not sponsor_row:
                return jsonify({"error": "Sponsor not found"}), 404
            
            sponsor_id = sponsor_row['sponsor_id']
            
            base_query = """
                SELECT 
                    o.order_id,
                    o.driver_id,
                    o.sponsor_id,
                    o.total_points,
                    o.status,
                    o.tracking_number,
                    o.notes,
                    o.created_at,
                    o.updated_at,
                    CONCAT(u.first_name, ' ', u.last_name) as driver_name,
                    s.name as sponsor_name
                FROM orders o
                JOIN driver d ON o.driver_id = d.driver_id
                JOIN `user` u ON d.user_id = u.user_id
                JOIN sponsor s ON o.sponsor_id = s.sponsor_id
                WHERE o.sponsor_id = %s
            """
            params = [sponsor_id]
            
        elif role == 'admin':
            # Admins see all orders
            base_query = """
                SELECT 
                    o.order_id,
                    o.driver_id,
                    o.sponsor_id,
                    o.total_points,
                    o.status,
                    o.tracking_number,
                    o.notes,
                    o.created_at,
                    o.updated_at,
                    CONCAT(u.first_name, ' ', u.last_name) as driver_name,
                    s.name as sponsor_name
                FROM orders o
                JOIN driver d ON o.driver_id = d.driver_id
                JOIN `user` u ON d.user_id = u.user_id
                JOIN sponsor s ON o.sponsor_id = s.sponsor_id
                WHERE 1=1
            """
            params = []
        else:
            return jsonify({"error": "Invalid role"}), 403
        
        # Add filters
        if status_filter:
            base_query += " AND o.status = %s"
            params.append(status_filter)
        
        if driver_id_filter and role in ['admin', 'sponsor']:
            base_query += " AND o.driver_id = %s"
            params.append(int(driver_id_filter))
        
        if sponsor_id_filter and role == 'admin':
            base_query += " AND o.sponsor_id = %s"
            params.append(int(sponsor_id_filter))
        
        if start_date:
            base_query += " AND DATE(o.created_at) >= %s"
            params.append(start_date)
        
        if end_date:
            base_query += " AND DATE(o.created_at) <= %s"
            params.append(end_date)
        
        # Order by most recent first
        base_query += " ORDER BY o.created_at DESC"
        
        # Execute query
        cur.execute(base_query, params)
        orders = cur.fetchall() or []
        
        # Get order items for each order
        for order in orders:
            cur.execute("""
                SELECT 
                    oi.order_item_id,
                    oi.product_id,
                    oi.quantity,
                    oi.points_per_item
                FROM order_items oi
                WHERE oi.order_id = %s
            """, (order['order_id'],))
            order['items'] = cur.fetchall() or []
        
        return jsonify({
            "orders": orders,
            "total": len(orders)
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_orders: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@orders_bp.route("/api/orders/<int:order_id>", methods=["GET"])
@token_required
def get_order_details(order_id):
    """
    Get detailed information about a specific order
    Permission check: drivers see only their orders, sponsors see their drivers' orders, admins see all
    """
    user_id = _claims_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 401
    
    role = _get_user_role()
    
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Get order with driver and sponsor info
        cur.execute("""
            SELECT 
                o.order_id,
                o.driver_id,
                o.sponsor_id,
                o.total_points,
                o.status,
                o.tracking_number,
                o.notes,
                o.created_at,
                o.updated_at,
                CONCAT(u.first_name, ' ', u.last_name) as driver_name,
                u.email as driver_email,
                s.name as sponsor_name
            FROM orders o
            JOIN driver d ON o.driver_id = d.driver_id
            JOIN `user` u ON d.user_id = u.user_id
            JOIN sponsor s ON o.sponsor_id = s.sponsor_id
            WHERE o.order_id = %s
        """, (order_id,))
        
        order = cur.fetchone()
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Permission check
        if role == 'driver':
            cur.execute("SELECT driver_id FROM driver WHERE user_id = %s", (user_id,))
            driver_row = cur.fetchone()
            if not driver_row or driver_row['driver_id'] != order['driver_id']:
                return jsonify({"error": "Permission denied"}), 403
        
        elif role == 'sponsor':
            cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (user_id,))
            sponsor_row = cur.fetchone()
            if not sponsor_row or sponsor_row['sponsor_id'] != order['sponsor_id']:
                return jsonify({"error": "Permission denied"}), 403
        
        # Get order items
        cur.execute("""
            SELECT 
                oi.order_item_id,
                oi.product_id,
                oi.quantity,
                oi.points_per_item
            FROM order_items oi
            WHERE oi.order_id = %s
        """, (order_id,))
        order['items'] = cur.fetchall() or []
        
        return jsonify({"order": order}), 200
        
    except Exception as e:
        logger.error(f"Error in get_order_details: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@orders_bp.route("/api/orders/<int:order_id>/cancel", methods=["POST"])
@token_required
def cancel_order(order_id):
    """
    Cancel an order (only PENDING orders can be cancelled)
    - Refunds points to driver's balance with sponsor
    - Logs the refund in driver_balance_changes
    - Creates an alert for the driver
    - Updates order status to CANCELLED
    
    Drivers, sponsors, and admins can cancel PENDING orders
    """
    user_id = _claims_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 401
    
    role = _get_user_role()
    
    data = request.get_json() or {}
    reason = data.get('reason', 'Order cancelled by user')
    
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        conn.autocommit = False
        cur = conn.cursor(dictionary=True)
        
        # Get order details
        cur.execute("""
            SELECT 
                o.order_id,
                o.driver_id,
                o.sponsor_id,
                o.total_points,
                o.status,
                d.user_id as driver_user_id
            FROM orders o
            JOIN driver d ON o.driver_id = d.driver_id
            WHERE o.order_id = %s
        """, (order_id,))
        
        order = cur.fetchone()
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Permission check
        if role == 'driver':
            cur.execute("SELECT driver_id FROM driver WHERE user_id = %s", (user_id,))
            driver_row = cur.fetchone()
            if not driver_row or driver_row['driver_id'] != order['driver_id']:
                return jsonify({"error": "Permission denied"}), 403
        
        elif role == 'sponsor':
            cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (user_id,))
            sponsor_row = cur.fetchone()
            if not sponsor_row or sponsor_row['sponsor_id'] != order['sponsor_id']:
                return jsonify({"error": "Permission denied"}), 403
        
        # Check if order can be cancelled
        if order['status'] != 'PENDING':
            return jsonify({
                "error": f"Cannot cancel order with status {order['status']}. Only PENDING orders can be cancelled."
            }), 400
        
        # Get driver_sponsor_id for this driver-sponsor relationship
        cur.execute("""
            SELECT driver_sponsor_id, balance
            FROM driver_sponsor
            WHERE driver_id = %s AND sponsor_id = %s
        """, (order['driver_id'], order['sponsor_id']))
        
        ds_row = cur.fetchone()
        if not ds_row:
            return jsonify({"error": "Driver-sponsor relationship not found"}), 404
        
        driver_sponsor_id = ds_row['driver_sponsor_id']
        current_balance = float(ds_row['balance'])
        
        # Refund points (convert from points to dollars)
        refund_amount = order['total_points'] / 100.0
        new_balance = current_balance + refund_amount
        
        # Update driver_sponsor balance
        cur.execute("""
            UPDATE driver_sponsor
            SET balance = %s
            WHERE driver_sponsor_id = %s
        """, (new_balance, driver_sponsor_id))
        
        # Log the refund in driver_balance_changes
        cur.execute("""
            INSERT INTO driver_balance_changes
                (driver_id, sponsor_id, reason, points_change, balance_after)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            order['driver_id'],
            order['sponsor_id'],
            f"Order #{order_id} cancelled: {reason}",
            refund_amount,
            new_balance
        ))
        
        # Update order status and add note
        cancel_note = f"Cancelled: {reason}"
        if order.get('notes'):
            cancel_note = f"{order['notes']}\n{cancel_note}"
        
        cur.execute("""
            UPDATE orders
            SET status = 'CANCELLED',
                notes = %s,
                updated_at = NOW()
            WHERE order_id = %s
        """, (cancel_note, order_id))
        
        # Create alert for driver
        cur.execute("""
            INSERT INTO driver_alerts (driver_id, alert_type_id, message, is_read, created_at)
            VALUES (%s, 2, %s, 0, NOW())
        """, (
            order['driver_id'],
            f"Order #{order_id} has been cancelled. {int(refund_amount * 100)} points have been refunded to your account."
        ))
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Order cancelled successfully",
            "order_id": order_id,
            "refunded_points": int(refund_amount * 100),
            "new_balance": int(new_balance * 100)
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Error cancelling order {order_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@orders_bp.route("/api/orders/<int:order_id>", methods=["PUT"])
@token_required
def update_order(order_id):
    """
    Update order details (admin and sponsor only)
    Can update: tracking_number, notes
    Cannot update: total_points, driver_id, sponsor_id (these are immutable)
    """
    user_id = _claims_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 401
    
    role = _get_user_role()
    
    # Only admin and sponsor can update orders
    if role not in ['admin', 'sponsor']:
        return jsonify({"error": "Permission denied"}), 403
    
    data = request.get_json() or {}
    
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        conn.autocommit = False
        cur = conn.cursor(dictionary=True)
        
        # Get order details
        cur.execute("""
            SELECT order_id, driver_id, sponsor_id, status
            FROM orders
            WHERE order_id = %s
        """, (order_id,))
        
        order = cur.fetchone()
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Permission check for sponsors
        if role == 'sponsor':
            cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (user_id,))
            sponsor_row = cur.fetchone()
            if not sponsor_row or sponsor_row['sponsor_id'] != order['sponsor_id']:
                return jsonify({"error": "Permission denied"}), 403
        
        # Cannot update delivered or cancelled orders
        if order['status'] in ['DELIVERED', 'CANCELLED']:
            return jsonify({
                "error": f"Cannot update {order['status']} orders"
            }), 400
        
        # Build update query
        updates = []
        params = []
        
        if 'tracking_number' in data:
            updates.append("tracking_number = %s")
            params.append(data['tracking_number'])
        
        if 'notes' in data:
            updates.append("notes = %s")
            params.append(data['notes'])
        
        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400
        
        # Add updated_at
        updates.append("updated_at = NOW()")
        params.append(order_id)
        
        # Execute update
        query = f"UPDATE orders SET {', '.join(updates)} WHERE order_id = %s"
        cur.execute(query, params)
        
        conn.commit()
        
        # Get updated order
        cur.execute("""
            SELECT 
                o.order_id,
                o.driver_id,
                o.sponsor_id,
                o.total_points,
                o.status,
                o.tracking_number,
                o.notes,
                o.created_at,
                o.updated_at
            FROM orders o
            WHERE o.order_id = %s
        """, (order_id,))
        
        updated_order = cur.fetchone()
        
        return jsonify({
            "success": True,
            "message": "Order updated successfully",
            "order": updated_order
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Error updating order {order_id}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@orders_bp.route("/api/orders/<int:order_id>/status", methods=["PUT"])
@token_required
def update_order_status(order_id):
    """
    Update order status (admin and sponsor only)
    Valid transitions:
    - PENDING -> PROCESSING
    - PROCESSING -> SHIPPED
    - SHIPPED -> DELIVERED
    
    Creates alerts for drivers on status changes
    """
    user_id = _claims_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 401
    
    role = _get_user_role()
    
    # Only admin and sponsor can update status
    if role not in ['admin', 'sponsor']:
        return jsonify({"error": "Permission denied"}), 403
    
    data = request.get_json() or {}
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({"error": "status required"}), 400
    
    valid_statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
    
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        conn.autocommit = False
        cur = conn.cursor(dictionary=True)
        
        # Get order details
        cur.execute("""
            SELECT o.order_id, o.driver_id, o.sponsor_id, o.status, o.tracking_number
            FROM orders o
            WHERE o.order_id = %s
        """, (order_id,))
        
        order = cur.fetchone()
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Permission check for sponsors
        if role == 'sponsor':
            cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (user_id,))
            sponsor_row = cur.fetchone()
            if not sponsor_row or sponsor_row['sponsor_id'] != order['sponsor_id']:
                return jsonify({"error": "Permission denied"}), 403
        
        current_status = order['status']
        
        # Validate status transition
        valid_transitions = {
            'PENDING': ['PROCESSING', 'CANCELLED'],
            'PROCESSING': ['SHIPPED', 'CANCELLED'],
            'SHIPPED': ['DELIVERED'],
            'DELIVERED': [],
            'CANCELLED': []
        }
        
        if new_status not in valid_transitions.get(current_status, []):
            return jsonify({
                "error": f"Invalid status transition from {current_status} to {new_status}"
            }), 400
        
        # Update order status
        cur.execute("""
            UPDATE orders
            SET status = %s,
                updated_at = NOW()
            WHERE order_id = %s
        """, (new_status, order_id))
        
        # Create alert for driver
        alert_messages = {
            'PROCESSING': f"Your order #{order_id} is now being processed.",
            'SHIPPED': f"Your order #{order_id} has been shipped!" + (f" Tracking: {order['tracking_number']}" if order['tracking_number'] else ""),
            'DELIVERED': f"Your order #{order_id} has been delivered!",
            'CANCELLED': f"Your order #{order_id} has been cancelled."
        }
        
        alert_message = alert_messages.get(new_status, f"Order #{order_id} status updated to {new_status}")
        
        cur.execute("""
            INSERT INTO driver_alerts (driver_id, alert_type_id, message, is_read, created_at)
            VALUES (%s, 2, %s, 0, NOW())
        """, (order['driver_id'], alert_message))
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": f"Order status updated to {new_status}",
            "order_id": order_id,
            "new_status": new_status,
            "previous_status": current_status
        }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Error updating order status for order {order_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()