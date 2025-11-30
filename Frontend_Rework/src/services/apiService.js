import api from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/account');
    return response.data;
  },

  updateCurrentUser: async (userData) => {
    const response = await api.put('/account', userData);
    return response.data;
  },

  resetPassword: async (username, newPassword) => {
    const response = await api.post('/passwordreset', { username, newpassword: newPassword });
    return response.data;
  },
};

export const accountService = {
  // Admin-only endpoint
  getAccounts: async () => {
    const response = await api.get('/admin/accounts');
    return response.data;
  },

  updateAccount: async (accountId, updates) => {
    const response = await api.put(`/admin/account/${accountId}`, updates);
    return response.data;
  },

  deleteAccount: async (accountId) => {
    const response = await api.delete(`/admin/accounts/${accountId}`);
    return response.data;
  },

  impersonate: async (accountId) => {
    const response = await api.post('/admin/impersonate', { account_id: accountId });
    return response.data;
  },

  stopImpersonation: async () => {
    const response = await api.post('/stop-impersonation');
    return response.data;
  },
};

export const adminService = {
  // Bulk upload accounts (organizations, sponsors, drivers)
  bulkUploadAccounts: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/admin/bulk_accounts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Create a new user (admin, driver, or sponsor)
  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },
};

export const sponsorService = {
  // Get sponsor's active drivers - uses /api/sponsor/accounts
  getActiveDrivers: async () => {
    const response = await api.get('/sponsor/accounts');
    return response.data;
  },

  getPendingDrivers: async () => {
    const response = await api.get('/sponsor/pending-drivers');
    return response.data;
  },

  approvePendingDriver: async (driverId) => {
    const response = await api.post(`/sponsor/driver/${driverId}/approve`);
    return response.data;
  },

  // Reject a pending driver application with reason
  rejectPendingDriver: async (driverId, reason) => {
    const response = await api.post(`/sponsor/driver/${driverId}/reject`, {
      reason,
    });
    return response.data;
  },

  // Add points to a driver - uses /api/sponsor/driver/<id>/add_points
  addPoints: async (driverId, points, reason) => {
    const response = await api.post(`/sponsor/driver/${driverId}/add_points`, {
      points,
      reason,
    });
    return response.data;
  },

  // Subtract points from a driver - uses same endpoint with negative value
  subtractPoints: async (driverId, points, reason) => {
    const response = await api.post(`/sponsor/driver/${driverId}/add_points`, {
      points: -Math.abs(points), // Ensure negative value
      reason,
    });
    return response.data;
  },

  // Remove a driver from sponsor
  removeDriver: async (driverId) => {
    const response = await api.post('/sponsor/remove-driver', {
      driver_id: driverId,
    });
    return response.data;
  },

  // Impersonate a driver (sponsor can only impersonate their drivers)
  impersonate: async (accountId) => {
    const response = await api.post('/sponsor/impersonate', { account_id: accountId });
    return response.data;
  },

  // Get catalog filter settings (allowed categories)
  getCatalogFilters: async () => {
    const response = await api.get('/sponsor/catalog/filters');
    return response.data;
  },

  // Update catalog filter settings (allowed categories)
  updateCatalogFilters: async (allowedCategories) => {
    const response = await api.put('/sponsor/catalog/filters', {
      allowed_categories: allowedCategories,
    });
    return response.data;
  },

  // Bulk upload drivers
  bulkUploadDrivers: async (file, dryRun = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dry_run', dryRun ? '1' : '0');

    const response = await api.post('/sponsor/bulk_drivers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Create a new sponsor user for the organization
  createSponsorUser: async (userData) => {
    const response = await api.post('/sponsor/users', userData);
    return response.data;
  },

  // Get commission summary and transaction history
  getCommissionSummary: async () => {
    const response = await api.get('/sponsor/commission-summary');
    return response.data;
  },
};

export const driverService = {
  // Get enrolled sponsors and point balance
  getSponsors: async () => {
    const response = await api.get('/driver/sponsors');
    return response.data;
  },

  // Get all available sponsors
  getAvailableSponsors: async () => {
    const response = await api.get('/sponsors/available');
    return response.data;
  },

  applyToSponsor: async (sponsorId) => {
    const response = await api.post('/driver/apply', { sponsor_id: sponsorId });
    return response.data;
  },

  getPointBalance: async () => {
    const response = await api.get('/driver/points');
    return response.data;
  },

  getApplicationStatus: async () => {
    const response = await api.get('/driver/application-status');
    return response.data;
  },
};

export const alertService = {
  // Get alert history (driver only)
  getAlertHistory: async () => {
    const response = await api.get('/alerts/history');
    return response.data;
  },

  // Get alert preferences (driver only)
  getAlertPreferences: async () => {
    const response = await api.get('/alerts/preferences');
    return response.data;
  },

  // Update alert preferences (driver only)
  updateAlertPreferences: async (preferences) => {
    const response = await api.put('/alerts/preferences', preferences);
    return response.data;
  },

  // Mark alert as read
  markAlertAsRead: async (alertId) => {
    const response = await api.put(`/alerts/${alertId}/read`);
    return response.data;
  },

  // Mark all alerts as read
  markAllAlertsAsRead: async () => {
    const response = await api.put('/alerts/read-all');
    return response.data;
  },
};

export const orderService = {
  // Get orders (role-aware: drivers see their orders, sponsors see drivers' orders, admins see all)
  getOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.driverId) params.append('driver_id', filters.driverId);
    if (filters.sponsorId) params.append('sponsor_id', filters.sponsorId);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);

    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  // Get order details
  getOrderDetails: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Cancel an order (available for PENDING or PROCESSING orders)
  cancelOrder: async (orderId) => {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  },

  // Update order (admins and sponsors can add notes, update tracking, etc.)
  updateOrder: async (orderId, updates) => {
    const response = await api.put(`/orders/${orderId}`, updates);
    return response.data;
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },
};

export const reportService = {
  // Admin Reports
  getSalesReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.sponsorId) params.append('sponsor_id', filters.sponsorId);
    if (filters.viewType) params.append('view_type', filters.viewType);

    const response = await api.get(`/admin/reports/sales?${params.toString()}`);
    return response.data;
  },

  getDriversReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.sponsorId) params.append('sponsor_id', filters.sponsorId);

    const response = await api.get(`/admin/reports/drivers?${params.toString()}`);
    return response.data;
  },

  getSponsorsReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);

    const response = await api.get(`/admin/reports/sponsors?${params.toString()}`);
    return response.data;
  },

  getSalesByDriverReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.sponsorId) params.append('sponsor_id', filters.sponsorId);
    if (filters.driverId) params.append('driver_id', filters.driverId);
    if (filters.viewType) params.append('view_type', filters.viewType);

    const response = await api.get(`/admin/reports/sales-by-driver?${params.toString()}`);
    return response.data;
  },

  getInvoiceReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.sponsorId) params.append('sponsor_id', filters.sponsorId);
    if (filters.feeRate) params.append('fee_rate', filters.feeRate);

    const response = await api.get(`/admin/reports/invoice?${params.toString()}`);
    return response.data;
  },

  getAuditLogReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.sponsorId) params.append('sponsor_id', filters.sponsorId);
    if (filters.category) params.append('category', filters.category);

    const response = await api.get(`/admin/reports/audit-log?${params.toString()}`);
    return response.data;
  },

  // Sponsor Reports (for future implementation)
  getSponsorDriversReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.driverId) params.append('driver_id', filters.driverId);

    const response = await api.get(`/sponsor/reports/drivers?${params.toString()}`);
    return response.data;
  },

  getSponsorPointsReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);

    const response = await api.get(`/sponsor/reports/points?${params.toString()}`);
    return response.data;
  },

  getSponsorOrdersReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);

    const response = await api.get(`/sponsor/reports/orders?${params.toString()}`);
    return response.data;
  },
};
