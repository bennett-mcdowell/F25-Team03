#!/usr/bin/env python3
"""
Script to insert a deployment record into about_info table.
Counts existing records to determine the next sprint number.
"""
import sys
import os
from datetime import date

# Add the Backend directory to path so we can import db utility
sys.path.insert(0, os.path.dirname(__file__))

from utils.db import get_db_connection

def insert_deployment():
    """Insert a new deployment record with correct sprint number"""
    conn = None
    try:
        # Get database connection using same method as the app
        conn = get_db_connection()
        if not conn or not conn.is_connected():
            print("Failed to connect to database")
            sys.exit(1)
        
        cursor = conn.cursor()
        
        # Count existing records to get the next sprint number
        cursor.execute("SELECT COUNT(*) as count FROM about_info")
        result = cursor.fetchone()
        next_sprint = result[0] + 1
        
        # Insert new record with correct sprint number
        cursor.execute("""
            INSERT INTO about_info 
            (team_number, version_number, release_date, product_name, product_description)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            '03',
            f'Sprint {next_sprint}',
            date.today(),
            'Driver Incentive Program',
            'A web application that allows sponsors to manage driver incentive programs with point-based rewards.'
        ))
        
        conn.commit()
        print(f"Successfully inserted deployment record: Sprint {next_sprint}")
        return 0
        
    except Exception as e:
        print(f"Error inserting deployment record: {e}")
        if conn:
            conn.rollback()
        return 1
        
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    sys.exit(insert_deployment())
