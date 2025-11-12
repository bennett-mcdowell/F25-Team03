import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordReset from './pages/PasswordReset';
import AdminDashboard from './pages/AdminDashboard';
import SponsorDashboard from './pages/SponsorDashboard';
import SponsorCatalog from './pages/SponsorCatalog';
import DriverDashboard from './pages/DriverDashboard';
import Market from './pages/Market';
import Cart from './pages/Cart';
import About from './pages/About';
import Account from './pages/Account';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/sponsor"
            element={
              <ProtectedRoute allowedRoles={['sponsor']}>
                <SponsorDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/sponsor/catalog"
            element={
              <ProtectedRoute allowedRoles={['sponsor']}>
                <SponsorCatalog />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/driver"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/market"
            element={
              <ProtectedRoute>
                <Market />
              </ProtectedRoute>
            }
          />
          
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
