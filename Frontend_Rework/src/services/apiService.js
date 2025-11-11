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

  resetPassword: async (username, newPassword) => {
    const response = await api.post('/reset-password', { username, new_password: newPassword });
    return response.data;
  },
};

export const accountService = {
  getAccounts: async () => {
    const response = await api.get('/accounts');
    return response.data;
  },

  updateAccount: async (accountId, updates) => {
    const response = await api.put(`/accounts/${accountId}`, updates);
    return response.data;
  },

  deleteAccount: async (accountId) => {
    const response = await api.delete(`/accounts/${accountId}`);
    return response.data;
  },

  impersonate: async (accountId) => {
    const response = await api.post('/impersonate', { account_id: accountId });
    return response.data;
  },

  stopImpersonation: async () => {
    const response = await api.post('/stop-impersonation');
    return response.data;
  },
};

export const sponsorService = {
  getActiveDrivers: async () => {
    const response = await api.get('/sponsor/active-drivers');
    return response.data;
  },

  getPendingApplications: async () => {
    const response = await api.get('/sponsor/pending-applications');
    return response.data;
  },

  approveApplication: async (applicationId) => {
    const response = await api.post(`/sponsor/applications/${applicationId}/approve`);
    return response.data;
  },

  rejectApplication: async (applicationId) => {
    const response = await api.post(`/sponsor/applications/${applicationId}/reject`);
    return response.data;
  },

  addPoints: async (driverId, points, reason) => {
    const response = await api.post('/sponsor/add-points', {
      driver_id: driverId,
      points,
      reason,
    });
    return response.data;
  },

  subtractPoints: async (driverId, points, reason) => {
    const response = await api.post('/sponsor/subtract-points', {
      driver_id: driverId,
      points,
      reason,
    });
    return response.data;
  },
};

export const driverService = {
  getSponsors: async () => {
    const response = await api.get('/driver/sponsors');
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
