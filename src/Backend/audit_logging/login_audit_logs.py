import datetime
from utils.db import get_db_connection
from flask import request

def log_login_attempt(user_id, email_attempted, success, failure_reason=None, source='WEB', mfa_used=0, request_id='', session_id=''):
    ip_address = request.remote_addr if request else None
    user_agent = request.headers.get('User-Agent') if request else None
    occurred_at = datetime.datetime.now(datetime.timezone.utc)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO login_log (
                occurred_at, user_id, email_attempted, success, failure_reason, ip_address, user_agent, source, mfa_used, request_id, session_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (occurred_at, user_id, email_attempted, int(success), failure_reason, ip_address, user_agent, source, int(mfa_used), request_id, session_id)
        )
        conn.commit()
    except Exception as e:
        print('Login log error:', e)
    finally:
        if 'conn' in locals() and conn:
            conn.close()
