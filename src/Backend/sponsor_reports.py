from flask import Blueprint, jsonify, request, g
from utils.db import get_db_connection
from auth import token_required, require_role
import mysql.connector
import traceback

sponsor_reports_bp = Blueprint('sponsor_reports', __name__, url_prefix='/api/sponsor/reports')

def _get_sponsor_id_from_token():
    """Extract sponsor_id from JWT claims by querying DB with user_id"""
    claims = getattr(g, "decoded_token", {}) or {}
    user_id = claims.get("user_id") or claims.get("sub")
    
    if not user_id:
        return None
    
    conn = get_db_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT sponsor_id FROM sponsor WHERE user_id = %s", (user_id,))
        sponsor = cur.fetchone()
        return sponsor['sponsor_id'] if sponsor else None
    finally:
        if conn:
            conn.close()

@sponsor_reports_bp.route('/points', methods=['GET'])
@token_required
@require_role('sponsor')
def get_points_report():
    """Driver point tracking report - shows BALANCE_CHANGE alerts"""
    sponsor_id = _get_sponsor_id_from_token()
    if not sponsor_id:
        return jsonify({"error": "Unauthorized"}), 401

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    driver_id = request.args.get('driver_id', 'all')

    conn = get_db_connection()
    try:
        cur = conn.cursor(dictionary=True)
        
        # Query alerts for BALANCE_CHANGE (type_id = 1) for drivers in this sponsor's organization
        query = """
            SELECT 
                a.alert_id,
                a.date_created as date,
                CONCAT(u.first_name, ' ', u.last_name) as driver_name,
                d.driver_id,
                a.details as reason,
                ds.balance as total_points,
                s.name as sponsor
            FROM alerts a
            JOIN user u ON a.user_id = u.user_id
            JOIN driver d ON u.user_id = d.user_id
            JOIN driver_sponsor ds ON d.driver_id = ds.driver_id AND ds.sponsor_id = %s
            JOIN sponsor s ON ds.sponsor_id = s.sponsor_id
            WHERE a.alert_type_id = 1
        """
        
        params = [sponsor_id]
        
        # Add date filters
        if start_date:
            query += " AND DATE(a.date_created) >= %s"
            params.append(start_date)
        if end_date:
            query += " AND DATE(a.date_created) <= %s"
            params.append(end_date)
            
        # Add driver filter
        if driver_id != 'all':
            query += " AND d.driver_id = %s"
            params.append(driver_id)
        
        query += " ORDER BY a.date_created DESC"
        
        cur.execute(query, params)
        results = cur.fetchall()
        
        # Format results
        data = []
        for row in results:
            data.append({
                'driver_name': row['driver_name'],
                'total_points': float(row['total_points']) if row['total_points'] else 0.0,
                'point_change': row['reason'],
                'date': row['date'].strftime('%Y-%m-%d %H:%M:%S') if row['date'] else '',
                'sponsor': row['sponsor'],
                'reason': row['reason']
            })
        
        return jsonify({
            'success': True,
            'report_type': 'driver_points',
            'filters': {
                'start_date': start_date,
                'end_date': end_date,
                'driver_id': driver_id
            },
            'data': data
        })
        
    except mysql.connector.Error as e:
        print("="*80)
        print("POINTS REPORT ERROR:")
        traceback.print_exc()
        print("="*80)
        return jsonify({"error": "Database error", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()

@sponsor_reports_bp.route('/audit-log', methods=['GET'])
@token_required
@require_role('sponsor')
def get_audit_log():
    """Audit log report - shows all alerts for sponsor's drivers"""
    sponsor_id = _get_sponsor_id_from_token()
    if not sponsor_id:
        return jsonify({"error": "Unauthorized"}), 401

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category', 'all')

    conn = get_db_connection()
    try:
        cur = conn.cursor(dictionary=True)
        
        # Query all alerts for drivers in this sponsor's organization
        query = """
            SELECT 
                a.alert_id,
                a.date_created,
                CONCAT(u.first_name, ' ', u.last_name) as user,
                atd.alert_type as category,
                atd.message_template as action,
                a.details
            FROM alerts a
            JOIN user u ON a.user_id = u.user_id
            JOIN driver d ON u.user_id = d.user_id
            JOIN driver_sponsor ds ON d.driver_id = ds.driver_id AND ds.sponsor_id = %s
            JOIN alert_type_definitions atd ON a.alert_type_id = atd.alert_type_id
            WHERE 1=1
        """
        
        params = [sponsor_id]
        
        # Add date filters
        if start_date:
            query += " AND DATE(a.date_created) >= %s"
            params.append(start_date)
        if end_date:
            query += " AND DATE(a.date_created) <= %s"
            params.append(end_date)
            
        # Add category filter
        if category and category != 'all':
            # Map frontend categories to alert_type_ids
            category_map = {
                'point_changes': 1,
                'driver_applications': 3,
                'password_changes': 2,
            }
            if category in category_map:
                query += " AND a.alert_type_id = %s"
                params.append(category_map[category])
        
        query += " ORDER BY a.date_created DESC"
        
        cur.execute(query, params)
        results = cur.fetchall()
        
        # Format results
        data = []
        for row in results:
            data.append({
                'date': row['date_created'].strftime('%Y-%m-%d %H:%M:%S') if row['date_created'] else '',
                'category': row['category'],
                'user': row['user'],
                'action': row['action'],
                'details': row['details']
            })
        
        return jsonify({
            'success': True,
            'report_type': 'sponsor_audit',
            'filters': {
                'start_date': start_date,
                'end_date': end_date,
                'category': category
            },
            'data': data
        })
        
    except Exception as e:
        print("="*80)
        print("AUDIT LOG ERROR:")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        traceback.print_exc()
        print("="*80)
        return jsonify({"error": "Database error", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()