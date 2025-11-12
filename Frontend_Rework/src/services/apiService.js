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
    const response = await api.put(`/admin/accounts/${accountId}`, updates);
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
