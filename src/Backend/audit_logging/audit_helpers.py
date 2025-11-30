"""
Audit logging helper functions for various system events.
Follows DRY, KISS, and SOLID principles.
"""
import datetime
from utils.db import get_db_connection
from flask import request
import logging

logger = logging.getLogger('audit_helpers')

def _get_request_info():
    """Helper to extract IP and user agent from request (DRY)"""
    ip_address = request.remote_addr if request else None
    user_agent = request.headers.get('User-Agent') if request else None
    return ip_address, user_agent


def log_driver_application(driver_id, sponsor_id, status, reason=None, actioned_by=None):
    """
    Log driver application status changes (approve/reject).
    
    Args:
        driver_id: The driver being approved/rejected
        sponsor_id: The sponsor making the decision
        status: 'ACTIVE' (approved) or 'INACTIVE' (rejected)
        reason: Optional reason for rejection
        actioned_by: User ID of the person who approved/rejected
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Store as JSON-like text in change_type
        change_data = f"DRIVER_APPLICATION|driver_id:{driver_id}|sponsor_id:{sponsor_id}|status:{status}"
        if reason:
            change_data += f"|reason:{reason}"
        
        cursor.execute(
            """
            INSERT INTO change_log (user_id, change_type, occurred_at)
            VALUES (%s, %s, %s)
            """,
            (actioned_by, change_data, datetime.datetime.now(datetime.timezone.utc))
        )
        conn.commit()
        logger.info(f"Logged driver application: driver={driver_id}, sponsor={sponsor_id}, status={status}")
    except Exception as e:
        logger.error(f'Driver application log error: {e}')
    finally:
        if 'conn' in locals() and conn:
            conn.close()


def log_point_change(driver_id, sponsor_id, points, reason=None, actioned_by=None):
    """
    Log point balance changes (additions/deductions).
    
    Args:
        driver_id: The driver whose points are changing
        sponsor_id: The sponsor making the change
        points: Number of points (positive for add, negative for deduct)
        reason: Optional reason for the change
        actioned_by: User ID of the person making the change
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        change_data = f"POINT_CHANGE|driver_id:{driver_id}|sponsor_id:{sponsor_id}|points:{points}"
        if reason:
            change_data += f"|reason:{reason}"
        
        cursor.execute(
            """
            INSERT INTO change_log (user_id, change_type, occurred_at)
            VALUES (%s, %s, %s)
            """,
            (actioned_by, change_data, datetime.datetime.now(datetime.timezone.utc))
        )
        conn.commit()
        logger.info(f"Logged point change: driver={driver_id}, sponsor={sponsor_id}, points={points}")
    except Exception as e:
        logger.error(f'Point change log error: {e}')
    finally:
        if 'conn' in locals() and conn:
            conn.close()


def log_password_change(user_id, change_type='PASSWORD_CHANGE'):
    """
    Log password change events.
    
    Args:
        user_id: The user whose password changed
        change_type: Type of change (PASSWORD_CHANGE, PASSWORD_RESET, etc.)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO change_log (user_id, change_type, occurred_at)
            VALUES (%s, %s, %s)
            """,
            (user_id, change_type, datetime.datetime.now(datetime.timezone.utc))
        )
        conn.commit()
        logger.info(f"Logged password change: user={user_id}, type={change_type}")
    except Exception as e:
        logger.error(f'Password change log error: {e}')
    finally:
        if 'conn' in locals() and conn:
            conn.close()
