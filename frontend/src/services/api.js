import axios from 'axios';

// API Base URLs for different services
const API_URLS = {
  auth: process.env.REACT_APP_AUTH_API_URL || 'http://localhost:8081/api/v1',
  user: process.env.REACT_APP_USER_API_URL || 'http://localhost:8082/api/v1',
  farm: process.env.REACT_APP_FARM_API_URL || 'http://localhost:8083/api/v1',
  marketplace: process.env.REACT_APP_MARKETPLACE_API_URL || 'http://localhost:8084/api/v1',
  order: process.env.REACT_APP_ORDER_API_URL || 'http://localhost:8085/api/v1',
  notification: process.env.REACT_APP_NOTIFICATION_API_URL || 'http://localhost:8087/api/v1',
};

// Create axios instances for each service
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 30000, // 30 second timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      return config;
    },
    (error) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors
  instance.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      if (error.code === 'ERR_NETWORK') {
        console.error('[API Network Error] Unable to reach server:', error.config?.baseURL);
        console.error('Make sure the backend service is running.');
      } else if (error.response?.status === 401) {
        // Token expired or invalid - clear storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        console.error('[API Error]', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          message: error.message
        });
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export API instances
export const authApi = createApiInstance(API_URLS.auth);
export const userApi = createApiInstance(API_URLS.user);
export const farmApi = createApiInstance(API_URLS.farm);
export const marketplaceApi = createApiInstance(API_URLS.marketplace);
export const orderApi = createApiInstance(API_URLS.order);
export const notificationApi = createApiInstance(API_URLS.notification);

export default {
  auth: authApi,
  user: userApi,
  farm: farmApi,
  marketplace: marketplaceApi,
  order: orderApi,
  notification: notificationApi,
};
