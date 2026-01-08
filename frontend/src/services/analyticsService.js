import api from './api';

const FARM_API = '/farm-service/api/v1/analytics';
const ORDER_API = '/order-service/api/v1/analytics';
const IOT_API = '/iot-service/api/v1/analytics';

const analyticsService = {
  // Farm Analytics
  getDashboardSummary: async () => {
    const response = await api.get(`${FARM_API}/dashboard`);
    return response.data;
  },

  getFarmAnalytics: async (farmId) => {
    const response = await api.get(`${FARM_API}/farms/${farmId}`);
    return response.data;
  },

  // Sales Analytics
  getSalesAnalytics: async () => {
    const response = await api.get(`${ORDER_API}/sales`);
    return response.data;
  },

  // IoT/Sensor Analytics
  getSensorAnalytics: async () => {
    const response = await api.get(`${IOT_API}/sensors`);
    return response.data;
  },
};

export default analyticsService;
