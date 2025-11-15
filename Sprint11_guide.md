# Backend API Implementation Guide

**Purpose**: This guide documents which backend API endpoints need to be implemented for the next sprint and where in the frontend they should be integrated.

**Status Legend**:
- ✅ **Implemented** - Backend exists and frontend uses it
- 🟡 **Partially Implemented** - Backend exists but not fully integrated in frontend
- ❌ **Not Implemented** - Needs to be built

---

## 📊 Current Implementation Status

### **Authentication & Account Management** ✅

| Endpoint | Method | Backend File | Status | Frontend Usage |
|----------|--------|--------------|--------|----------------|
| `/api/register` | POST | `auth.py:62` | ✅ | `Register.jsx` via `authService.register()` |
| `/api/login` | POST | `auth.py:152` | ✅ | `Login.jsx` via `authService.login()` |
| `/api/logout` | POST | `auth.py:279` | ✅ | `Layout.jsx`, various pages via `authService.logout()` |
| `/api/passwordreset` | POST | `auth.py:240` | ✅ | `PasswordReset.jsx` via `authService.resetPassword()` |
| `/api/account` | GET | `account.py:22` | ✅ | `AuthContext.jsx` via `authService.getCurrentUser()` |
| `/api/account` | PUT | `account.py:161` | ✅ | `Account.jsx` via `authService.updateCurrentUser()` |

---

### **Admin Endpoints** ✅

| Endpoint | Method | Backend File | Status | Frontend Usage |
|----------|--------|--------------|--------|----------------|
| `/api/admin/accounts` | GET | `account.py:245` | ✅ | `AdminDashboard.jsx` via `accountService.getAccounts()` |
| `/api/admin/accounts/<id>` | DELETE | `account.py:351` | ✅ | `AdminDashboard.jsx` via `accountService.deleteAccount()` |
| `/api/admin/account/<id>` | GET | `account.py:2068` | ✅ | `EditUserModal.jsx` via API call |
| `/api/admin/account/<id>` | PUT | `account.py:2200` | ✅ | `EditUserModal.jsx` via `accountService.updateAccount()` |
| `/api/admin/account/<id>/reset-password` | POST | `account.py:2328` | ✅ | `EditUserModal.jsx` via API call |
| `/api/admin/impersonate` | POST | `account.py:450` | ✅ | `AdminDashboard.jsx` via `accountService.impersonate()` |
| `/api/admin/users` | POST | `account.py:2385` | ✅ | `CreateUserModal.jsx` via `adminService.createUser()` |
| `/api/stop-impersonation` | POST | `account.py:651` | ✅ | `Layout.jsx` via `accountService.stopImpersonation()` |

---

### **Sponsor Endpoints** ✅

| Endpoint | Method | Backend File | Status | Frontend Usage |
|----------|--------|--------------|--------|----------------|
| `/api/sponsor/accounts` | GET | `account.py:1038` | ✅ | `SponsorDashboard.jsx` via `sponsorService.getActiveDrivers()` |
| `/api/sponsor/pending-drivers` | GET | `sponsor.py:14` | ✅ | `SponsorDashboard.jsx` via `sponsorService.getPendingDrivers()` |
| `/api/sponsor/driver/<id>/approve` | POST | `sponsor.py:110` | ✅ | `SponsorDashboard.jsx` via `sponsorService.approvePendingDriver()` |
| `/api/sponsor/driver/<id>/reject` | POST | `sponsor.py:163` | ✅ | `SponsorDashboard.jsx` via `sponsorService.rejectPendingDriver()` |
| `/api/sponsor/driver/<id>/add_points` | POST | `account.py:1101` | ✅ | `SponsorDashboard.jsx` via `sponsorService.addPoints()` / `subtractPoints()` |
| `/api/sponsor/remove-driver` | POST | `account.py:1633` | ✅ | `SponsorDashboard.jsx` via `sponsorService.removeDriver()` |
| `/api/sponsor/impersonate` | POST | `account.py:541` | ✅ | `SponsorDashboard.jsx` via `sponsorService.impersonate()` |
| `/api/sponsor/catalog/filters` | GET | `sponsor.py:217` | ✅ | `SponsorCatalog.jsx` via `sponsorService.getCatalogFilters()` |
| `/api/sponsor/catalog/filters` | PUT | `sponsor.py:264` | ✅ | `SponsorCatalog.jsx` via `sponsorService.updateCatalogFilters()` |
| `/api/sponsor/catalog` | GET | `account.py:1921` | ✅ | `SponsorCatalog.jsx` via `catalogService.getSponsorCatalog()` |
| `/api/sponsor/catalog/toggle` | POST | `account.py:1985` | ✅ | `SponsorCatalog.jsx` via `catalogService.toggleSponsorProduct()` |
| `/api/sponsor/users` | POST | `account.py:2415` | ✅ | `CreateUserModal.jsx` via `sponsorService.createSponsorUser()` |

---

### **Driver Endpoints** ✅

| Endpoint | Method | Backend File | Status | Frontend Usage |
|----------|--------|--------------|--------|----------------|
| `/api/driver/sponsors` | GET | `account.py:1441` | ✅ | `DriverDashboard.jsx` via `driverService.getSponsors()` |
| `/api/sponsors/available` | GET | `account.py:1511` | ✅ | `DriverDashboard.jsx` via `driverService.getAvailableSponsors()` |
| `/api/driver/apply` | POST | `account.py:1561` | ✅ | `DriverDashboard.jsx` via `driverService.applyToSponsor()` |
| `/api/driver/catalog` | GET | `account.py:1763` | ✅ | `Market.jsx` via `catalogService.getDriverCatalog()` |
| `/api/driver/catalog/hidden` | GET | `account.py:1692` | ✅ | `Market.jsx` via `catalogService.getHiddenProducts()` |
| `/api/driver/catalog/toggle` | POST | `account.py:1826` | ✅ | `Market.jsx` via `catalogService.toggleDriverProduct()` |
| `/api/purchase` | POST | `account.py:906` | ✅ | `Cart.jsx` via direct `api.post('/purchase')` |

---

### **General Endpoints** ✅

| Endpoint | Method | Backend File | Status | Frontend Usage |
|----------|--------|--------------|--------|----------------|
| `/api/about` | GET | `routes.py:12` | ✅ | `About.jsx` via direct `api.get('/about')` |

---

### **Bulk Upload Endpoints** ✅

| Endpoint | Method | Backend File | Status | Frontend Usage |
|----------|--------|--------------|--------|----------------|
| `/api/admin/bulk_accounts` | POST | `account.py:1181` | ✅ | `BulkUpload.jsx` via `adminService.bulkUploadAccounts()` |
| `/api/sponsor/bulk_drivers` | POST | `account.py:735` | ✅ | `BulkUpload.jsx` via `sponsorService.bulkUploadDrivers()` |

---

## ❌ **Missing Endpoints - NEXT SPRINT PRIORITY**

These endpoints are called by the frontend but **DO NOT EXIST** in the backend yet:

### 🔴 **1. Alert System Endpoints**

**Frontend Files**: `Inbox.jsx`, `AlertPreferences.jsx`

| Endpoint | Method | Purpose | Priority | Frontend Location |
|----------|--------|---------|----------|-------------------|
| `/api/alerts/history` | GET | Get all alerts for logged-in driver | **HIGH** | `Inbox.jsx:13` |
| `/api/alerts/preferences` | GET | Get driver's alert preferences | **MEDIUM** | `AlertPreferences.jsx:12` |
| `/api/alerts/preferences` | PUT | Update driver's alert preferences | **MEDIUM** | `AlertPreferences.jsx:31` |
| `/api/alerts/<id>/read` | PUT | Mark a single alert as read | **HIGH** | `AlertItem.jsx:17` |
| `/api/alerts/read-all` | PUT | Mark all alerts as read | **MEDIUM** | `Inbox.jsx:32` |

**Backend Implementation File**: Create new `alerts.py` blueprint

**Database Tables Needed**:
```sql
-- Alert types (system-defined)
CREATE TABLE alert_type (
  alert_type_id INT PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(50) NOT NULL,  -- e.g., 'POINT_CHANGE', 'ORDER_UPDATE', 'APPLICATION_STATUS'
  description TEXT
);

-- Driver alert preferences
CREATE TABLE driver_alert_preferences (
  preference_id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  alert_type_id INT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES driver(driver_id),
  FOREIGN KEY (alert_type_id) REFERENCES alert_type(alert_type_id),
  UNIQUE KEY (driver_id, alert_type_id)
);

-- Individual alerts
CREATE TABLE driver_alerts (
  alert_id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  alert_type_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (driver_id) REFERENCES driver(driver_id),
  FOREIGN KEY (alert_type_id) REFERENCES alert_type(alert_type_id)
);
```

**Frontend Integration Points**:
```javascript
// Inbox.jsx - Line 13
const { data: alerts } = useQuery(['alerts'], alertService.getAlertHistory);

// Inbox.jsx - Line 32
const markAllAsRead = useMutation(alertService.markAllAlertsAsRead, {
  onSuccess: () => queryClient.invalidateQueries(['alerts'])
});

// AlertItem.jsx - Line 17
const markAsRead = useMutation(() => alertService.markAlertAsRead(alert.alert_id), {
  onSuccess: () => queryClient.invalidateQueries(['alerts'])
});

// AlertPreferences.jsx - Line 12
const { data: preferences } = useQuery(['alertPreferences'], 
  alertService.getAlertPreferences
);

// AlertPreferences.jsx - Line 31
const updatePreferences = useMutation(alertService.updateAlertPreferences, {
  onSuccess: () => {
    queryClient.invalidateQueries(['alertPreferences']);
    toast.success('Alert preferences updated!');
  }
});
```

---

### 🟡 **2. Order Management Endpoints**

**Frontend Files**: `Orders.jsx`, `Cart.jsx`

| Endpoint | Method | Purpose | Priority | Frontend Location |
|----------|--------|---------|----------|-------------------|
| `/api/orders` | GET | Get orders (role-aware filtering) | **HIGH** | `Orders.jsx:25` |
| `/api/orders/<id>` | GET | Get specific order details | **MEDIUM** | `OrderCard.jsx` (future) |
| `/api/orders/<id>/cancel` | POST | Cancel a pending order | **MEDIUM** | `OrderCard.jsx:45` (future) |
| `/api/orders/<id>` | PUT | Update order details (admin/sponsor) | **LOW** | Admin panel (future) |
| `/api/orders/<id>/status` | PUT | Update order status (admin only) | **LOW** | Admin panel (future) |

**Backend Implementation File**: Create new `orders.py` blueprint

**Database Tables Needed** (should already exist):
```sql
-- Orders table
CREATE TABLE orders (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  sponsor_id INT NOT NULL,
  total_points INT NOT NULL,
  status ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
  tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES driver(driver_id),
  FOREIGN KEY (sponsor_id) REFERENCES sponsor(sponsor_id)
);

-- Order items
CREATE TABLE order_items (
  order_item_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  points_per_item INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);
```

**Backend Logic Requirements**:
```python
# GET /api/orders - Role-aware filtering
# - Drivers: See only their orders
# - Sponsors: See orders from their enrolled drivers
# - Admins: See all orders
# 
# Query params: ?status=PENDING&driver_id=5&sponsor_id=2&start_date=2025-01-01&end_date=2025-12-31

# POST /api/orders/<id>/cancel
# - Only allow if order status is PENDING or PROCESSING
# - Refund points to driver's balance
# - Create alert for driver
# - Log the cancellation with reason
```

**Frontend Integration Points**:
```javascript
// Orders.jsx - Line 25
const { data: orders, isLoading } = useQuery(
  ['orders', filters],
  () => orderService.getOrders(filters),
  { refetchInterval: 30000 } // Refresh every 30s
);

// OrderCard.jsx - Line 45 (future implementation)
const cancelOrder = useMutation(
  () => orderService.cancelOrder(order.order_id),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Order cancelled successfully');
    }
  }
);
```

---

### 🟡 **3. Report Endpoints**

**Frontend Files**: `AdminReports.jsx`, `SponsorReports.jsx`

| Endpoint | Method | Purpose | Priority | Frontend Location |
|----------|--------|---------|----------|-------------------|
| `/api/admin/reports/sales` | GET | Get sales/purchase analytics | **MEDIUM** | `AdminReports.jsx:42` |
| `/api/admin/reports/drivers` | GET | Get driver activity analytics | **MEDIUM** | `AdminReports.jsx:55` |
| `/api/admin/reports/sponsors` | GET | Get sponsor analytics | **MEDIUM** | `AdminReports.jsx:68` |
| `/api/sponsor/reports/drivers` | GET | Get this sponsor's driver reports | **MEDIUM** | `SponsorReports.jsx:29` |
| `/api/sponsor/reports/points` | GET | Get point distribution analytics | **MEDIUM** | `SponsorReports.jsx:42` |
| `/api/sponsor/reports/orders` | GET | Get order analytics for sponsor | **MEDIUM** | `SponsorReports.jsx:55` |

**Backend Implementation File**: Create new `reports.py` blueprint or add to existing blueprints

**Backend Logic Requirements**:
```python
# Admin Reports:
# - Sales: Total orders, revenue (in points), top products, trends over time
# - Drivers: Active drivers, point balances, enrollment status, order counts
# - Sponsors: Active sponsors, enrolled drivers per sponsor, point distribution

# Sponsor Reports:
# - Drivers: Only THIS sponsor's drivers (point balances, orders, activity)
# - Points: Point additions/subtractions history for this sponsor
# - Orders: Order statistics for this sponsor's drivers
```

**Query Parameters**:
- `start_date`: Filter by date range
- `end_date`: Filter by date range
- `group_by`: Group results by 'day', 'week', 'month'
- `driver_id`: Filter by specific driver (sponsor reports)
- `product_category`: Filter by product category

**Frontend Integration Points**:
```javascript
// AdminReports.jsx - Line 42
const { data: salesData } = useQuery(
  ['admin-reports-sales', filters],
  () => api.get('/admin/reports/sales', { params: filters })
);

// SponsorReports.jsx - Line 29
const { data: driverReports } = useQuery(
  ['sponsor-reports-drivers', filters],
  () => api.get('/sponsor/reports/drivers', { params: filters })
);
```

---

## 📋 **Implementation Checklist for Next Sprint**

### **Alert System (HIGH PRIORITY)**
- [ ] Create `src/Backend/alerts.py` blueprint
- [ ] Add alert database tables (migrations)
- [ ] Implement `GET /api/alerts/history`
- [ ] Implement `PUT /api/alerts/<id>/read`
- [ ] Implement `PUT /api/alerts/read-all`
- [ ] Implement `GET /api/alerts/preferences`
- [ ] Implement `PUT /api/alerts/preferences`
- [ ] Test all alert endpoints with frontend
- [ ] Create alerts when points change
- [ ] Create alerts when orders update
- [ ] Create alerts when applications are approved/rejected

### **Order Management (HIGH PRIORITY)**
- [ ] Create `src/Backend/orders.py` blueprint
- [ ] Verify order database tables exist (should be from purchases)
- [ ] Implement `GET /api/orders` (role-aware)
- [ ] Implement `GET /api/orders/<id>`
- [ ] Implement `POST /api/orders/<id>/cancel`
- [ ] Add order status workflow logic
- [ ] Test order filtering by role
- [ ] Link orders to purchase endpoint
- [ ] Update `Orders.jsx` to use new endpoints

### **Reports (MEDIUM PRIORITY)**
- [ ] Create `src/Backend/reports.py` blueprint
- [ ] Implement `GET /api/admin/reports/sales`
- [ ] Implement `GET /api/admin/reports/drivers`
- [ ] Implement `GET /api/admin/reports/sponsors`
- [ ] Implement `GET /api/sponsor/reports/drivers`
- [ ] Implement `GET /api/sponsor/reports/points`
- [ ] Implement `GET /api/sponsor/reports/orders`
- [ ] Add date range filtering
- [ ] Add CSV export functionality
- [ ] Test with `AdminReports.jsx` and `SponsorReports.jsx`

---

## 🔧 **Backend Blueprint Template**

Use this template when creating new backend files:

```python
# src/Backend/<feature>.py
from flask import Blueprint, jsonify, request, g
from utils.db import get_db_connection
from auth import token_required, require_role
import logging

<feature>_bp = Blueprint("<feature>", __name__)
logger = logging.getLogger('<feature>')

def _claims_user_id():
    """Helper to extract user_id from JWT claims"""
    claims = getattr(g, "decoded_token", {}) or {}
    return claims.get("user_id") or claims.get("sub")

@<feature>_bp.route("/api/<feature>/endpoint", methods=["GET"])
@token_required
def endpoint_name():
    """
    Endpoint description
    
    Returns:
        JSON response with data
    """
    user_id = _claims_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    try:
        cur = conn.cursor(dictionary=True)
        
        # Your SQL query here
        cur.execute("SELECT * FROM table WHERE user_id = %s", (user_id,))
        results = cur.fetchall()
        
        return jsonify({"data": results}), 200
        
    except Exception as e:
        logger.error(f"Error in endpoint_name: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()
```

---

## 🚀 **Don't Forget to Register New Blueprints!**

In `src/Backend/app.py`, add your new blueprints:

```python
# Import new blueprints
from alerts import alerts_bp
from orders import orders_bp
from reports import reports_bp
from bulk_upload import bulk_bp

# Register new blueprints
app.register_blueprint(alerts_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(bulk_bp)
```