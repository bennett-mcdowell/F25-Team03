# app.py
from flask import Flask, render_template

app = Flask(__name__)

# Sample product data
product = {
    "name": "My Product",
    "description": "This is a description of my awesome product.",
    "price": "$49.99"
}

@app.route("/")
def home():
    return render_template("index.html", product=product)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

