from flask import Blueprint, render_template, jsonify, redirect
from utils.db import get_about_data
import os
import requests
import base64
from auth import token_required
from services import get_fake_store_data 

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/')
@routes_bp.route('/login')
def login_page():
    return render_template('login.html')

@routes_bp.route('/')
def root_redirect():
    return redirect('/login')

@routes_bp.route('/market')
def market():
    api_response = get_fake_store_data()
    return render_template('market.html', api_data=api_response)

@routes_bp.route('/about')
def about_page():
    return render_template('about.html')

@routes_bp.route('/register')
def register_page():
    return render_template('register.html')

@routes_bp.route('/home')
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
def account_page():
    return render_template('account.html')

# @routes_bp.route('/api/register', methods=['POST'])
# def register_api():
#     return jsonify({'message': 'User registered successfully'}), 201