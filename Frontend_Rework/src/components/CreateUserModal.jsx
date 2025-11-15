import { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/Modal.css';

const CreateUserModal = ({ isOpen, onClose, onSubmit, userType, allowedTypes }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    ssn: '',
    city: '',
    state: '',
    country: '',
    sponsor_name: '',
    description: '',
    admin_permissions: 0,
  });

  const [selectedUserType, setSelectedUserType] = useState(userType || 'driver');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const validate = () => {
    const newErrors = {};

    // Common fields for all user types
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Required for all user types
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';

    // Sponsor-specific fields
    if (selectedUserType === 'sponsor') {
      if (!formData.sponsor_name.trim()) newErrors.sponsor_name = 'Sponsor name is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Use email as username
      const submissionData = {
        ...formData,
        username: formData.email,
        user_type: selectedUserType,
      };
      await onSubmit(submissionData);
      // Reset form on success
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
        ssn: '',
        city: '',
        state: '',
        country: '',
        sponsor_name: '',
        description: '',
        admin_permissions: 0,
      });
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New User</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* User Type Selection (if multiple types allowed) */}
          {allowedTypes && allowedTypes.length > 1 && (
            <div className="form-group">
              <label htmlFor="user_type">User Type*</label>
              <select
                id="user_type"
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value)}
                className="form-control"
              >
                {allowedTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Common Fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name*</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`form-control ${errors.first_name ? 'error' : ''}`}
              />
              {errors.first_name && <span className="error-text">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name*</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`form-control ${errors.last_name ? 'error' : ''}`}
              />
              {errors.last_name && <span className="error-text">{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder=""
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${errors.password ? 'error' : ''}`}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password*</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className={`form-control ${errors.confirm_password ? 'error' : ''}`}
              />
              {errors.confirm_password && <span className="error-text">{errors.confirm_password}</span>}
            </div>
          </div>

          {/* Common location fields for all user types */}
          <div className="form-group">
            <label htmlFor="ssn">SSN (Optional)</label>
            <input
              type="text"
              id="ssn"
              name="ssn"
              value={formData.ssn}
              onChange={handleChange}
              className="form-control"
              maxLength="9"
              placeholder="9 digits, no dashes"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City*</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`form-control ${errors.city ? 'error' : ''}`}
              />
              {errors.city && <span className="error-text">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="state">State*</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`form-control ${errors.state ? 'error' : ''}`}
              />
              {errors.state && <span className="error-text">{errors.state}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="country">Country*</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={`form-control ${errors.country ? 'error' : ''}`}
            />
            {errors.country && <span className="error-text">{errors.country}</span>}
          </div>

          {/* Sponsor-specific fields */}
          {selectedUserType === 'sponsor' && (
            <>
              <div className="form-group">
                <label htmlFor="sponsor_name">Sponsor Organization Name*</label>
                <input
                  type="text"
                  id="sponsor_name"
                  name="sponsor_name"
                  value={formData.sponsor_name}
                  onChange={handleChange}
                  className={`form-control ${errors.sponsor_name ? 'error' : ''}`}
                />
                {errors.sponsor_name && <span className="error-text">{errors.sponsor_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description*</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`form-control ${errors.description ? 'error' : ''}`}
                  rows="3"
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
            </>
          )}

          {/* Admin-specific fields */}
          {selectedUserType === 'admin' && (
            <div className="form-group">
              <label htmlFor="admin_permissions">Admin Permissions Level</label>
              <input
                type="number"
                id="admin_permissions"
                name="admin_permissions"
                value={formData.admin_permissions}
                onChange={handleChange}
                className="form-control"
                min="0"
                max="10"
              />
              <small>0 = Basic, 10 = Full Access</small>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  userType: PropTypes.oneOf(['admin', 'sponsor', 'driver']),
  allowedTypes: PropTypes.arrayOf(PropTypes.oneOf(['admin', 'sponsor', 'driver'])),
};

export default CreateUserModal;
