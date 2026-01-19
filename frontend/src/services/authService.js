import { authApi } from './api';

const AuthService = {
  /**
   * Register a new user
   * @param {Object} userData - { email, password, roles }
   */
  register: async (userData) => {
    const response = await authApi.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  login: async (credentials) => {
    const response = await authApi.post('/auth/login', credentials);
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      // Store user data from login response
      if (response.data.data.email && response.data.data.roles) {
        const userData = {
          email: response.data.data.email,
          roles: Array.isArray(response.data.data.roles) 
            ? response.data.data.roles 
            : Array.from(response.data.data.roles)
        };
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }
    return response.data;
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from API
   */
  getCurrentUser: async () => {
    try {
      const response = await authApi.get('/auth/me');
      if (response.data.success && response.data.data) {
        // Normalize roles to array
        const userData = response.data.data;
        if (userData.roles && !Array.isArray(userData.roles)) {
          userData.roles = Array.from(userData.roles);
        }
        return { success: true, data: userData };
      }
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
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
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('Error parsing stored user:', e);
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
};

export default AuthService;
