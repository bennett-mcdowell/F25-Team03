import os
import logging
from flask import Flask
from flask_caching import Cache
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import base64
import os
from sponsor_reports import sponsor_reports_bp

# ------------------------------
# Logging setup (stdout + optional file)
# ------------------------------
def configure_logging():
    level_name = os.getenv("AUTH_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    # Root logger: app-wide
    root = logging.getLogger()
    root.setLevel(level)

    # Remove default handlers (avoid duplicates on reloads)
    for h in list(root.handlers):
        root.removeHandler(h)

    # Stream to stdout (Docker picks this up)
    sh = logging.StreamHandler()
    sh.setLevel(level)             # make sure handler emits at desired level
    sh.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] %(name)s: %(message)s"))
    root.addHandler(sh)

    # Optional file log (mount a volume to persist)
    log_file = os.getenv("AUTH_LOG_FILE")
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setLevel(level)
        fh.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] %(name)s: %(message)s"))
        root.addHandler(fh)

    # Tone down werkzeug access noise a bit (still shows requests)
    logging.getLogger("werkzeug").setLevel(logging.INFO)

    # Prove logger is live at startup
    root.info(f"ROOT logger initialized; level={level_name}")
    for h in root.handlers:
        root.info(f"Handler active: {type(h).__name__}, level={logging.getLevelName(h.level)}")

# Blueprints
from routes import routes_bp
from auth import auth_bp
from account import account_bp 
from sponsor import sponsor_bp
from admin_reports import admin_reports_bp

# App initialization
load_dotenv()
configure_logging()  # <<— initialize logging before anything logs

# Determine static folder path (works both locally and in Docker)
if os.path.exists('../Frontend_Rework/dist'):
    # Docker: /app/Backend -> /app/Frontend_Rework/dist
    static_folder_path = '../Frontend_Rework/dist'
elif os.path.exists('../../Frontend_Rework/dist'):
    # Local: src/Backend -> Frontend_Rework/dist
    static_folder_path = '../../Frontend_Rework/dist'
else:
    static_folder_path = None  # Will cause Flask to not serve static files

app = Flask(__name__, static_folder=static_folder_path, static_url_path='/')

# CORS configuration for React frontend
# In development: Allow localhost:5173 (Vite dev server)
# In production: Serve built React from Flask (same origin)
allowed_origins = [
    'http://localhost:5173',  # Vite dev server
    'http://localhost:3000',  # Alternative React dev port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
]

# Add production domain if set
production_domain = os.getenv('FRONTEND_URL')
if production_domain:
    allowed_origins.append(production_domain)

CORS(app, 
     origins=allowed_origins,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# JWT configuration - use cookies for access tokens by default
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'dev_secret')
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
# Consider enabling CSRF protection for cookie-authenticated forms in production
app.config['JWT_COOKIE_CSRF_PROTECT'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 24 * 3600
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'  # Use 'Lax' for localhost development
app.config['JWT_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['JWT_COOKIE_DOMAIN'] = None  # Allow cookies to work across localhost ports

jwt = JWTManager(app)

cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

# Register Blueprints (these take priority over catch-all routes)
app.register_blueprint(routes_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(account_bp)
app.register_blueprint(sponsor_bp)
app.register_blueprint(admin_reports_bp)
app.register_blueprint(sponsor_reports_bp)

# Serve React App (for production)
# This catch-all route must be registered LAST so API routes take priority
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React app for all routes (SPA)"""
    from flask import send_from_directory, abort
    import os
    
    # If no static folder configured, return 404
    if not app.static_folder:
        abort(404)
    
    # If path is empty, serve index.html
    if not path:
        return send_from_directory(app.static_folder, 'index.html')
    
    # Check if path is a file in the dist directory
    dist_path = os.path.join(app.static_folder, path)
    if os.path.exists(dist_path) and os.path.isfile(dist_path):
        return send_from_directory(app.static_folder, path)
    
    # For any other path (like /admin, /market, etc.), serve index.html
    # React Router will handle the routing on the client side
    return send_from_directory(app.static_folder, 'index.html')

# Optional: prove ENV values at startup (safe ones)
logging.getLogger(__name__).info(
    "Startup ENV => AUTH_LOG_LEVEL=%s, AUTH_LOG_FILE=%s",
    os.getenv("AUTH_LOG_LEVEL"),
    os.getenv("AUTH_LOG_FILE"),
)

if __name__ == '__main__':
    # IMPORTANT: no reloader in Docker; it double-imports
    port = int(os.environ.get('PORT', 5000))  # Default to 5000 if PORT not set
    app.run(host='0.0.0.0', port=port)
