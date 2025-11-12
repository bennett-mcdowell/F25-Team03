import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { accountService } from '../services/apiService';
import { useState } from 'react';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [stoppingImpersonation, setStoppingImpersonation] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleStopImpersonation = async () => {
    try {
      setStoppingImpersonation(true);
      await accountService.stopImpersonation();
      // Refresh user data to reflect original user
      await checkAuth();
      // Navigate to original role's dashboard
      const originalRole = user?.original_role?.toLowerCase();
      if (originalRole === 'admin') {
        navigate('/admin');
      } else if (originalRole === 'sponsor') {
        navigate('/sponsor');
      }
    } catch (error) {
      console.error('Stop impersonation failed:', error);
      alert('Failed to stop impersonation');
    } finally {
      setStoppingImpersonation(false);
    }
  };

  const getDashboardLink = () => {
    const role = user?.role_name?.toLowerCase();
    switch (role) {
      case 'admin':
        return '/admin';
      case 'sponsor':
        return '/sponsor';
      case 'driver':
        return '/driver';
      default:
        return '/';
    }
  };

  return (
    <div className="layout">
      {user?.impersonating && (
        <div className="impersonation-banner">
          <div className="impersonation-content">
            <span className="impersonation-text">
              Impersonating <strong>{user.user?.email}</strong> as{' '}
              <strong>{user.role_name}</strong>
            </span>
            <button
              onClick={handleStopImpersonation}
              className="stop-impersonation-btn"
              disabled={stoppingImpersonation}
            >
              {stoppingImpersonation ? 'Stopping...' : 'Stop Impersonating'}
            </button>
          </div>
        </div>
      )}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Team Driver Rewards</h2>
        </div>
        <ul className="sidebar-menu">
          <li>
            <Link to={getDashboardLink()}>Dashboard</Link>
          </li>
          {user?.role_name?.toLowerCase() === 'admin' && (
            <>
              <li>
                <Link to="/admin/accounts">Accounts</Link>
              </li>
            </>
          )}
          {user?.role_name?.toLowerCase() === 'sponsor' && (
            <>
              <li>
                <Link to="/sponsor/drivers">Drivers</Link>
              </li>
              <li>
                <Link to="/sponsor/catalog">Catalog</Link>
              </li>
            </>
          )}
          {user?.role_name?.toLowerCase() === 'driver' && (
            <>
              <li>
                <Link to="/driver/sponsors">Sponsors</Link>
              </li>
              <li>
                <Link to="/market">Market</Link>
              </li>
              <li>
                <Link to="/cart">Cart</Link>
              </li>
            </>
          )}
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/account">Account</Link>
          </li>
          <li>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </li>
        </ul>
        {user && (
          <div className="sidebar-footer">
            <p>
              <strong>{user.user?.email || 'User'}</strong>
            </p>
            <p className="user-role">{user.role_name}</p>
          </div>
        )}
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
