import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

conn = mysql.connector.connect(
    host=os.getenv('DB_HOST'),
    database=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD')
)

cursor = conn.cursor()

print("=== TABLES ===")
cursor.execute("SHOW TABLES")
for table in cursor.fetchall():
    print(table[0])

print("\n=== ALERTS TABLE STRUCTURE ===")
cursor.execute("DESCRIBE alerts")
for row in cursor.fetchall():
    print(row)

print("\n=== SAMPLE ALERTS DATA ===")
cursor.execute("SELECT * FROM alerts LIMIT 5")
for row in cursor.fetchall():
    print(row)

conn.close()