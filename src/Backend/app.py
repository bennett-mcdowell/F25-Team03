from flask import Flask, jsonify, render_template
from flask_caching import Cache
import mysql.connector
from mysql.connector import Error
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import base64

# App initialization
app = Flask(__name__, static_folder='../Frontend/static', template_folder='../Frontend/templates')
CORS(app)
load_dotenv()

cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

# Sample product data
product = {
    "name": "My Product",
    "description": "This is a description of my awesome product.",
    "price": "$49.99"
}

def get_about_data():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD')
        )
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT team_number, version_number, release_date, product_name, product_description FROM about_info ORDER BY `index` DESC LIMIT 1;")
            row = cursor.fetchone()
            return row
    except Error as e:
        print(f"Error: {e}")
        return None
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()

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
            # Return the raw JSON response
            raw_data = search_response.json()
            print(f"Raw eBay data: {raw_data}")  # Debug print
            return raw_data
        else:
            return {"error": f"Search failed: {search_response.status_code}"}
    
    except Exception as e:
        return {"error": str(e)}

# Serve the about HTML page
@app.route('/about')
def about_page():
    return render_template('about.html')

# Serve the login HTML page
@app.route('/login')
def login_page():
    return render_template('login.html')

# Serve the index HTML page
@app.route('/')
def home():
    # Get raw API data and put it in a variable
    ebay_api_response = get_raw_ebay_data()
    
    # Pass the raw variable directly to the template
    return render_template('index.html', api_data=ebay_api_response)

# API endpoint for about data
@app.route('/api/about', methods=['GET'])
@cache.cached(timeout=300)
def about_api():
    data = get_about_data()
    if data:
        return jsonify(data)
    else:
        return jsonify({'error': 'No data found'}), 404

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)