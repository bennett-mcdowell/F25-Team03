import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/apiService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!isCheckingAuth) {
      setIsCheckingAuth(true);
    }
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // 401 is expected when not logged in
      if (error.response?.status !== 401) {
        console.error('Auth check failed:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  const login = async (username, password) => {
    const loginResponse = await authService.login(username, password);
    console.log('AuthContext: Login response:', loginResponse);
    // Fetch full user data after successful login
    await checkAuth();
    console.log('AuthContext: User data after checkAuth:', user);
    // Return the login response (which has the role for navigation)
    return loginResponse;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
