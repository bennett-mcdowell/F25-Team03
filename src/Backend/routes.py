from flask import Blueprint, jsonify
from utils.db import get_about_data
from auth import token_required

routes_bp = Blueprint('routes', __name__)

# ============================================
# API ENDPOINTS ONLY
# All page routing handled by React frontend
# ============================================

@routes_bp.route('/api/about', methods=['GET'])
def about_api():
    """Get deployment/sprint information for About page"""
    data = get_about_data()
    if data:
        return jsonify(data)
    else:
        return jsonify({'error': 'No data found'}), 404

# @routes_bp.route('/api/register', methods=['POST'])
# def register_api():
#     return jsonify({'message': 'User registered successfully'}), 201