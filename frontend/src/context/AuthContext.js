import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AuthService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Get the appropriate dashboard route based on user roles
 * Role hierarchy: ADMIN → MANAGER → FARMER → CUSTOMER
 * @param {Object} user - User object with roles
 * @returns {string} - Dashboard route
 */
const getDashboardRoute = (user) => {
  if (!user || !user.roles) return '/dashboard';
  
  const roles = user.roles;
  
  if (roles.includes('ADMIN')) {
    return '/admin/dashboard';
  } else if (roles.includes('MANAGER')) {
    return '/manager/dashboard';
  } else if (roles.includes('FARMER')) {
    return '/farmer/dashboard';
  } else if (roles.includes('CUSTOMER') || roles.includes('BUYER')) {
    return '/buyer/dashboard';
  }
  
  return '/dashboard';
};

/**
 * Get user display name from user object
 */
const getUserDisplayName = (user) => {
  if (!user) return 'User';
  if (user.name) return user.name;
  if (user.email) return user.email.split('@')[0];
  return 'User';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = AuthService.getToken();
        if (token) {
          const storedUser = AuthService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            // If we have a token but no user, fetch user data
            try {
              const response = await AuthService.getCurrentUser();
              if (response.success) {
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
              }
            } catch (err) {
              console.error('Failed to fetch user data:', err);
              AuthService.logout();
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Clear invalid auth data
        AuthService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.login({ email, password });
      if (response.success) {
        // Get user data from response or fetch it
        let userData = response.data;
        if (userData.userId) {
          userData.id = userData.userId;
        }
        
        // Try to get more user details
        try {
          const userResponse = await AuthService.getCurrentUser();
          if (userResponse.success) {
            userData = { ...userData, ...userResponse.data };
          }
        } catch (e) {
          console.warn('Could not fetch additional user data:', e);
        }
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect directly to dashboard like Amazon/Flipkart (no profile completion required)
        const dashboardRoute = getDashboardRoute(userData);
        
        return { 
          success: true, 
          redirectTo: dashboardRoute,
          user: userData
        };
      }
      return { success: false, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.register(userData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      const validationErrors = err.response?.data?.validationErrors;
      setError(message);
      return { success: false, message, validationErrors };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
    getDashboardRoute: () => getDashboardRoute(user),
    getUserDisplayName: () => getUserDisplayName(user),
  }), [user, loading, error, login, register, logout, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
