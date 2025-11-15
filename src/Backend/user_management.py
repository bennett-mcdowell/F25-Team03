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
        This allows multiple logins per sponsor
        
        Args:
            data: User data dictionary
            sponsor_id: ID of the sponsor organization this user belongs to
        
        Returns:
            (user_id, error_message) tuple
        """
        # First get the sponsor organization details
        conn = None
        try:
            conn = get_db_connection()
            cur = conn.cursor(dictionary=True)
            
            # Get sponsor organization info
            cur.execute("""
                SELECT name, description FROM sponsor WHERE sponsor_id = %s
            """, (sponsor_id,))
            
            sponsor = cur.fetchone()
            if not sponsor:
                return None, "Sponsor organization not found"
            
            # Add sponsor info to data
            data['sponsor_name'] = sponsor['name']
            data['description'] = sponsor['description']
            
            conn.close()
            
            # Create the sponsor user
            user_id, error = UserCreationService.create_user(data, 'sponsor')
            if error:
                return None, error
            
            # Update the sponsor record to point to this new user
            # Note: This creates a new sponsor record. If we want multiple logins
            # for the SAME sponsor, we need a different approach (sponsor_users table)
            # For now, this creates separate sponsor records with same organization name
            
            return user_id, None
            
        except Exception as e:
            logger.error(f"Error creating sponsor user for org {sponsor_id}: {e}")
            return None, str(e)
        finally:
            if conn:
                conn.close()
