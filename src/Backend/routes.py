from flask import Blueprint, render_template, jsonify
from utils.db import get_about_data

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/')
def home():
    return render_template('about.html')

@routes_bp.route('/about')
def about_page():
    return render_template('about.html')

@routes_bp.route('/login')
def login_page():
    return render_template('login.html')

@routes_bp.route('/register')
def register_page():
    return render_template('register.html')

# API endpoint for about data
@routes_bp.route('/api/about', methods=['GET'])
def about_api():
    data = get_about_data()
    if data:
        return jsonify(data)
    else:
        return jsonify({'error': 'No data found'}), 404
    
# API endpoint for register
@routes_bp.route('/api/register', methods=['POST'])
def register_api():
    # Handle registration logic here
    return jsonify({'message': 'User registered successfully'}), 201
