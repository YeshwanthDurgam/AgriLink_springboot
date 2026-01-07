import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/authService';

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
            const response = await AuthService.getCurrentUser();
            if (response.success) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
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
        const userResponse = await AuthService.getCurrentUser();
        if (userResponse.success) {
          setUser(userResponse.data);
          localStorage.setItem('user', JSON.stringify(userResponse.data));
        }
        return { success: true };
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

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
