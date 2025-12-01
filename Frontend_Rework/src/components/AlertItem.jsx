import PropTypes from 'prop-types';
import '../styles/Alerts.css';

/**
 * AlertItem - Individual alert/notification display
 * @param {object} alert - Alert object with type, message, timestamp, read status
 */
const AlertItem = ({ alert, onMarkAsRead }) => {
  const getAlertIcon = (type) => {
    // Handle database alert types
    const typeUpper = type?.toUpperCase();
    
    switch (typeUpper) {
      case 'BALANCE_CHANGE':
        return '';
      case 'ACCOUNT_CHANGE':
        return '';
      case 'SPONSORSHIP_CHANGE':
        return '';
      // Legacy types for backwards compatibility
      case 'POINTS_ADDED':
        return '+';
      case 'POINTS_REMOVED':
        return '-';
      case 'ORDER_PLACED':
        return '→';
      case 'DRIVER_DROPPED':
        return '!';
      case 'APPLICATION_APPROVED':
        return '✓';
      case 'APPLICATION_REJECTED':
        return '✗';
      default:
        return '•';
    }
  };

  const getAlertClass = (type) => {
    // Handle database alert types
    const typeUpper = type?.toUpperCase();
    
    switch (typeUpper) {
      case 'BALANCE_CHANGE':
        return 'alert-item-success';
      case 'ACCOUNT_CHANGE':
        return 'alert-item-info';
      case 'SPONSORSHIP_CHANGE':
        return 'alert-item-info';
      // Legacy types
      case 'DRIVER_DROPPED':
      case 'APPLICATION_REJECTED':
      case 'POINTS_REMOVED':
        return 'alert-item-warning';
      case 'APPLICATION_APPROVED':
      case 'POINTS_ADDED':
        return 'alert-item-success';
      case 'ORDER_PLACED':
        return 'alert-item-info';
      default:
        return 'alert-item-default';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`alert-item ${getAlertClass(alert.type)} ${alert.is_read ? 'read' : 'unread'}`}>
      <div className="alert-icon">{getAlertIcon(alert.type)}</div>
      <div className="alert-content">
        <p className="alert-message">{alert.message}</p>
        <span className="alert-timestamp">{formatTimestamp(alert.created_at)}</span>
      </div>
      {!alert.is_read && (
        <button
          className="btn-mark-read"
          onClick={() => onMarkAsRead(alert.alert_id)}
          title="Mark as read"
        >
          ✓
        </button>
      )}
    </div>
  );
};

AlertItem.propTypes = {
  alert: PropTypes.shape({
    alert_id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    is_read: PropTypes.bool.isRequired,
  }).isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
};

export default AlertItem;
