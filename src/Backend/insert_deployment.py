#!/usr/bin/env python3
"""Simple script to insert a deployment record into about_info table"""
import mysql.connector
import os
import sys

try:
    # Connect to database
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    cursor = conn.cursor()
    
    # Insert new record - index will auto-increment
    cursor.execute("""
        INSERT INTO about_info (team_number, version_number, release_date, product_name, product_description)
        VALUES ('03', 'Sprint 0', CURDATE(), 'Driver Incentive Program', 
                'This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.')
    """)
    
    # Get the auto-generated index
    sprint_num = cursor.lastrowid
    
    # Update the version_number to match the index
    cursor.execute("""
        UPDATE about_info 
        SET version_number = %s 
        WHERE `index` = %s
    """, (f"Sprint {sprint_num}", sprint_num))
    
    conn.commit()
    print(f"✅ Inserted deployment record: Sprint {sprint_num}")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
finally:
    if conn:
        conn.close()
