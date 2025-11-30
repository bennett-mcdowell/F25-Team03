import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import '../styles/Orders.css';

const OrderCard = ({ order, onCancel, onUpdate, onUpdateStatus, userRole }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updateNote, setUpdateNote] = useState('');
  const [updateTracking, setUpdateTracking] = useState(order.trackingNumber || '');
  const [newStatus, setNewStatus] = useState(order.status);

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'PENDING': 'status-pending',
      'PROCESSING': 'status-processing',
      'SHIPPED': 'status-shipped',
      'DELIVERED': 'status-delivered',
      'CANCELLED': 'status-cancelled'
    };
    return statusMap[status] || 'status-default';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCancelOrder = () => {
    // Orders can only be cancelled if they're PENDING
    return order.status === 'PENDING';
  };

  const canUpdateOrder = () => {
    // Admins and sponsors can update orders that aren't DELIVERED or CANCELLED
    return (userRole === 'admin' || userRole === 'sponsor') && 
           !['DELIVERED', 'CANCELLED'].includes(order.status);
  };

  const canUpdateStatus = () => {
    // Admins and sponsors can update status
    return (userRole === 'admin' || userRole === 'sponsor') &&
           !['DELIVERED', 'CANCELLED'].includes(order.status);
  };

  const getNextStatusOptions = () => {
    const statusFlow = {
      'PENDING': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': [],
      'CANCELLED': []
    };
    return statusFlow[order.status] || [];
  };

  const handleCancelConfirm = () => {
    onCancel(order.id);
    setShowCancelModal(false);
  };

  const handleUpdateSubmit = () => {
    const updates = {};
    
    if (updateNote.trim() && updateNote !== order.note) {
      updates.notes = updateNote;
    }
    
    if (updateTracking.trim() && updateTracking !== order.trackingNumber) {
      updates.tracking_number = updateTracking;
    }
    
    if (Object.keys(updates).length > 0) {
      onUpdate(order.id, updates);
      setShowUpdateModal(false);
    } else {
      alert('No changes to save');
    }
  };

  const handleStatusUpdate = () => {
    if (newStatus !== order.status) {
      onUpdateStatus(order.id, newStatus);
      setShowStatusModal(false);
    }
  };

  return (
    <>
      <div className="order-card">
        <div className="order-header">
          <div className="order-info">
            <h3>Order #{order.orderNumber}</h3>
            <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
              {order.status}
            </span>
          </div>
          <div className="order-meta">
            <span className="order-date">{formatDate(order.createdAt)}</span>
            {order.driverName && userRole !== 'driver' && (
              <span className="order-driver">Driver: {order.driverName}</span>
            )}
            {order.sponsorName && userRole === 'admin' && (
              <span className="order-sponsor">Sponsor: {order.sponsorName}</span>
            )}
          </div>
        </div>

        <div className="order-items">
          <h4>Items ({order.items.length})</h4>
          <ul>
            {order.items.map((item, index) => (
              <li key={index} className="order-item">
                <div className="item-info">
                  <span className="item-name">{item.productName}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                </div>
                <span className="item-points">{item.pointCost} pts</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-summary">
          <div className="order-total">
            <strong>Total:</strong>
            <strong>{order.totalPoints} points</strong>
          </div>
          {order.note && (
            <div className="order-note">
              <strong>Note:</strong> {order.note}
            </div>
          )}
          {order.trackingNumber && (
            <div className="order-tracking">
              <strong>Tracking:</strong> {order.trackingNumber}
            </div>
          )}
        </div>

        <div className="order-actions">
          {canCancelOrder() && (
            <button 
              className="btn-cancel"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Order
            </button>
          )}
          {canUpdateOrder() && (
            <button 
              className="btn-secondary"
              onClick={() => {
                setUpdateNote(order.note || '');
                setUpdateTracking(order.trackingNumber || '');
                setShowUpdateModal(true);
              }}
            >
              Update Details
            </button>
          )}
          {canUpdateStatus() && getNextStatusOptions().length > 0 && (
            <button 
              className="btn-primary"
              onClick={() => setShowStatusModal(true)}
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <ConfirmationModal
          title="Cancel Order"
          message={`Are you sure you want to cancel Order #${order.orderNumber}? This action cannot be undone and points will be refunded.`}
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelModal(false)}
          confirmText="Yes, Cancel Order"
          cancelText="Keep Order"
        />
      )}

      {/* Update Order Details Modal */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Update Order Details</h2>
            <p>Update tracking number or add notes to this order.</p>
            
            <div className="form-group">
              <label>Tracking Number:</label>
              <input
                type="text"
                value={updateTracking}
                onChange={(e) => setUpdateTracking(e.target.value)}
                placeholder="Enter tracking number..."
              />
            </div>

            <div className="form-group">
              <label>Notes:</label>
              <textarea
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="Enter notes..."
                rows={4}
              />
            </div>

            <div className="modal-buttons">
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setUpdateNote('');
                  setUpdateTracking('');
                  setShowUpdateModal(false);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleUpdateSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Update Order Status</h2>
            <p>Change the status of Order #{order.orderNumber}</p>
            
            <div className="form-group">
              <label>Current Status: <strong>{order.status}</strong></label>
              <label>New Status:</label>
              <select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
                className="status-select"
              >
                <option value={order.status}>{order.status}</option>
                {getNextStatusOptions().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="status-info" style={{ 
              padding: '0.75rem', 
              backgroundColor: '#f0f8ff', 
              borderRadius: '4px',
              marginTop: '1rem',
              fontSize: '0.9rem'
            }}>
              <strong>Note:</strong> The driver will receive an alert about this status change.
            </div>

            <div className="modal-buttons">
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setNewStatus(order.status);
                  setShowStatusModal(false);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleStatusUpdate}
                disabled={newStatus === order.status}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderCard;