import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/apiService';
import '../styles/Auth.css';

// min 8 chars, 1 letter, 1 number
const isPasswordComplex = (password) => {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
};

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!isPasswordComplex(newPassword)) {
      setError('Password must be at least 8 characters, include a letter and a number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email.trim(), newPassword);
      setSuccess('Password reset successful! You may now log in.');
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Password reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Password Reset</h1>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
