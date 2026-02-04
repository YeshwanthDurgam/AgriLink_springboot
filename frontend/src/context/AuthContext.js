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
      console.log('[AuthContext] Initializing auth state...');
      try {
        const token = AuthService.getToken();
        if (token) {
          console.log('[AuthContext] Token found, checking for stored user...');
          const storedUser = AuthService.getStoredUser();
          if (storedUser) {
            console.log('[AuthContext] Using stored user:', storedUser);
            setUser(storedUser);
          }
          // Always try to fetch fresh user data from backend
          try {
            console.log('[AuthContext] Fetching fresh user data from backend...');
            const response = await AuthService.getCurrentUser();
            if (response.success && response.data) {
              const freshUser = {
                ...storedUser,
                ...response.data,
                name: response.data.name || response.data.email?.split('@')[0] || storedUser?.name || 'User'
              };
              console.log('[AuthContext] Fresh user data loaded:', freshUser);
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
            }
          } catch (err) {
            console.error('[AuthContext] Failed to fetch fresh user data:', err);
            // Keep using stored user if fetch fails
          }
        } else {
          console.log('[AuthContext] No token found, user is not authenticated');
        }
      } catch (err) {
        console.error('[AuthContext] Auth initialization error:', err);
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
    console.log('[AuthContext] Login attempt for:', email);
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
            userData = { 
              ...userData, 
              ...userResponse.data,
              name: userResponse.data.name || userData.name || email.split('@')[0]
            };
          }
        } catch (e) {
          console.warn('[AuthContext] Could not fetch additional user data:', e);
        }
        
        // Ensure name is set
        if (!userData.name) {
          userData.name = email.split('@')[0];
        }
        
        console.log('[AuthContext] Login successful, setting user:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        const roles = userData.roles || [];
        let defaultRedirect = '/';
        
        // FARMERS always go to profile onboarding first to check profile/verification status
        if (roles.includes('FARMER')) {
          defaultRedirect = '/profile/onboarding';
        } else if (roles.includes('MANAGER') || roles.includes('ADMIN')) {
          defaultRedirect = getDashboardRoute(userData);
        }
        // CUSTOMERS go to home page (like Amazon/Flipkart)
        
        return { 
          success: true, 
          redirectTo: defaultRedirect,
          user: userData
        };
      }
      console.warn('[AuthContext] Login failed:', response.message);
      return { success: false, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      console.error('[AuthContext] Login error:', message);
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
