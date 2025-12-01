# src/Backend/user_management.py
"""
User Management Module - Following SOLID principles
Single Responsibility: Handles user creation for different roles
"""
from werkzeug.security import generate_password_hash
from utils.db import get_db_connection
import logging

logger = logging.getLogger(__name__)

class UserCreationService:
    """
    Service class for creating users
    Follows Single Responsibility Principle
    """
    
    # Type mapping
    TYPE_MAP = {
        'admin': 1,
        'sponsor': 2,
        'driver': 3
    }
    
    @staticmethod
    def validate_user_data(data, user_type):
        """
        Validate user data based on type
        DRY: Centralized validation logic
        """
        # Base required fields for all user types
        required_fields = ['first_name', 'last_name', 'email', 'username', 'password', 'city', 'state', 'country']
        
        # Additional fields based on type
        if user_type == 'sponsor':
            required_fields.extend(['sponsor_name', 'description'])
        
        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return False, f"Missing required fields: {', '.join(missing)}"
        
        # Email validation
        email = data.get('email', '')
        if '@' not in email or '.' not in email.split('@')[-1]:
            return False, "Invalid email format"
        
        # Password strength (basic)
        password = data.get('password', '')
        if len(password) < 6:
            return False, "Password must be at least 6 characters"
        
        return True, None
    
    @staticmethod
    def create_user(data, user_type, created_by_user_id=None):
        """
        Create a user of specified type
        KISS: Simple, straightforward user creation
        
        Args:
            data: Dictionary with user data
            user_type: 'admin', 'sponsor', or 'driver'
            created_by_user_id: ID of user creating this account (for audit)
        
        Returns:
            (user_id, error_message) tuple
        """
        # Validate
        valid, error = UserCreationService.validate_user_data(data, user_type)
        if not valid:
            return None, error
        
        type_id = UserCreationService.TYPE_MAP.get(user_type)
        if not type_id:
            return None, f"Invalid user type: {user_type}"
        
        conn = None
        try:
            conn = get_db_connection()
            conn.autocommit = False
            cur = conn.cursor(dictionary=True)
            
            # Extract common fields
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            email = data.get('email')
            ssn = data.get('ssn')
            city = data.get('city')
            state = data.get('state')
            country = data.get('country')
            username = data.get('username')
            password = data.get('password')
            
            # Security question/answer (optional, use defaults if not provided)
            sec_q = data.get('security_question', 'What is your favorite color?')
            sec_a = data.get('security_answer', 'blue')
            
            hashed_password = generate_password_hash(password)
            
            # 1. Create user record
            cur.execute("""
                INSERT INTO `user` 
                (first_name, last_name, email, ssn, city, state, country, type_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (first_name, last_name, email, ssn, city, state, country, type_id))
            
            user_id = cur.lastrowid
            logger.info(f"Created user_id {user_id} of type {user_type}")
            
            # 2. Create credentials
            cur.execute("""
                INSERT INTO user_credentials (user_id, username, password)
                VALUES (%s, %s, %s)
            """, (user_id, username, hashed_password))
            
            # 3. Create login_info
            cur.execute("""
                INSERT INTO login_info 
                (user_id, failed_attempts, is_locked, security_question, security_answer)
                VALUES (%s, 0, 0, %s, %s)
            """, (user_id, sec_q, sec_a))
            
            # 4. Create role-specific record
            if user_type == 'admin':
                admin_permissions = data.get('admin_permissions', 0)
                cur.execute("""
                    INSERT INTO admin (user_id, admin_permissions)
                    VALUES (%s, %s)
                """, (user_id, admin_permissions))
                
            elif user_type == 'sponsor':
                sponsor_name = data.get('sponsor_name')
                description = data.get('description')
                cur.execute("""
                    INSERT INTO sponsor (user_id, name, description)
                    VALUES (%s, %s, %s)
                """, (user_id, sponsor_name, description))
                
            elif user_type == 'driver':
                cur.execute("""
                    INSERT INTO driver (user_id)
                    VALUES (%s)
                """, (user_id,))
            
            conn.commit()
            logger.info(f"Successfully created {user_type} user_id={user_id}")
            return user_id, None
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error creating {user_type} user: {e}")
            
            # Check for duplicate email/username
            error_msg = str(e)
            if 'email_lc' in error_msg or 'Duplicate' in error_msg:
                return None, "Email or username already exists"
            
            return None, f"Failed to create user: {str(e)}"
            
        finally:
            if conn:
                conn.close()
    
    @staticmethod
    def create_sponsor_user_for_organization(data, sponsor_id):
        """
        Create a sponsor user for an existing sponsor organization
        This allows multiple logins per sponsor by creating a new sponsor record
        with the same organization name/description but different user_id
        
        Args:
            data: User data dictionary with email, password, first_name, last_name
            sponsor_id: ID of the sponsor organization this user belongs to
        
        Returns:
            (user_id, error_message) tuple
        """
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor(dictionary=True)
            
            # Get sponsor organization details
            cur.execute("""
                SELECT name, description, allowed_categories 
                FROM sponsor 
                WHERE sponsor_id = %s
            """, (sponsor_id,))
            
            sponsor = cur.fetchone()
            if not sponsor:
                conn.close()
                return None, "Sponsor organization not found"
            
            org_name = sponsor['name']
            org_description = sponsor['description']
            allowed_categories = sponsor['allowed_categories']
            
            # Validate required fields
            if not data.get('email'):
                conn.close()
                return None, "Email is required"
            if not data.get('password'):
                conn.close()
                return None, "Password is required"
            if not data.get('first_name'):
                conn.close()
                return None, "First name is required"
            if not data.get('last_name'):
                conn.close()
                return None, "Last name is required"
            
            # Create the base user account
            from werkzeug.security import generate_password_hash
            
            password_hash = generate_password_hash(data['password'])
            
            # Insert into user table (type_id=2 for sponsor)
            # Note: email_lc is GENERATED, don't insert it manually
            cur.execute("""
                INSERT INTO user (
                    first_name, last_name, email, type_id
                ) VALUES (%s, %s, %s, 2)
            """, (
                data['first_name'],
                data['last_name'],
                data['email']
            ))
            
            new_user_id = cur.lastrowid
            
            # Create user credentials (username = email)
            cur.execute("""
                INSERT INTO user_credentials (
                    user_id, username, password
                ) VALUES (%s, %s, %s)
            """, (new_user_id, data['email'], password_hash))
            
            # Create a new sponsor record for this user with same org details
            # This allows multiple users to manage the same sponsor organization
            cur.execute("""
                INSERT INTO sponsor (user_id, name, description, allowed_categories)
                VALUES (%s, %s, %s, %s)
            """, (new_user_id, org_name, org_description, allowed_categories))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Created sponsor user {new_user_id} for organization '{org_name}'")
            return new_user_id, None
            
        except Exception as e:
            if conn:
                conn.rollback()
                conn.close()
            logger.error(f"Error creating sponsor user for org {sponsor_id}: {e}")
            return None, str(e)
