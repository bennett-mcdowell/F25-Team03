import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import AlertItem from '../components/AlertItem';
import AlertPreferences from '../components/AlertPreferences';
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
    try {
      // TODO: Replace with actual API calls when backend is ready
      // const alertsData = await alertService.getAlertHistory();
      // const prefsData = await alertService.getAlertPreferences();
      
      // Mock data for now
      const mockAlerts = [
        {
          alert_id: 1,
          type: 'points_added',
          message: 'You received 50 points from Speedy Tires!',
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          is_read: false,
        },
        {
          alert_id: 2,
          type: 'order_placed',
          message: 'Your order #1234 has been placed successfully.',
          created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          is_read: false,
        },
        {
          alert_id: 3,
          type: 'points_removed',
          message: '25 points were deducted for order #1234.',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          is_read: true,
        },
        {
          alert_id: 4,
          type: 'application_approved',
          message: 'Your application to FuelMax has been approved!',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          is_read: true,
        },
      ];

      setAlerts(mockAlerts);
      setPreferences({
        points_alert: true,
        order_alert: true,
      });
    } catch (err) {
      setError('Failed to load alerts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      // TODO: API call to mark alert as read
      // await alertService.markAlertAsRead(alertId);
      
      setAlerts(prev =>
        prev.map(alert =>
          alert.alert_id === alertId
            ? { ...alert, is_read: true }
            : alert
        )
      );
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // TODO: API call to mark all alerts as read
      // await alertService.markAllAlertsAsRead();
      
      setAlerts(prev =>
        prev.map(alert => ({ ...alert, is_read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
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
