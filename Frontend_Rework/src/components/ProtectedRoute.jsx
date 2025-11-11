import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Get role from user.role_name (backend returns role_name as the role string)
  // Normalize to lowercase for comparison
  const userRole = user.role_name?.toLowerCase();

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'sponsor':
        return <Navigate to="/sponsor" replace />;
      case 'driver':
        return <Navigate to="/driver" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
