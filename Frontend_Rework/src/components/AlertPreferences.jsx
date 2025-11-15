import { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/Alerts.css';

/**
 * AlertPreferences - Toggle alert notification preferences
 * @param {object} preferences - Current preferences { points_alert, order_alert }
 * @param {function} onUpdate - Callback to update preferences
 */
const AlertPreferences = ({ preferences, onUpdate, loading }) => {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [saving, setSaving] = useState(false);

  const handleToggle = (field) => {
    setLocalPrefs(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(localPrefs);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return localPrefs.points_alert !== preferences.points_alert ||
           localPrefs.order_alert !== preferences.order_alert;
  };

  return (
    <div className="alert-preferences">
      <h3>Alert Preferences</h3>
      <p className="preferences-description">
        Choose which notifications you want to receive. Driver dropped alerts are always enabled.
      </p>

      <div className="preference-item">
        <div className="preference-info">
          <label htmlFor="points-alert">Points Alerts</label>
          <span className="preference-description">
            Receive notifications when points are added or removed
          </span>
        </div>
        <label className="toggle-switch">
          <input
            id="points-alert"
            type="checkbox"
            checked={localPrefs.points_alert}
            onChange={() => handleToggle('points_alert')}
            disabled={loading || saving}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="preference-item">
        <div className="preference-info">
          <label htmlFor="order-alert">Order Alerts</label>
          <span className="preference-description">
            Receive notifications when orders are placed
          </span>
        </div>
        <label className="toggle-switch">
          <input
            id="order-alert"
            type="checkbox"
            checked={localPrefs.order_alert}
            onChange={() => handleToggle('order_alert')}
            disabled={loading || saving}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="preference-item disabled">
        <div className="preference-info">
          <label>Driver Dropped Alerts</label>
          <span className="preference-description">
            Always enabled - cannot be disabled
          </span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={true}
            disabled={true}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {hasChanges() && (
        <div className="preferences-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setLocalPrefs(preferences)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

AlertPreferences.propTypes = {
  preferences: PropTypes.shape({
    points_alert: PropTypes.bool.isRequired,
    order_alert: PropTypes.bool.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default AlertPreferences;
