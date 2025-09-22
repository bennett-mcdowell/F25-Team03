from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from utils.db import get_db_connection
from audit_logging.login_audit_logs import log_login_attempt
import os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    first_name = data.get('firstname')
    last_name = data.get('lastname')
    email = data.get('email')
    ssn = data.get('ssn')
    city = data.get('city')
    state = data.get('state')
    country = data.get('country')
    password = data.get('password')
    username = data.get('username')

    if not all([first_name, last_name, email, ssn, city, state, country, password, username]):
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert into user table
        cursor.execute(
            "INSERT INTO user (first_name, last_name, email, ssn, city, state, country, type_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (first_name, last_name, email, ssn, city, state, country, 1)
        )
        user_id = cursor.lastrowid

        # Insert into user_credentials table
        cursor.execute(
            "INSERT INTO user_credentials (user_id, username, password) VALUES (%s, %s, %s)",
            (user_id, username, hashed_password)
        )

        conn.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# Login endpoint
@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Get user_id and password from user_credentials
        cursor.execute(
            "SELECT user_id, password FROM user_credentials WHERE username = %s",
            (username,)
        )
        cred = cursor.fetchone()
        if not cred:
            log_login_attempt(None, username, False, failure_reason='NO_SUCH_USER')
            return jsonify({'error': 'Invalid username or password'}), 401

        user_id = cred['user_id']
        hashed_password = cred['password']
        # TEMP: Allow plain text password
        if not (check_password_hash(hashed_password, password) or hashed_password == password):
            log_login_attempt(user_id, username, False, failure_reason='BAD_PASSWORD')
            return jsonify({'error': 'Invalid username or password'}), 401

        # Generate JWT
        secret = os.getenv('JWT_SECRET', 'dev_secret')
        token = jwt.encode({
            'user_id': user_id,
            'username': username,
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }, secret, algorithm='HS256')

        log_login_attempt(user_id, username, True)
        return jsonify({'token': token}), 200
    except Exception as e:
        log_login_attempt(None, username, False, failure_reason='OTHER')
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()