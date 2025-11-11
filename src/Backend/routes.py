from lib2to3.pgen2.driver import Driver
from flask import Blueprint, render_template, jsonify, redirect, request
from utils.db import get_about_data
import os
import requests
import base64
from auth import token_required, require_role
from services import get_fake_store_data 

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/')
def root_redirect():
    # Redirect the root URL to /login
    return redirect('/login')

@routes_bp.route('/login')
def login_page():
    return render_template('login.html')

@routes_bp.route('/market')
@token_required
def market():
    from flask import g
    from utils.db import get_db_connection
    
    # Check if user is a driver
    user_id = g.decoded_token.get("user_id") or g.decoded_token.get("sub")
    role = g.decoded_token.get("role")
    
    if role == "driver":
        # Use driver catalog endpoint to filter products
        conn = None
        cur = None
        try:
            conn = get_db_connection()
            cur = conn.cursor(dictionary=True)
            
            # Get driver_id
            cur.execute("SELECT driver_id FROM driver WHERE user_id = %s", (user_id,))
            driver = cur.fetchone()
            
            if driver:
                driver_id = driver['driver_id']
                
                # Get all products from Fake Store API
                all_products = get_fake_store_data()
                
                if all_products and isinstance(all_products, dict) and 'products' in all_products:
                    products = all_products['products']
                    
                    # Get driver's active sponsors and their hidden products
                    cur.execute("""
                        SELECT scc.product_id, scc.is_hidden
                        FROM driver_sponsor ds
                        JOIN sponsor_catalog_curation scc ON ds.sponsor_id = scc.sponsor_id
                        WHERE ds.driver_id = %s AND ds.status = 'ACTIVE'
                    """, (driver_id,))
                    
                    hidden_products = {row['product_id'] for row in cur.fetchall() if row['is_hidden'] == 1}
                    
                    # Filter out hidden products
                    visible_products = [p for p in products if p['id'] not in hidden_products]
                    
                    api_response = {'products': visible_products}
                else:
                    api_response = all_products
            else:
                api_response = get_fake_store_data()
        except Exception as e:
            print(f"Error filtering driver catalog: {e}")
            api_response = get_fake_store_data()
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
    else:
        # For non-drivers, show all products
        api_response = get_fake_store_data()
    
    return render_template('market.html', api_data=api_response)

@routes_bp.route('/about')
@token_required
def about_page():
    return render_template('about.html')

@routes_bp.route('/register')
def register_page():
    return render_template('register.html')

@routes_bp.route('/home')
@token_required
def home_page():
    return render_template('landing_page.html')

@routes_bp.route('/passwordreset')
def password_reset_page():
    return render_template('passwordreset.html')

@routes_bp.route('/api/about', methods=['GET'])
def about_api():
    data = get_about_data()
    if data:
        return jsonify(data)
    else:
        return jsonify({'error': 'No data found'}), 404
 
@routes_bp.route('/account')
@token_required
def account_page():
    return render_template('account.html')

@routes_bp.route('/sponsor/home')
@token_required
@require_role("sponsor")
def sponsor_home():
    return render_template('sponsor_landing.html')

@routes_bp.route('/sponsor/catalog')
@token_required
@require_role("sponsor")
def sponsor_catalog():
    return render_template('sponsor_catalog.html')

@routes_bp.route('/admin/home')
@token_required
@require_role("admin")
def admin_home():
    return render_template('admin_landing.html')

@routes_bp.route('/driver/home')
@token_required
@require_role("driver")
def driver_home():
    return render_template('driver_landing.html')

@routes_bp.route('/cart')
@token_required
def cart_page():
    return render_template('cart.html')

@routes_bp.route('/account/<int:user_id>')
@token_required
def account_details(user_id):
    """serve the account detail page for a specific user"""
    return render_template('account_details.html')

@routes_bp.route('/impersonate')
def impersonate_page():
    return render_template('impersonate.html')

@routes_bp.route('/purchase-confirmation')
@token_required
@require_role("driver")
def purchase_confirmation():
    """Display purchase confirmation page after successful checkout"""
    # Get purchase details from query parameters
    items_purchased = request.args.get('items_purchased', type=int)
    total_spent = request.args.get('total_spent', type=int)
    new_balance = request.args.get('new_balance', type=int)
    sponsor_id = request.args.get('sponsor_id', type=int)
    
    return render_template('confirmation.html',
                         items_purchased=items_purchased,
                         total_spent=total_spent,
                         new_balance=new_balance,
                         sponsor_id=sponsor_id)

# @routes_bp.route('/api/register', methods=['POST'])
# def register_api():
#     return jsonify({'message': 'User registered successfully'}), 201