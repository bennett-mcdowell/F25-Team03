from flask import Blueprint, jsonify, request, g
from utils.db import get_db_connection
from auth import token_required, require_role
import logging
from datetime import datetime

admin_reports_bp = Blueprint("admin_reports", __name__)
logger = logging.getLogger('admin_reports')

def _claims_user_id():
    """Helper to extract user_id from JWT claims (DRY)"""
    claims = getattr(g, "decoded_token", {}) or {}
    return claims.get("user_id") or claims.get("sub")

def _parse_date_filters(args):
    """Parse and validate date filters from request args (DRY)"""
    start_date = args.get('start_date')
    end_date = args.get('end_date')
    
    # Validate date format if provided
    if start_date:
        try:
            datetime.strptime(start_date, '%Y-%m-%d')
        except ValueError:
            return None, None, "Invalid start_date format. Use YYYY-MM-DD"
    
    if end_date:
        try:
            datetime.strptime(end_date, '%Y-%m-%d')
        except ValueError:
            return None, None, "Invalid end_date format. Use YYYY-MM-DD"
    
    return start_date, end_date, None

def _build_date_filter(start_date, end_date, date_column='date'):
    """Build SQL date filter clause (DRY)"""
    conditions = []
    params = []
    
    if start_date:
        conditions.append(f"{date_column} >= %s")
        params.append(start_date)
    
    if end_date:
        conditions.append(f"{date_column} <= %s")
        params.append(end_date)
    
    if conditions:
        return " AND " + " AND ".join(conditions), params
    return "", params


# ============================================
# ADMIN REPORT ENDPOINTS
# ============================================

@admin_reports_bp.route("/api/admin/reports/sales", methods=["GET"])
@token_required
@require_role("admin")
def admin_sales_report():
    """
    Get sales/purchase analytics
    Query params: start_date, end_date, sponsor_id, view_type (summary/detailed)
    """
    try:
        # Parse filters
        start_date, end_date, error = _parse_date_filters(request.args)
        if error:
            return jsonify({"error": error}), 400
        
        sponsor_id = request.args.get('sponsor_id')
        # Treat 'all' or empty as no filter
        if sponsor_id == 'all' or not sponsor_id:
            sponsor_id = None
        else:
            try:
                sponsor_id = int(sponsor_id)
            except (ValueError, TypeError):
                sponsor_id = None
        
        view_type = request.args.get('view_type', 'summary')
        
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Build date filter
        date_filter, date_params = _build_date_filter(start_date, end_date, 't.date')
        
        if view_type == 'detailed':
            # Detailed view: individual transactions
            query = """
                SELECT 
                    s.name AS sponsor_name,
                    CONCAT(u.first_name, ' ', u.last_name) AS driver_name,
                    DATE(t.date) AS date,
                    CONCAT('Product ID: ', t.item_id) AS product,
                    t.amount AS amount,
                    t.transaction_id AS order_id
                FROM transactions t
                JOIN driver_sponsor ds ON t.driver_sponsor_id = ds.driver_sponsor_id
                JOIN sponsor s ON ds.sponsor_id = s.sponsor_id
                JOIN driver d ON ds.driver_id = d.driver_id
                JOIN `user` u ON d.user_id = u.user_id
                WHERE 1=1
            """
            
            params = []
            if sponsor_id:
                query += " AND s.sponsor_id = %s"
                params.append(sponsor_id)
            
            query += date_filter
            params.extend(date_params)
            query += " ORDER BY t.date DESC"
            
            cur.execute(query, tuple(params))
            
        else:
            # Summary view: aggregated by sponsor
            query = """
                SELECT 
                    s.sponsor_id,
                    s.name AS sponsor_name,
                    SUM(t.amount) AS total_sales,
                    COUNT(DISTINCT t.transaction_id) AS order_count,
                    COUNT(DISTINCT ds.driver_id) AS active_drivers
                FROM transactions t
                JOIN driver_sponsor ds ON t.driver_sponsor_id = ds.driver_sponsor_id
                JOIN sponsor s ON ds.sponsor_id = s.sponsor_id
                WHERE 1=1
            """
            
            params = []
            if sponsor_id:
                query += " AND s.sponsor_id = %s"
                params.append(sponsor_id)
            
            query += date_filter
            params.extend(date_params)
            query += " GROUP BY s.sponsor_id, s.name ORDER BY total_sales DESC"
            
            cur.execute(query, tuple(params))
        
        results = cur.fetchall() or []
        
        return jsonify({
            "report_type": "sales",
            "view_type": view_type,
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "sponsor_id": sponsor_id
            },
            "data": results
        }), 200
        
    except Exception as e:
        logger.error(f"Error in admin_sales_report: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@admin_reports_bp.route("/api/admin/reports/drivers", methods=["GET"])
@token_required
@require_role("admin")
def admin_drivers_report():
    """
    Get driver activity analytics
    Query params: start_date, end_date, sponsor_id
    """
    try:
        # Parse filters
        start_date, end_date, error = _parse_date_filters(request.args)
        if error:
            return jsonify({"error": error}), 400
        
        sponsor_id = request.args.get('sponsor_id')
        # Treat 'all' or empty as no filter
        if sponsor_id == 'all' or not sponsor_id:
            sponsor_id = None
        else:
            try:
                sponsor_id = int(sponsor_id)
            except (ValueError, TypeError):
                sponsor_id = None
        
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Build query
        query = """
            SELECT 
                d.driver_id,
                CONCAT(u.first_name, ' ', u.last_name) AS driver_name,
                u.email,
                COUNT(DISTINCT ds.sponsor_id) AS enrolled_sponsors,
                COALESCE(SUM(ds.balance), 0) AS total_balance,
                COALESCE(tx_stats.order_count, 0) AS order_count,
                COALESCE(tx_stats.total_spent, 0) AS total_spent
            FROM driver d
            JOIN `user` u ON d.user_id = u.user_id
            LEFT JOIN driver_sponsor ds ON d.driver_id = ds.driver_id AND ds.status = 'ACTIVE'
        """
        
        # Subquery for transaction stats with date filtering
        date_filter, date_params = _build_date_filter(start_date, end_date, 't.date')
        
        query += f"""
            LEFT JOIN (
                SELECT 
                    ds2.driver_id,
                    COUNT(t.transaction_id) AS order_count,
                    SUM(t.amount) AS total_spent
                FROM transactions t
                JOIN driver_sponsor ds2 ON t.driver_sponsor_id = ds2.driver_sponsor_id
                WHERE 1=1 {date_filter}
                GROUP BY ds2.driver_id
            ) tx_stats ON d.driver_id = tx_stats.driver_id
            WHERE 1=1
        """
        
        params = list(date_params)  # For subquery
        
        if sponsor_id:
            query += " AND ds.sponsor_id = %s"
            params.append(sponsor_id)
        
        query += " GROUP BY d.driver_id, u.first_name, u.last_name, u.email ORDER BY driver_name"
        
        cur.execute(query, tuple(params))
        results = cur.fetchall() or []
        
        return jsonify({
            "report_type": "drivers",
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "sponsor_id": sponsor_id
            },
            "data": results
        }), 200
        
    except Exception as e:
        logger.error(f"Error in admin_drivers_report: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@admin_reports_bp.route("/api/admin/reports/sponsors", methods=["GET"])
@token_required
@require_role("admin")
def admin_sponsors_report():
    """
    Get sponsor analytics
    Query params: start_date, end_date
    """
    try:
        # Parse filters
        start_date, end_date, error = _parse_date_filters(request.args)
        if error:
            return jsonify({"error": error}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Build date filter for transactions
        date_filter, date_params = _build_date_filter(start_date, end_date, 't.date')
        
        query = f"""
            SELECT 
                s.sponsor_id,
                s.name AS sponsor_name,
                s.description,
                COUNT(DISTINCT CASE WHEN ds.status = 'ACTIVE' THEN ds.driver_id END) AS active_drivers,
                COUNT(DISTINCT CASE WHEN ds.status = 'PENDING' THEN ds.driver_id END) AS pending_drivers,
                COALESCE(SUM(ds.balance), 0) AS total_points_distributed,
                COALESCE(tx_stats.total_spent, 0) AS total_points_spent,
                COALESCE(tx_stats.order_count, 0) AS order_count
            FROM sponsor s
            LEFT JOIN driver_sponsor ds ON s.sponsor_id = ds.sponsor_id
            LEFT JOIN (
                SELECT 
                    ds2.sponsor_id,
                    SUM(t.amount) AS total_spent,
                    COUNT(t.transaction_id) AS order_count
                FROM transactions t
                JOIN driver_sponsor ds2 ON t.driver_sponsor_id = ds2.driver_sponsor_id
                WHERE 1=1 {date_filter}
                GROUP BY ds2.sponsor_id
            ) tx_stats ON s.sponsor_id = tx_stats.sponsor_id
            GROUP BY s.sponsor_id, s.name, s.description
            ORDER BY active_drivers DESC, sponsor_name
        """
        
        cur.execute(query, tuple(date_params))
        results = cur.fetchall() or []
        
        return jsonify({
            "report_type": "sponsors",
            "filters": {
                "start_date": start_date,
                "end_date": end_date
            },
            "data": results
        }), 200
        
    except Exception as e:
        logger.error(f"Error in admin_sponsors_report: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@admin_reports_bp.route("/api/admin/reports/sales-by-driver", methods=["GET"])
@token_required
@require_role("admin")
def admin_sales_by_driver_report():
    """
    Sales by Driver Report
    Shows purchases made by each driver, optionally filtered by date range and sponsor
    
    Query params:
    - start_date: YYYY-MM-DD (optional)
    - end_date: YYYY-MM-DD (optional)
    - sponsor_id: int (optional) - filter to specific sponsor
    - driver_id: int (optional) - filter to specific driver
    """
    conn = None
    cur = None
    
    try:
        # Parse date filters
        start_date, end_date, error = _parse_date_filters(request.args)
        if error:
            return jsonify({"error": error}), 400
        
        # Get optional filters
        sponsor_id = request.args.get('sponsor_id', type=int)
        driver_id = request.args.get('driver_id', type=int)
        view_type = request.args.get('view_type', 'summary')
        
        logger.info(f"Sales by driver report - view_type: {view_type}, sponsor_id: {sponsor_id}, driver_id: {driver_id}")
        
        # Build date filter
        date_filter, date_params = _build_date_filter(start_date, end_date, 't.date')
        
        # Build additional filters
        additional_filters = []
        additional_params = []
        
        if sponsor_id:
            additional_filters.append("s.sponsor_id = %s")
            additional_params.append(sponsor_id)
        
        if driver_id:
            additional_filters.append("d.driver_id = %s")
            additional_params.append(driver_id)
        
        where_clause = ""
        if additional_filters:
            where_clause = " AND " + " AND ".join(additional_filters)
        
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        if view_type == 'detailed':
            # Detailed view: individual transactions
            query = f"""
                SELECT 
                    CONCAT(u.first_name, ' ', u.last_name) AS driver_name,
                    u.email AS driver_email,
                    s.name AS sponsor_name,
                    DATE(t.date) AS date,
                    CONCAT('Product ID: ', t.item_id) AS product,
                    t.amount AS amount,
                    t.transaction_id AS order_id
                FROM transactions t
                JOIN driver_sponsor ds ON t.driver_sponsor_id = ds.driver_sponsor_id
                JOIN sponsor s ON ds.sponsor_id = s.sponsor_id
                JOIN driver d ON ds.driver_id = d.driver_id
                JOIN `user` u ON d.user_id = u.user_id
                WHERE 1=1 {date_filter} {where_clause}
                ORDER BY t.date DESC
            """
        else:
            # Summary view: aggregated by driver and sponsor
            query = f"""
                SELECT 
                    d.driver_id,
                    CONCAT(u.first_name, ' ', u.last_name) AS driver_name,
                    u.email AS driver_email,
                    s.sponsor_id,
                    s.name AS sponsor_name,
                    COUNT(DISTINCT t.transaction_id) AS order_count,
                    SUM(t.amount) AS total_spent,
                    COUNT(DISTINCT DATE(t.date)) AS active_days
                FROM driver d
                JOIN `user` u ON d.user_id = u.user_id
                JOIN driver_sponsor ds ON ds.driver_id = d.driver_id
                JOIN sponsor s ON s.sponsor_id = ds.sponsor_id
                JOIN transactions t ON t.driver_sponsor_id = ds.driver_sponsor_id
                WHERE 1=1 {date_filter} {where_clause}
                GROUP BY d.driver_id, u.first_name, u.last_name, u.email, s.sponsor_id, s.name
                ORDER BY total_spent DESC, driver_name
            """
        
        params = tuple(date_params + additional_params)
        cur.execute(query, params)
        results = cur.fetchall() or []
        
        return jsonify({
            "report_type": "sales_by_driver",
            "view_type": view_type,
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "sponsor_id": sponsor_id,
                "driver_id": driver_id
            },
            "data": results
        }), 200
        
    except Exception as e:
        logger.error(f"Error in admin_sales_by_driver_report: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@admin_reports_bp.route("/api/admin/reports/invoice", methods=["GET"])
@token_required
@require_role("admin")
def admin_invoice_report():
    """
    Invoice Report
    Shows purchases by driver with calculated fees per sponsor
    Useful for billing sponsors based on driver purchases
    
    Query params:
    - start_date: YYYY-MM-DD (optional)
    - end_date: YYYY-MM-DD (optional)
    - sponsor_id: int (optional) - filter to specific sponsor
    - fee_rate: float (optional, default: 0.05) - fee percentage (e.g., 0.05 = 5%)
    """
    conn = None
    cur = None
    
    try:
        # Parse date filters
        start_date, end_date, error = _parse_date_filters(request.args)
        if error:
            return jsonify({"error": error}), 400
        
        # Get optional filters
        sponsor_id = request.args.get('sponsor_id', type=int)
        fee_rate = request.args.get('fee_rate', type=float, default=0.05)
        
        # Validate fee_rate
        if fee_rate < 0 or fee_rate > 1:
            return jsonify({"error": "fee_rate must be between 0 and 1"}), 400
        
        # Build date filter
        date_filter, date_params = _build_date_filter(start_date, end_date, 't.date')
        
        # Build sponsor filter
        sponsor_filter = ""
        sponsor_params = []
        if sponsor_id:
            sponsor_filter = " AND s.sponsor_id = %s"
            sponsor_params.append(sponsor_id)
        
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # KISS: Calculate totals per sponsor-driver pair using transactions table
        query = f"""
            SELECT 
                s.sponsor_id,
                s.name AS sponsor_name,
                d.driver_id,
                CONCAT(u.first_name, ' ', u.last_name) AS driver_name,
                u.email AS driver_email,
                COUNT(DISTINCT t.transaction_id) AS order_count,
                SUM(t.amount) AS total_purchases,
                %s AS fee_rate,
                ROUND(SUM(t.amount) * %s, 2) AS fee_amount
            FROM sponsor s
            JOIN driver_sponsor ds ON ds.sponsor_id = s.sponsor_id
            JOIN driver d ON d.driver_id = ds.driver_id
            JOIN `user` u ON d.user_id = u.user_id
            JOIN transactions t ON t.driver_sponsor_id = ds.driver_sponsor_id
            WHERE 1=1 {date_filter} {sponsor_filter}
            GROUP BY s.sponsor_id, s.name, d.driver_id, u.first_name, u.last_name, u.email
            ORDER BY s.name, total_purchases DESC
        """
        
        # Add fee_rate twice (once for display, once for calculation)
        params = tuple([fee_rate, fee_rate] + date_params + sponsor_params)
        cur.execute(query, params)
        results = cur.fetchall() or []
        
        # Calculate summary totals per sponsor
        sponsor_totals = {}
        for row in results:
            sid = row['sponsor_id']
            if sid not in sponsor_totals:
                sponsor_totals[sid] = {
                    'sponsor_id': sid,
                    'sponsor_name': row['sponsor_name'],
                    'driver_count': 0,
                    'total_purchases': 0,
                    'total_fees': 0
                }
            sponsor_totals[sid]['driver_count'] += 1
            sponsor_totals[sid]['total_purchases'] += float(row['total_purchases'] or 0)
            sponsor_totals[sid]['total_fees'] += float(row['fee_amount'] or 0)
        
        # Add summary row for each sponsor
        enhanced_results = []
        current_sponsor = None
        
        for row in results:
            if row['sponsor_id'] != current_sponsor:
                if current_sponsor is not None:
                    # Add summary row for previous sponsor
                    summary = sponsor_totals[current_sponsor]
                    enhanced_results.append({
                        'sponsor_id': summary['sponsor_id'],
                        'sponsor_name': summary['sponsor_name'],
                        'driver_name': f"TOTAL ({summary['driver_count']} drivers)",
                        'driver_email': '',
                        'order_count': None,
                        'total_purchases': summary['total_purchases'],
                        'fee_rate': f"{fee_rate * 100}%",
                        'fee_amount': summary['total_fees'],
                        'is_summary': True
                    })
                current_sponsor = row['sponsor_id']
            
            enhanced_results.append(row)
        
        # Add final summary if there were results
        if current_sponsor is not None:
            summary = sponsor_totals[current_sponsor]
            enhanced_results.append({
                'sponsor_id': summary['sponsor_id'],
                'sponsor_name': summary['sponsor_name'],
                'driver_name': f"TOTAL ({summary['driver_count']} drivers)",
                'driver_email': '',
                'order_count': None,
                'total_purchases': summary['total_purchases'],
                'fee_rate': f"{fee_rate * 100}%",
                'fee_amount': summary['total_fees'],
                'is_summary': True
            })
        
        return jsonify({
            "report_type": "invoice",
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "sponsor_id": sponsor_id,
                "fee_rate": fee_rate
            },
            "data": enhanced_results,
            "summary": list(sponsor_totals.values())
        }), 200
        
    except Exception as e:
        logger.error(f"Error in admin_invoice_report: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@admin_reports_bp.route("/api/admin/reports/audit-log", methods=["GET"])
@token_required
@require_role("admin")
def admin_audit_log_report():
    """
    Audit Log Report
    Comprehensive audit trail including:
    - Driver applications (approve/reject with reasons)
    - Point changes (additions/deductions with reasons)
    - Password changes
    - Login attempts (success/failure)
    
    Query params:
    - start_date: YYYY-MM-DD (optional)
    - end_date: YYYY-MM-DD (optional)
    - sponsor_id: int (optional) - filter to specific sponsor
    - category: string (optional) - filter by log type:
        'driver_applications', 'point_changes', 'password_changes', 'login_attempts', 'all'
    """
    conn = None
    cur = None
    
    try:
        # Parse date filters
        start_date, end_date, error = _parse_date_filters(request.args)
        if error:
            return jsonify({"error": error}), 400
        
        # Get optional filters
        sponsor_id = request.args.get('sponsor_id', type=int)
        category = request.args.get('category', 'all')
        
        # Validate category
        valid_categories = ['driver_applications', 'point_changes', 'password_changes', 'login_attempts', 'all']
        if category not in valid_categories:
            return jsonify({"error": f"Invalid category. Must be one of: {', '.join(valid_categories)}"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        audit_logs = []
        
        # Helper to parse pipe-delimited change_type string
        def parse_change_data(change_type):
            """Parse change_type like 'DRIVER_APPLICATION|driver_id:5|sponsor_id:2|status:ACTIVE|reason:Good driver'"""
            data = {}
            if not change_type:
                return data
            parts = change_type.split('|')
            for part in parts:
                if ':' in part:
                    key, value = part.split(':', 1)
                    data[key] = value
            return data
        
        # Build date filters
        date_filter_change, date_params_change = _build_date_filter(start_date, end_date, 'cl.occurred_at')
        date_filter_login, date_params_login = _build_date_filter(start_date, end_date, 'll.occurred_at')
        
        # 1. Driver Applications (from alerts table - SPONSORSHIP_CHANGE type)
        if category in ['driver_applications', 'all']:
            try:
                date_filter_alerts, date_params_alerts = _build_date_filter(start_date, end_date, 'a.date_created')
                
                sponsor_filter = "AND ds.sponsor_id = %s" if sponsor_id else ""
                sponsor_params = [sponsor_id] if sponsor_id else []
                
                query_alerts = f"""
                    SELECT 
                        a.date_created AS date,
                        'Driver Application' AS category,
                        s.name AS sponsor,
                        CONCAT(u.first_name, ' ', u.last_name) AS driver,
                        a.details,
                        ds.status,
                        a.alert_id
                    FROM alerts a
                    JOIN alert_type_definitions atd ON a.alert_type_id = atd.alert_type_id
                    JOIN `user` u ON a.user_id = u.user_id
                    LEFT JOIN driver d ON u.user_id = d.user_id
                    LEFT JOIN driver_sponsor ds ON d.driver_id = ds.driver_id AND a.related_id = ds.driver_sponsor_id
                    LEFT JOIN sponsor s ON ds.sponsor_id = s.sponsor_id
                    WHERE atd.alert_type = 'SPONSORSHIP_CHANGE' {date_filter_alerts} {sponsor_filter}
                    ORDER BY a.date_created DESC
                """
                
                cur.execute(query_alerts, tuple(date_params_alerts + sponsor_params))
                sponsorship_alerts = cur.fetchall() or []
                
                for alert in sponsorship_alerts:
                    status = alert.get('status', 'PENDING')
                    action = 'Approved' if status == 'ACTIVE' else 'Rejected' if status == 'INACTIVE' else 'Pending'
                    
                    audit_logs.append({
                        'date': alert['date'],
                        'category': 'Driver Application',
                        'sponsor': alert['sponsor'],
                        'user': 'System',  # Alerts don't track who created them
                        'action': action,
                        'details': f"Driver: {alert['driver']}{' | ' + alert['details'] if alert['details'] else ''}"
                    })
            except Exception as e:
                logger.debug(f"Error querying alerts for driver applications: {e}")
        
        # Also check driver_balance_changes table for point changes
        if category in ['all', 'point_changes']:
            try:
                cur.execute("SHOW TABLES LIKE 'driver_balance_changes'")
                if cur.fetchone():
                    date_filter_dbc, date_params_dbc = _build_date_filter(start_date, end_date, 'dbc.changed_at')
                    
                    sponsor_filter = "AND dbc.sponsor_id = %s" if sponsor_id else ""
                    sponsor_params = [sponsor_id] if sponsor_id else []
                    
                    query_dbc = f"""
                        SELECT 
                            dbc.changed_at AS date,
                            'Point Change' AS category,
                            s.name AS sponsor,
                            CONCAT(u.first_name, ' ', u.last_name) AS driver,
                            dbc.reason,
                            dbc.balance_change_id
                        FROM driver_balance_changes dbc
                        JOIN driver d ON dbc.driver_id = d.driver_id
                        JOIN `user` u ON d.user_id = u.user_id
                        LEFT JOIN sponsor s ON dbc.sponsor_id = s.sponsor_id
                        WHERE 1=1 {date_filter_dbc} {sponsor_filter}
                        ORDER BY dbc.changed_at DESC
                    """
                    
                    cur.execute(query_dbc, tuple(date_params_dbc + sponsor_params))
                    balance_changes = cur.fetchall() or []
                    
                    for change in balance_changes:
                        audit_logs.append({
                            'date': change['date'],
                            'category': 'Point Change',
                            'sponsor': change['sponsor'],
                            'user': 'System',  # No user tracked in this table
                            'action': 'Balance Updated',
                            'details': f"Driver: {change['driver']}{' | Reason: ' + change['reason'] if change['reason'] else ''}"
                        })
            except Exception as e:
                logger.debug(f"driver_balance_changes table not found or error: {e}")
        
        # 3. Password Changes (from change_log)
        if category in ['password_changes', 'all']:
            query = f"""
                SELECT 
                    cl.occurred_at AS date,
                    'Password Change' AS category,
                    NULL AS sponsor,
                    CONCAT(u.first_name, ' ', u.last_name) AS user,
                    REPLACE(cl.change_type, '_', ' ') AS action,
                    CONCAT('User ID: ', cl.user_id, ' | Email: ', u.email) AS details
                FROM change_log cl
                LEFT JOIN `user` u ON cl.user_id = u.user_id
                WHERE cl.change_type LIKE '%PASSWORD%' {date_filter_change}
                ORDER BY cl.occurred_at DESC
            """
            
            cur.execute(query, tuple(date_params_change))
            audit_logs.extend(cur.fetchall() or [])
            
            # Also check account_changes table if it exists
            try:
                # Check if account_changes table exists
                cur.execute("SHOW TABLES LIKE 'account_changes'")
                if cur.fetchone():
                    # Build date filter for account_changes
                    date_filter_ac, date_params_ac = _build_date_filter(start_date, end_date, 'ac.changed_at')
                    
                    query_ac = f"""
                        SELECT 
                            ac.changed_at AS date,
                            'Password Change' AS category,
                            NULL AS sponsor,
                            CONCAT(u.first_name, ' ', u.last_name) AS user,
                            ac.change_type AS action,
                            CONCAT('User ID: ', ac.user_id, ' | Email: ', u.email) AS details
                        FROM account_changes ac
                        LEFT JOIN `user` u ON ac.user_id = u.user_id
                        WHERE ac.change_type = 'PASSWORD' {date_filter_ac}
                        ORDER BY ac.changed_at DESC
                    """
                    
                    cur.execute(query_ac, tuple(date_params_ac))
                    audit_logs.extend(cur.fetchall() or [])
            except Exception as e:
                # Table might not exist, just continue
                logger.debug(f"account_changes table not found or error: {e}")
        
        # 4. Login Attempts (from login_log)
        if category in ['login_attempts', 'all']:
            query = f"""
                SELECT 
                    ll.occurred_at AS date,
                    'Login Attempt' AS category,
                    s.name AS sponsor,
                    COALESCE(CONCAT(u.first_name, ' ', u.last_name), ll.email_attempted) AS user,
                    IF(ll.success = 1, 'Login Success', 'Login Failed') AS action,
                    CONCAT(
                        'Email: ', ll.email_attempted,
                        IF(ll.success = 0 AND ll.failure_reason IS NOT NULL, 
                           CONCAT(' | Reason: ', ll.failure_reason),
                           ''),
                        ' | IP: ', COALESCE(ll.ip_address, 'Unknown')
                    ) AS details
                FROM login_log ll
                LEFT JOIN `user` u ON ll.user_id = u.user_id
                LEFT JOIN sponsor s ON s.user_id = u.user_id
                WHERE 1=1 {date_filter_login}
            """
            
            params = list(date_params_login)
            if sponsor_id:
                query += " AND s.sponsor_id = %s"
                params.append(sponsor_id)
            
            query += " ORDER BY ll.occurred_at DESC"
            
            cur.execute(query, tuple(params))
            audit_logs.extend(cur.fetchall() or [])
        
        # Sort all logs by date descending
        audit_logs.sort(key=lambda x: x['date'], reverse=True)
        
        # Convert datetime objects to ISO format strings for JSON serialization
        for log in audit_logs:
            if log['date']:
                log['date'] = log['date'].isoformat()
        
        return jsonify({
            "report_type": "audit_log",
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "sponsor_id": sponsor_id,
                "category": category
            },
            "data": audit_logs,
            "total_entries": len(audit_logs)
        }), 200
        
    except Exception as e:
        logger.error(f"Error in admin_audit_log_report: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

