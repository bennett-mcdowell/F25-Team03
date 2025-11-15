import { useState } from 'react';
import '../styles/Modal.css';

/**
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onConfirm - Callback when action is confirmed
 * @param {string} title - Modal title
 * @param {string} message - Modal message/description
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} confirmButtonClass - CSS class for confirm button (default: "btn-primary")
 * @param {boolean} requireReason - Whether to show reason input field
 * @param {string} reasonLabel - Label for reason field (default: "Reason")
 * @param {string} reasonPlaceholder - Placeholder for reason field
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  confirmButtonClass = 'btn-primary',
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Enter reason...',
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      alert(`Please provide a ${reasonLabel.toLowerCase()}`);
      return;
    }
    onConfirm(reason);
    setReason(''); // Reset for next use
  };

  const handleClose = () => {
    setReason(''); // Reset on close
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p>{message}</p>

          {requireReason && (
            <div className="form-group">
              <label htmlFor="reason">{reasonLabel}*</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows="4"
                className="form-control"
                required
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            className={`btn ${confirmButtonClass}`}
            onClick={handleConfirm}
            disabled={requireReason && !reason.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
