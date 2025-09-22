from flask import Flask
from flask_caching import Cache
from flask_cors import CORS
from dotenv import load_dotenv

# Blueprints
from routes import routes_bp
from auth import auth_bp


# App initialization
app = Flask(__name__, static_folder='../Frontend/static', template_folder='../Frontend/templates')
CORS(app)
load_dotenv()

cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

# Register Blueprints
app.register_blueprint(routes_bp)
app.register_blueprint(auth_bp)

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000) 