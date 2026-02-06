import { authApi } from './api';

const AuthService = {
  /**
   * Register a new user
   * @param {Object} userData - { email, password, roles }
   */
  register: async (userData) => {
    console.log('[AuthService] Registering user:', userData.email);
    const response = await authApi.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  login: async (credentials) => {
    console.log('[AuthService] Attempting login for:', credentials.email);
    const response = await authApi.post('/auth/login', credentials);
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      // Store complete user data from login response
      const loginData = response.data.data;
      // CRITICAL: Do NOT store profileComplete or profileStatus in localStorage
      // These must always be fetched fresh from the backend to ensure consistency
      const userData = {
        id: loginData.userId,
        email: loginData.email,
        name: loginData.name || loginData.email?.split('@')[0] || 'User',
        roles: Array.isArray(loginData.roles) 
          ? loginData.roles 
          : (loginData.roles ? Array.from(loginData.roles) : [])
        // profileComplete and profileStatus are intentionally NOT cached
        // FarmerRoute fetches these fresh from backend on every access
      };
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('[AuthService] Login successful, user data stored:', userData);
    }
    return response.data;
  },

  /**
   * Logout user
   */
  logout: () => {
    console.log('[AuthService] Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from API
   */
  getCurrentUser: async () => {
    try {
      console.log('[AuthService] Fetching current user from /auth/me');
      const response = await authApi.get('/auth/me');
      if (response.data.success && response.data.data) {
        // Normalize user data
        const userData = response.data.data;
        if (userData.roles && !Array.isArray(userData.roles)) {
          userData.roles = Array.from(userData.roles);
        }
        // Ensure name exists
        if (!userData.name && userData.email) {
          userData.name = userData.email.split('@')[0];
        }
        console.log('[AuthService] Current user fetched successfully:', userData);
        return { success: true, data: userData };
      }
      console.warn('[AuthService] getCurrentUser returned unsuccessful response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AuthService] Failed to get current user:', error.response?.status, error.message);
      return { success: false, message: 'Failed to get user data' };
    }
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        // Normalize roles to array
        if (parsed.roles && !Array.isArray(parsed.roles)) {
          parsed.roles = Array.from(parsed.roles);
        }
        // Ensure name exists
        if (!parsed.name && parsed.email) {
          parsed.name = parsed.email.split('@')[0];
        }
        console.log('[AuthService] Retrieved stored user:', parsed);
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('[AuthService] Error parsing stored user:', e);
      return null;
    }
  },

  /**
   * Get stored token
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Refresh token (if your API supports it)
   */
  refreshToken: async () => {
    const response = await authApi.post('/auth/refresh');
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  /**
   * Request password reset email
   * @param {string} email - User's email address
   */
  forgotPassword: async (email) => {
    const response = await authApi.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Validate password reset token
   * @param {string} token - Reset token from email
   */
  validateResetToken: async (token) => {
    const response = await authApi.get(`/auth/validate-reset-token?token=${token}`);
    return response.data;
  },

  /**
   * Reset password with token
   * @param {Object} data - { token, newPassword, confirmPassword }
   */
  resetPassword: async (data) => {
    const response = await authApi.post('/auth/reset-password', data);
    return response.data;
  },
};

export default AuthService;
