import { farmApi, orderApi, iotApi } from './api';

const analyticsService = {
  // Farm Analytics
  getDashboardSummary: async () => {
    const response = await farmApi.get('/analytics/dashboard');
    return response.data?.data || response.data;
  },

  getFarmAnalytics: async (farmId) => {
    const response = await farmApi.get(`/analytics/farms/${farmId}`);
    return response.data?.data || response.data;
  },

  // Sales Analytics
  getSalesAnalytics: async () => {
    const response = await orderApi.get('/analytics/sales');
    return response.data?.data || response.data;
  },

  // IoT/Sensor Analytics
  getSensorAnalytics: async () => {
    const response = await iotApi.get('/analytics/sensors');
    return response.data?.data || response.data;
  },
};

export default analyticsService;
