import api from './api';

const alertService = {
  // Get all alerts for the current user
  async getAlerts() {
    const response = await api.get('/alerts');
    return response.data.alerts;
  },

  // Mark a specific alert as read
  async markAlertAsRead(alertId) {
    const response = await api.put(`/alerts/${alertId}/read`);
    return response.data;
  },

  // Mark all alerts as read
  async markAllAlertsAsRead() {
    const response = await api.put('/alerts/read-all');
    return response.data;
  },

  // Delete a specific alert
  async deleteAlert(alertId) {
    const response = await api.delete(`/alerts/${alertId}`);
    return response.data;
  }
};

export default alertService;
