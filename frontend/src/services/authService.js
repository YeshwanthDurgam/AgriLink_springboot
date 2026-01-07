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
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      // Fetch user details after login
      const userResponse = await authApi.get('/auth/me');
      if (userResponse.data.success) {
        localStorage.setItem('user', JSON.stringify(userResponse.data.data));
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
    const response = await authApi.get('/auth/me');
    return response.data;
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
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
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },
};

export default AuthService;
