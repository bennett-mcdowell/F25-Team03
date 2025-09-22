import mysql.connector
from mysql.connector import Error
import os

# Utility function to get about data from the database
def get_about_data():
    try:
        connection = get_db_connection()
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT team_number, version_number, release_date, product_name, product_description FROM about_info ORDER BY `index` DESC LIMIT 1;")
            row = cursor.fetchone()
            return row
    except Error as e:
        print(f"Error: {e}")
        return None

# Function to get a database connection
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD')
        )
        return connection
    except Error as e:
        print(f"Error: {e}")
        return None
