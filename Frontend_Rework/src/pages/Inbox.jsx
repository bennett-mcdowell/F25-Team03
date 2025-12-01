import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import AlertItem from '../components/AlertItem';
import AlertPreferences from '../components/AlertPreferences';
import alertService from '../services/alertService';
import '../styles/Alerts.css';

const Inbox = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [preferences, setPreferences] = useState({
    points_alert: true,
    order_alert: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [activeTab, setActiveTab] = useState('alerts'); // alerts, preferences

  useEffect(() => {
    fetchAlertsAndPreferences();
  }, []);

  const fetchAlertsAndPreferences = async () => {
    setLoading(true);
    setError('');
    try {
      const alertsData = await alertService.getAlerts();
      setAlerts(alertsData || []);
      
      // Keep default preferences for now since backend doesn't store them yet
      setPreferences({
        points_alert: true,
        order_alert: true,
      });
    } catch (err) {
      setError('Failed to load alerts');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await alertService.markAlertAsRead(alertId);
      
      setAlerts(prev =>
        prev.map(alert =>
          alert.alert_id === alertId
            ? { ...alert, is_read: true }
            : alert
        )
      );
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
      setError('Failed to mark alert as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertService.markAllAlertsAsRead();
      
      setAlerts(prev =>
        prev.map(alert => ({ ...alert, is_read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
      setError('Failed to mark all alerts as read');
    }
  };

  const handleUpdatePreferences = async (newPrefs) => {
    try {
      // TODO: API call to update preferences
      // await alertService.updateAlertPreferences(newPrefs);
      
      setPreferences(newPrefs);
      alert('Preferences updated successfully!');
    } catch (err) {
      alert('Failed to update preferences');
      console.error(err);
    }
  };

  const getFilteredAlerts = () => {
    switch (filter) {
      case 'unread':
        return alerts.filter(a => !a.is_read);
      case 'read':
        return alerts.filter(a => a.is_read);
      default:
        return alerts;
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const filteredAlerts = getFilteredAlerts();

  if (loading) {
    return (
      <Layout>
        <div className="inbox-container">
          <div className="loading">Loading alerts...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="inbox-container">
        <div className="inbox-header">
          <h1>
            Inbox
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </h1>
          <p className="inbox-subtitle">Stay updated with your notifications and preferences</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Tabs */}
        <div className="inbox-tabs">
          <button
            className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="alerts-tab">
            {/* Filter and Actions */}
            <div className="alerts-controls">
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All ({alerts.length})
                </button>
                <button
                  className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                  onClick={() => setFilter('read')}
                >
                  Read ({alerts.length - unreadCount})
                </button>
              </div>
              
              {unreadCount > 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={handleMarkAllAsRead}
                >
                  Mark All as Read
                </button>
              )}
            </div>

            {/* Alerts List */}
            <div className="alerts-list">
              {filteredAlerts.length === 0 ? (
                <div className="no-alerts">
                  <p>No {filter !== 'all' ? filter : ''} alerts</p>
                </div>
              ) : (
                filteredAlerts.map(alert => (
                  <AlertItem
                    key={alert.alert_id}
                    alert={alert}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="preferences-tab">
            <AlertPreferences
              preferences={preferences}
              onUpdate={handleUpdatePreferences}
              loading={loading}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inbox;
