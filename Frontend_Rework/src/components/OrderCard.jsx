import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import '../styles/Orders.css';

const OrderCard = ({ order, onCancel, onUpdate, userRole }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateNote, setUpdateNote] = useState('');

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
    // Orders can be cancelled if they're PENDING or PROCESSING
    return ['PENDING', 'PROCESSING'].includes(order.status);
  };

  const canUpdateOrder = () => {
    // Admins and sponsors can update orders that aren't DELIVERED or CANCELLED
    return (userRole === 'admin' || userRole === 'sponsor') && 
           !['DELIVERED', 'CANCELLED'].includes(order.status);
  };

  const handleCancelConfirm = () => {
    onCancel(order.id);
    setShowCancelModal(false);
  };

  const handleUpdateSubmit = () => {
    if (updateNote.trim()) {
      onUpdate(order.id, { note: updateNote });
      setUpdateNote('');
      setShowUpdateModal(false);
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
              onClick={() => setShowUpdateModal(true)}
            >
              Add Note
            </button>
          )}
        </div>
      </div>

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

      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Note to Order</h2>
            <p>Add an internal note to this order (visible to sponsors and admins).</p>
            
            <div className="form-group">
              <label>Note:</label>
              <textarea
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="Enter note..."
                rows={4}
              />
            </div>

            <div className="modal-buttons">
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setUpdateNote('');
                  setShowUpdateModal(false);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleUpdateSubmit}
                disabled={!updateNote.trim()}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderCard;
