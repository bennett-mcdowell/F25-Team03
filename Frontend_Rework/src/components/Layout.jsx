import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
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
                <Link to="/driver/market">Market</Link>
              </li>
              <li>
                <Link to="/driver/cart">Cart</Link>
              </li>
            </>
          )}
          <li>
            <Link to="/about">About</Link>
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
