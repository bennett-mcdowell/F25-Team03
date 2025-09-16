from flask import Flask, jsonify, render_template
from flask_caching import Cache
import mysql.connector
from mysql.connector import Error
from flask_cors import CORS
from dotenv import load_dotenv
import os

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
    return render_template('index.html', product=product)

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