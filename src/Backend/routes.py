from flask import Blueprint, render_template, jsonify
from utils.db import get_about_data
import os
import requests
import base64

routes_bp = Blueprint('routes', __name__)

def get_raw_ebay_data():
    """Get raw eBay API data"""
    client_id = os.getenv('EBAY_CLIENT_ID')
    client_secret = os.getenv('EBAY_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        return {"error": "eBay credentials not found in .env file"}
    
    try:
        # Get token
        token_url = "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
        credentials = f"{client_id}:{client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {encoded_credentials}'
        }
        
        data = {
            'grant_type': 'client_credentials',
            'scope': 'https://api.ebay.com/oauth/api_scope'
        }
        
        response = requests.post(token_url, headers=headers, data=data)
        
        if response.status_code != 200:
            return {"error": f"Token failed: {response.status_code}"}
        
        token = response.json().get('access_token')
        
        # Get products
        search_url = "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search"
        
        search_headers = {
            'Authorization': f'Bearer {token}',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
        
        params = {
            'q': 'electronics',
            'limit': 6,
            'filter': 'price:[1..1000]'
        }
        
        search_response = requests.get(search_url, headers=search_headers, params=params)
        
        if search_response.status_code == 200:
            raw_data = search_response.json()
            print(f"eBay API success: Found {len(raw_data.get('itemSummaries', []))} items")
            return raw_data
        else:
            return {"error": f"Search failed: {search_response.status_code}"}
    
    except Exception as e:
        return {"error": str(e)}

@routes_bp.route('/')
def register_page():
    return render_template('register.html')

@routes_bp.route('/market')
def market():
    # Get raw eBay data
    ebay_api_response = get_raw_ebay_data()
    # Pass to about.html template
    return render_template('about.html', api_data=ebay_api_response)

@routes_bp.route('/about')
def about_page():
    return render_template('about.html')

@routes_bp.route('/login')
def login_page():
    return render_template('login.html')

@routes_bp.route('/api/about', methods=['GET'])
def about_api():
    data = get_about_data()
    if data:
        return jsonify(data)
    else:
        return jsonify({'error': 'No data found'}), 404
    
# @routes_bp.route('/api/register', methods=['POST'])
# def register_api():
#     return jsonify({'message': 'User registered successfully'}), 201