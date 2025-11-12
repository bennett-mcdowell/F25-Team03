import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/apiService';
import '../styles/Dashboard.css';

const Account = () => {
  const { user, checkAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    city: '',
    state: '',
    country: '',
  });

  useEffect(() => {
    if (user?.user) {
      setFormData({
        first_name: user.user.first_name || '',
        last_name: user.user.last_name || '',
        city: user.user.city || '',
        state: user.user.state || '',
        country: user.user.country || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccessMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    // Reset form to original values
    if (user?.user) {
      setFormData({
        first_name: user.user.first_name || '',
        last_name: user.user.last_name || '',
        city: user.user.city || '',
        state: user.user.state || '',
        country: user.user.country || '',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.first_name || !formData.last_name) {
      setError('First name and last name are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      await authService.updateCurrentUser(formData);
      
      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
      
      // Refresh user data
      await checkAuth();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update profile';
      setError(errorMsg);
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <h1>Account Profile</h1>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Profile Information Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Profile Information</h2>
            {!isEditing && (
              <button className="btn btn-primary" onClick={handleEdit}>
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="account-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name *</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Last Name *</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="profile-item">
                <span className="profile-label">First Name:</span>
                <span className="profile-value">{user.user.first_name || 'Not set'}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Last Name:</span>
                <span className="profile-value">{user.user.last_name || 'Not set'}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Email:</span>
                <span className="profile-value">{user.user.email}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">City:</span>
                <span className="profile-value">{user.user.city || 'Not set'}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">State:</span>
                <span className="profile-value">{user.user.state || 'Not set'}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Country:</span>
                <span className="profile-value">{user.user.country || 'Not set'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Account Type Card */}
        <div className="dashboard-card">
          <h2>Account Information</h2>
          <div className="profile-view">
            <div className="profile-item">
              <span className="profile-label">Account Type:</span>
              <span className="profile-value">
                <span className={`role-badge role-${user.role_name}`}>
                  {user.role_name}
                </span>
              </span>
            </div>
            <div className="profile-item">
              <span className="profile-label">User ID:</span>
              <span className="profile-value">{user.user.user_id}</span>
            </div>
          </div>
        </div>

        {/* Role-Specific Information */}
        {user.role_name === 'Driver' && user.role?.sponsors && user.role.sponsors.length > 0 && (
          <div className="dashboard-card">
            <h2>Sponsor Relationships</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Sponsor</th>
                    <th>Description</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Since</th>
                  </tr>
                </thead>
                <tbody>
                  {user.role.sponsors.map((sponsor) => (
                    <tr key={sponsor.driver_sponsor_id}>
                      <td>{sponsor.name}</td>
                      <td>{sponsor.description}</td>
                      <td>${sponsor.balance?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span className={`status-badge status-${sponsor.status?.toLowerCase()}`}>
                          {sponsor.status}
                        </span>
                      </td>
                      <td>{sponsor.since_at ? new Date(sponsor.since_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="total-balance">
              <strong>Total Balance: ${user.role.total_balance?.toFixed(2) || '0.00'}</strong>
            </div>
          </div>
        )}

        {user.role_name === 'Sponsor' && user.role && (
          <div className="dashboard-card">
            <h2>Sponsor Information</h2>
            <div className="profile-view">
              <div className="profile-item">
                <span className="profile-label">Organization Name:</span>
                <span className="profile-value">{user.role.name}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Description:</span>
                <span className="profile-value">{user.role.description}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Account;
