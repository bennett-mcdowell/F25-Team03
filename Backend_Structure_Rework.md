# Backend Structure Rework Plan

> **Status:** Documentation for future refactoring after React frontend is complete
> 
> **Current State:** Backend is working but has inconsistencies in URL patterns and organization
> 
> **Goal:** Refactor to follow DRY, KISS, and SOLID principles with resource-based URLs

## Table of Contents
- [Current Issues](#current-issues)
- [Proposed Structure](#proposed-structure)
- [API Design Philosophy](#api-design-philosophy)
- [Implementation Examples](#implementation-examples)
- [Migration Strategy](#migration-strategy)

---

## Current Issues

### 1. Inconsistent URL Patterns
- `/api/admin/accounts` vs `/api/account` (singular/plural mismatch)
- `/api/sponsor/accounts` vs `/api/driver/sponsors` 
- Some endpoints use `/api/`, others don't

### 2. Mixed Concerns
- `account.py` has 1288 lines handling admin, sponsor, AND driver logic
- Should be split into separate modules with clear responsibilities

### 3. Repeated Database Code
- Similar query patterns duplicated across endpoints
- No repository/service layer pattern
- Direct database access mixed with business logic

### 4. Inconsistent Response Formats
- Some return `{accounts: [...]}`, others return bare objects
- Error handling varies across endpoints

---

## Proposed Structure

```
src/Backend/
  app.py                    # Flask app initialization, blueprint registration
  auth.py                   # JWT authentication, role decorators
  
  routes/
    __init__.py
    api_routes.py           # Main API blueprint (resource-based)
    auth_routes.py          # Login/logout/register
    
  services/
    __init__.py
    user_service.py         # User business logic (role-aware)
    sponsor_service.py      # Sponsor business logic
    driver_service.py       # Driver business logic
    point_service.py        # Point transaction logic
    application_service.py  # Application approval workflow
    cart_service.py         # Shopping cart logic
    
  repositories/
    __init__.py
    user_repository.py      # User database queries
    sponsor_repository.py   # Sponsor database queries
    driver_repository.py    # Driver database queries
    point_repository.py     # Point transaction queries
    
  models/
    __init__.py
    user.py                 # User data classes/DTOs
    sponsor.py              # Sponsor data classes
    driver.py               # Driver data classes
    response.py             # Standardized response formats
    
  utils/
    db.py                   # Database connection utilities
    validators.py           # Input validation helpers
    decorators.py           # Custom decorators
    auth_helpers.py         # Auth context utilities
```

---

## API Design Philosophy

### Resource-Based URLs (Not Role-Based)

**❌ Old Approach (Role-Based URLs):**
```
GET /api/admin/accounts      # Only admins
GET /api/sponsor/accounts    # Only sponsors  
GET /api/driver/sponsors     # Only drivers
```
**Problems:**
- URL explosion (3+ endpoints for same resource)
- Lots of duplicated code
- Harder to maintain
- Not RESTful

**✅ New Approach (Resource-Based + Role-Aware):**
```
GET /api/users               # Returns different data based on role
GET /api/sponsors            # Returns different data based on role
GET /api/points              # Returns different data based on role
```
**Benefits:**
- Fewer endpoints (DRY)
- Single source of truth
- RESTful design
- Business logic determines permissions

---

## Recommended API Endpoints

### Authentication
```
POST   /api/auth/login           # Login and get JWT
POST   /api/auth/logout          # Logout
POST   /api/auth/register        # Register new user
POST   /api/auth/reset-password  # Reset password
GET    /api/auth/me              # Get current user info
```

### Users (Role-Aware)
```
GET    /api/users                # Role-aware:
                                 #   - admin: all users
                                 #   - sponsor: their drivers
                                 #   - driver: self only
                                 
GET    /api/users/:id            # Role-aware:
                                 #   - admin: any user
                                 #   - sponsor: their drivers only
                                 #   - driver: self only
                                 
PUT    /api/users/:id            # Update user (role-aware)
DELETE /api/users/:id            # Delete user (admin only)
```

### Sponsors (Role-Aware)
```
GET    /api/sponsors             # Role-aware:
                                 #   - admin: all sponsors
                                 #   - driver: available sponsors
                                 #   - sponsor: self only
                                 
GET    /api/sponsors/:id         # Get sponsor details (role-aware)
POST   /api/sponsors             # Create sponsor (admin only)
PUT    /api/sponsors/:id         # Update sponsor (admin or self)
DELETE /api/sponsors/:id         # Delete sponsor (admin only)
```

### Points (Role-Aware)
```
GET    /api/points               # Role-aware:
                                 #   - admin: all transactions
                                 #   - sponsor: their drivers' points
                                 #   - driver: own points only
                                 
POST   /api/points               # Add/subtract points
                                 #   - sponsor: can add to their drivers
                                 #   - admin: can add to anyone
                                 
GET    /api/points/balance       # Get point balance (driver/sponsor)
```

### Applications (Role-Aware)
```
GET    /api/applications         # Role-aware:
                                 #   - sponsor: pending applications to them
                                 #   - driver: their own applications
                                 
POST   /api/applications         # Submit application (driver only)
PUT    /api/applications/:id     # Approve/reject (sponsor only)
DELETE /api/applications/:id     # Cancel application (driver only)
```

### Products & Cart
```
GET    /api/products             # All authenticated users
POST   /api/products             # Create product (admin only)
PUT    /api/products/:id         # Update product (admin only)
DELETE /api/products/:id         # Delete product (admin only)

GET    /api/cart                 # Get cart (driver only)
POST   /api/cart                 # Add to cart (driver only)
PUT    /api/cart/:id             # Update cart item (driver only)
DELETE /api/cart/:id             # Remove from cart (driver only)
POST   /api/cart/checkout        # Checkout (driver only)
```

### About & System
```
GET    /api/about                # Get about info (public or authenticated)
```

---

## Implementation Examples

### 1. Auth Helper Utility

```python
# utils/auth_helpers.py
from flask import g

def get_current_user_context():
    """
    Extract user context from JWT token set by @token_required
    
    Returns:
        dict: {
            'user_id': int,
            'role': str (lowercase),
            'sponsor_id': int or None,
            'driver_id': int or None
        }
    """
    claims = getattr(g, "decoded_token", {}) or {}
    user_id = claims.get("user_id") or claims.get("sub")
    role_name = claims.get("role_name", "").lower()
    
    # You might need to query for these depending on JWT structure
    sponsor_id = claims.get("sponsor_id")
    driver_id = claims.get("driver_id")
    
    return {
        'user_id': user_id,
        'role': role_name,
        'sponsor_id': sponsor_id,
        'driver_id': driver_id
    }
```

### 2. Service Layer (Business Logic)

```python
# services/user_service.py
from repositories.user_repository import UserRepository
from utils.auth_helpers import get_current_user_context

class UserService:
    def __init__(self):
        self.repo = UserRepository()
    
    def get_users_for_role(self, user_context):
        """
        Return users based on requesting user's role
        
        Args:
            user_context: dict from get_current_user_context()
            
        Returns:
            list: Users visible to the requesting user
        """
        role = user_context['role']
        
        if role == 'admin':
            # Admin sees all users with full details
            return self.repo.get_all_users_full()
        
        elif role == 'sponsor':
            # Sponsor only sees their drivers
            sponsor_id = user_context.get('sponsor_id')
            if not sponsor_id:
                raise ValueError("Sponsor ID not found")
            return self.repo.get_drivers_for_sponsor(sponsor_id)
        
        elif role == 'driver':
            # Driver only sees themselves
            user_id = user_context['user_id']
            user = self.repo.get_user_by_id(user_id)
            return [user] if user else []
        
        raise PermissionError(f"Invalid role: {role}")
    
    def get_user_by_id(self, user_id, user_context):
        """
        Get specific user if requester has permission
        """
        role = user_context['role']
        
        if role == 'admin':
            # Admin can see anyone
            return self.repo.get_user_by_id(user_id)
        
        elif role == 'sponsor':
            # Sponsor can only see their drivers
            sponsor_id = user_context.get('sponsor_id')
            if self.repo.is_driver_of_sponsor(user_id, sponsor_id):
                return self.repo.get_user_by_id(user_id)
            raise PermissionError("Cannot access this user")
        
        elif role == 'driver':
            # Driver can only see themselves
            if user_id == user_context['user_id']:
                return self.repo.get_user_by_id(user_id)
            raise PermissionError("Cannot access other users")
        
        raise PermissionError(f"Invalid role: {role}")
```

### 3. Repository Layer (Database Queries)

```python
# repositories/user_repository.py
from utils.db import get_db_connection

class UserRepository:
    """Handle all database queries for users"""
    
    def get_all_users_full(self):
        """Get all users with full details (admin only)"""
        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("""
                SELECT 
                    u.*,
                    ut.type_name as role_name
                FROM user u
                LEFT JOIN user_type ut ON u.type_id = ut.type_id
                ORDER BY u.last_name, u.first_name
            """)
            return cur.fetchall()
        finally:
            cur.close()
            conn.close()
    
    def get_drivers_for_sponsor(self, sponsor_id):
        """Get all drivers associated with a sponsor"""
        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("""
                SELECT 
                    u.user_id,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    d.driver_id,
                    ds.balance,
                    ds.status
                FROM driver_sponsor ds
                JOIN driver d ON ds.driver_id = d.driver_id
                JOIN user u ON d.user_id = u.user_id
                WHERE ds.sponsor_id = %s AND ds.status = 'ACTIVE'
                ORDER BY u.last_name, u.first_name
            """, (sponsor_id,))
            return cur.fetchall()
        finally:
            cur.close()
            conn.close()
    
    def get_user_by_id(self, user_id):
        """Get single user by ID"""
        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("""
                SELECT 
                    u.*,
                    ut.type_name as role_name
                FROM user u
                LEFT JOIN user_type ut ON u.type_id = ut.type_id
                WHERE u.user_id = %s
            """, (user_id,))
            return cur.fetchone()
        finally:
            cur.close()
            conn.close()
    
    def is_driver_of_sponsor(self, user_id, sponsor_id):
        """Check if user is a driver of given sponsor"""
        conn = get_db_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("""
                SELECT 1
                FROM driver_sponsor ds
                JOIN driver d ON ds.driver_id = d.driver_id
                WHERE d.user_id = %s 
                  AND ds.sponsor_id = %s 
                  AND ds.status = 'ACTIVE'
            """, (user_id, sponsor_id))
            return cur.fetchone() is not None
        finally:
            cur.close()
            conn.close()
```

### 4. Route Layer (Thin Controllers)

```python
# routes/api_routes.py
from flask import Blueprint, jsonify, request
from auth import token_required
from utils.auth_helpers import get_current_user_context
from services.user_service import UserService

api_bp = Blueprint('api', __name__)
user_service = UserService()

@api_bp.route("/api/users", methods=["GET"])
@token_required
def get_users():
    """
    Get users based on requester's role
    - Admin: all users
    - Sponsor: their drivers
    - Driver: self only
    """
    try:
        context = get_current_user_context()
        users = user_service.get_users_for_role(context)
        return jsonify({"users": users}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@api_bp.route("/api/users/<int:user_id>", methods=["GET"])
@token_required
def get_user(user_id):
    """
    Get specific user if requester has permission
    """
    try:
        context = get_current_user_context()
        user = user_service.get_user_by_id(user_id, context)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"user": user}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@api_bp.route("/api/users/<int:user_id>", methods=["PUT"])
@token_required
def update_user(user_id):
    """
    Update user (admin or self only)
    """
    try:
        context = get_current_user_context()
        data = request.get_json()
        
        updated_user = user_service.update_user(user_id, data, context)
        return jsonify({"user": updated_user}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500
```

### 5. Standardized Response Format

```python
# models/response.py
from flask import jsonify

class APIResponse:
    """Standardized API response format"""
    
    @staticmethod
    def success(data=None, message=None, status=200):
        """Success response"""
        response = {"success": True}
        if data is not None:
            response["data"] = data
        if message:
            response["message"] = message
        return jsonify(response), status
    
    @staticmethod
    def error(message, status=400, errors=None):
        """Error response"""
        response = {
            "success": False,
            "error": message
        }
        if errors:
            response["errors"] = errors
        return jsonify(response), status
    
    @staticmethod
    def paginated(items, page, per_page, total, status=200):
        """Paginated response"""
        return jsonify({
            "success": True,
            "data": items,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page
            }
        }), status
```

---

## Migration Strategy

### Phase 1: Preparation (Don't break existing functionality)
1. ✅ **Finish React frontend** using current backend endpoints
2. ✅ **Document current API** - List all existing endpoints and their behavior
3. ✅ **Create test suite** - Ensure we can verify nothing breaks
4. ✅ **Set up new structure** - Create new folders/files alongside existing code

### Phase 2: Incremental Migration
1. **Create new endpoints** alongside old ones
   - Add `/api/users` while keeping `/api/admin/accounts`
   - Both work simultaneously
   
2. **Update frontend one page at a time**
   - Update Admin Dashboard to use `/api/users`
   - Test thoroughly
   - Move to next page
   
3. **Deprecate old endpoints**
   - Add deprecation warnings to old endpoints
   - Monitor usage
   
4. **Remove old code**
   - Once all frontend uses new endpoints
   - Delete deprecated endpoints

### Phase 3: Refinement
1. **Extract common patterns** into utilities
2. **Add comprehensive error handling**
3. **Improve validation**
4. **Add rate limiting** where needed
5. **Document new API** with examples

---

## Benefits Summary

### DRY (Don't Repeat Yourself)
- ✅ Single endpoint per resource, not per role
- ✅ Shared database queries in repositories
- ✅ Common logic in services
- ✅ No duplicate permission checking

### KISS (Keep It Simple, Stupid)
- ✅ Clean, predictable URL structure
- ✅ Thin route handlers (just routing)
- ✅ Business logic separated from routes
- ✅ Easy to understand and maintain

### SOLID Principles
- ✅ **Single Responsibility**: Each layer has one job
  - Routes: Handle HTTP
  - Services: Business logic
  - Repositories: Database queries
  
- ✅ **Open/Closed**: Easy to extend without modifying
  - Add new roles by extending service logic
  - Add new endpoints without touching old ones
  
- ✅ **Liskov Substitution**: Services can be swapped/mocked
  
- ✅ **Interface Segregation**: Clean, focused interfaces
  
- ✅ **Dependency Inversion**: Routes depend on services, not DB

---

## Next Steps

1. **Finish React frontend** using current backend (get feature parity)
2. **Create comprehensive test suite** for current functionality
3. **Begin incremental migration** as outlined above
4. **Update this document** as we learn and iterate

---

## Notes

- This is a **living document** - update as implementation progresses
- Keep backend working at all times during migration
- Test thoroughly at each step
- Frontend should work throughout the process