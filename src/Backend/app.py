import os
import logging
from flask import Flask
from flask_caching import Cache
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import os


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

# App initialization
load_dotenv()
configure_logging()  # <<— initialize logging before anything logs


app = Flask(__name__, static_folder='../Frontend/static', template_folder='../Frontend/templates')
CORS(app)

cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

# Register Blueprints
app.register_blueprint(routes_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(account_bp)

# Optional: prove ENV values at startup (safe ones)
logging.getLogger(__name__).info(
    "Startup ENV => AUTH_LOG_LEVEL=%s, AUTH_LOG_FILE=%s",
    os.getenv("AUTH_LOG_LEVEL"),
    os.getenv("AUTH_LOG_FILE"),
)

if __name__ == '__main__':
    # IMPORTANT: no reloader in Docker; it double-imports
    app.run(debug=True, use_reloader=False, host="0.0.0.0", port=5000)
