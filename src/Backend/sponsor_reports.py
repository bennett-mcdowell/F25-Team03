from flask import Blueprint, jsonify, request, g
from utils.db import get_db_connection
from auth import token_required, require_role
import logging
from datetime import datetime

sponsor_reports_bp = Blueprint("sponsor_reports", __name__)
logger = logging.getLogger('sponsor_reports')


def _get_sponsor_id_from_token():
    """Extract sponsor_id from JWT claims by querying DB with user_id"""
    claims = getattr(g, "decoded_token", {}) or {}
    user_id = claims.get("user_id") or claims.get("sub")
    
    if not user_id:
        return None
    
    # Query DB to get sponsor_id from user_id
    conn = get_db_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (user_id,))
        sponsor = cur.fetchone()
        return sponsor['sponsor_id'] if sponsor else None
    finally:
        if conn:
            conn.close()

            
def _parse_date_filters(args):
    """Parse and validate date filters from request args"""
    start_date = args.get('start_date')
    end_date = args.get('end_date')
    
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
    """Build SQL date filter clause"""
    conditions = []
    params = []
    
    if start_date:
        conditions.append(f"{date_column} >= %s")
        params.append(start_date)
    
    if end_date:
        conditions.append(f"{date_column} <= %s")
        params.append(end_date + " 23:59:59")
    
    if conditions:
        return " AND " + " AND ".join(conditions), params
    return "", params


def _parse_change_data(change_type):
    """
    Parse pipe-delimited change_type string.
    Example: 'POINT_CHANGE|driver_id:5|sponsor_id:2|points:50|reason:Monthly bonus'
    Returns: {'type': 'POINT_CHANGE', 'driver_id': '5', 'sponsor_id': '2', 'points': '50', 'reason': 'Monthly bonus'}
    """
    data = {}
    if not change_type:
        return data
    
    parts = change_type.split('|')
    if parts:
        data['type'] = parts[0]
    
    for part in parts[1:]:
        if ':' in part:
            key, value = part.split(':', 1)
            data[key] = value
    
    return data


@sponsor_reports_bp.route("/api/sponsor/reports/points", methods=["GET"])
@token_required
@require_role("sponsor")
def sponsor_points_report():
    """
    Driver Point Tracking Report for Sponsors
    Shows point changes for drivers in this sponsor's organization
    
    Query params:
    - start_date: YYYY-MM-DD (optional)
    - end_date: YYYY-MM-DD (optional)
    - driver_id: int (optional) - filter to specific driver
    """
    conn = None
    cur = None
    
    try:
        sponsor_id = _get_sponsor_id_from_token()
        if not sponsor_id:
            return jsonify({"error": "Sponsor ID not found in token"}), 403
        
        start_date, end_date, error = _parse_date_filters(request.args)
        if error:
            return jsonify({"error": error}), 400
        
        driver_id = request.args.get('driver_id', type=int)
        
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Get sponsor name
        cur.execute("SELECT name FROM sponsor WHERE sponsor_id = %s", (sponsor_id,))
        sponsor_row = cur.fetchone()
        sponsor_name = sponsor_row['name'] if sponsor_row else 'Unknown'
        
        # Build date filter for change_log
        date_filter, date_params = _build_date_filter(start_date, end_date, 'cl.occurred_at')
        
        # Query change_log for POINT_CHANGE entries
        # We filter by parsing the change_type field for sponsor_id match
        query = f"""
            SELECT 
                cl.change_id,
                cl.change_type,
                cl.occurred_at,
                cl.user_id AS actor_user_id,
                CONCAT(actor.first_name, ' ', actor.last_name) AS actor_name
            FROM change_log cl
            LEFT JOIN `user` actor ON cl.user_id = actor.user_id
            WHERE cl.change_type LIKE 'POINT_CHANGE|%%' {date_filter}
            ORDER BY cl.occurred_at DESC
        """
        
        cur.execute(query, tuple(date_params))
        raw_logs = cur.fetchall() or []
        
        results = []
        for log in raw_logs:
            parsed = _parse_change_data(log['change_type'])
            
            # Filter by sponsor_id
            if parsed.get('sponsor_id') != str(sponsor_id):
                continue
            
            # Filter by driver_id if specified
            if driver_id and parsed.get('driver_id') != str(driver_id):
                continue
            
            log_driver_id = parsed.get('driver_id')
            
            # Get driver name and current balance
            cur.execute("""
                SELECT 
                    CONCAT(u.first_name, ' ', u.last_name) AS driver_name,
                    ds.balance AS total_points
                FROM driver d
                JOIN `user` u ON d.user_id = u.user_id
                LEFT JOIN driver_sponsor ds ON ds.driver_id = d.driver_id AND ds.sponsor_id = %s
                WHERE d.driver_id = %s
            """, (sponsor_id, log_driver_id))
            
            driver_info = cur.fetchone()
            
            if not driver_info:
                continue
            
            # Format point change with +/- prefix
            points = parsed.get('points', '0')
            try:
                pts_num = int(points)
                point_change = f"+{pts_num}" if pts_num >= 0 else str(pts_num)
            except ValueError:
                point_change = points
            
            results.append({
                'driver_name': driver_info['driver_name'],
                'total_points': float(driver_info['total_points'] or 0),
                'point_change': point_change,
                'date': log['occurred_at'].strftime('%Y-%m-%d') if log['occurred_at'] else None,
                'sponsor': sponsor_name,
                'reason': parsed.get('reason', ''),
            })
        
        return jsonify({
            "report_type": "driver_points",
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "driver_id": driver_id
            },
            "data": results
        }), 200
        
    except Exception as e:
        logger.error(f"Error in sponsor_points_report: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@sponsor_reports_bp.route("/api/sponsor/reports/audit-log", methods=["GET"])
@token_required
@require_role("sponsor")
def sponsor_audit_log_report():
    """
    Audit Log Report for Sponsors
    Shows audit trail for this sponsor's organization:
    - Driver applications (approve/reject)
    - Point changes
    
    Query params:
    - start_date: YYYY-MM-DD (optional)
    - end_date: YYYY-MM-DD (optional)
    - category: string (optional) - 'driver_applications', 'point_changes', 'all'
    """
    conn = None
    cur = None
    
    try:
        sponsor_id = _get_sponsor_id_from_token()
        if not sponsor_id:
            return jsonify({"error": "Sponsor ID not found in token"}), 403
        
        start_date, end_date, error = _parse_date_filters(request.args)
        if error:
            return jsonify({"error": error}), 400
        
        category = request.args.get('category', 'all')
        valid_categories = ['driver_applications', 'point_changes', 'all']
        if category not in valid_categories:
            return jsonify({"error": f"Invalid category. Must be one of: {', '.join(valid_categories)}"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Get sponsor name
        cur.execute("SELECT name FROM sponsor WHERE sponsor_id = %s", (sponsor_id,))
        sponsor_row = cur.fetchone()
        sponsor_name = sponsor_row['name'] if sponsor_row else 'Unknown'
        
        # Build date filter
        date_filter, date_params = _build_date_filter(start_date, end_date, 'cl.occurred_at')
        
        # Determine which change types to query
        type_filters = []
        if category in ['point_changes', 'all']:
            type_filters.append("cl.change_type LIKE 'POINT_CHANGE|%%'")
        if category in ['driver_applications', 'all']:
            type_filters.append("cl.change_type LIKE 'DRIVER_APPLICATION|%%'")
        
        type_clause = " AND (" + " OR ".join(type_filters) + ")" if type_filters else ""
        
        query = f"""
            SELECT 
                cl.change_id,
                cl.change_type,
                cl.occurred_at,
                cl.user_id AS actor_user_id,
                CONCAT(actor.first_name, ' ', actor.last_name) AS actor_name
            FROM change_log cl
            LEFT JOIN `user` actor ON cl.user_id = actor.user_id
            WHERE 1=1 {type_clause} {date_filter}
            ORDER BY cl.occurred_at DESC
        """
        
        cur.execute(query, tuple(date_params))
        raw_logs = cur.fetchall() or []
        
        audit_logs = []
        for log in raw_logs:
            parsed = _parse_change_data(log['change_type'])
            
            # Filter by sponsor_id
            if parsed.get('sponsor_id') != str(sponsor_id):
                continue
            
            log_driver_id = parsed.get('driver_id')
            
            # Get driver name
            driver_name = 'Unknown'
            if log_driver_id:
                cur.execute("""
                    SELECT CONCAT(u.first_name, ' ', u.last_name) AS driver_name
                    FROM driver d
                    JOIN `user` u ON d.user_id = u.user_id
                    WHERE d.driver_id = %s
                """, (log_driver_id,))
                driver_row = cur.fetchone()
                if driver_row:
                    driver_name = driver_row['driver_name']
            
            change_type = parsed.get('type', '')
            
            if change_type == 'POINT_CHANGE':
                points = parsed.get('points', '0')
                try:
                    pts_num = int(points)
                    if pts_num >= 0:
                        action = f"Added {pts_num} points to {driver_name}"
                    else:
                        action = f"Deducted {abs(pts_num)} points from {driver_name}"
                except ValueError:
                    action = f"Point change for {driver_name}: {points}"
                
                audit_logs.append({
                    'date': log['occurred_at'].isoformat() if log['occurred_at'] else None,
                    'category': 'Point Change',
                    'user': log['actor_name'] or sponsor_name,
                    'action': action,
                    'details': f"Reason: {parsed.get('reason', 'N/A')}",
                })
                
            elif change_type == 'DRIVER_APPLICATION':
                status = parsed.get('status', 'PENDING')
                if status == 'ACTIVE':
                    action = 'Approved driver application'
                elif status == 'INACTIVE':
                    action = 'Rejected driver application'
                else:
                    action = 'Driver application pending'
                
                details = f"Driver: {driver_name}"
                if parsed.get('reason'):
                    details += f" | Reason: {parsed.get('reason')}"
                
                audit_logs.append({
                    'date': log['occurred_at'].isoformat() if log['occurred_at'] else None,
                    'category': 'Driver Status',
                    'user': log['actor_name'] or sponsor_name,
                    'action': action,
                    'details': details,
                })
        
        return jsonify({
            "report_type": "audit_log",
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "category": category
            },
            "data": audit_logs,
            "total_entries": len(audit_logs)
        }), 200
        
    except Exception as e:
        logger.error(f"Error in sponsor_audit_log_report: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()