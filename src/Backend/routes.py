from lib2to3.pgen2.driver import Driver
from flask import Blueprint, render_template, jsonify, redirect
from utils.db import get_about_data
import os
import requests
import base64
from auth import token_required
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

<<<<<<< HEAD
@routes_bp.route('/sponsor/home')
def sponsor_home():
    return render_template('sponsor_landing.html')


=======
@routes_bp.route('/cart')
def cart_page():
    return render_template('cart.html')
>>>>>>> 098141cd12c04f71b5b62fc0f8bbbea2eff137fa

# @routes_bp.route('/api/register', methods=['POST'])
# def register_api():
#     return jsonify({'message': 'User registered successfully'}), 201