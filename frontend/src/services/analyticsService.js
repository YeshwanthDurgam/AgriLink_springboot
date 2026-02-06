import { farmApi, orderApi, marketplaceApi } from './api';

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

  // Demand Forecast Analytics (new)
  getDemandForecast: async (cropType, district, state) => {
    const params = new URLSearchParams();
    params.append('cropType', cropType);
    if (district) params.append('district', district);
    if (state) params.append('state', state);
    const response = await marketplaceApi.get(`/analytics/demand?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getDemandMetadata: async () => {
    const response = await marketplaceApi.get('/analytics/demand/metadata');
    return response.data?.data || response.data;
  },

  getSupportedCrops: async () => {
    const response = await marketplaceApi.get('/analytics/demand/crops');
    return response.data?.data || response.data;
  },

  getSupportedStates: async () => {
    const response = await marketplaceApi.get('/analytics/demand/states');
    return response.data?.data || response.data;
  },

  // Harvest Guidance (new)
  getHarvestGuidance: async (cropName, location, farmId) => {
    const params = new URLSearchParams();
    params.append('cropName', cropName);
    if (location) params.append('location', location);
    if (farmId) params.append('farmId', farmId);
    const response = await farmApi.get(`/farms/harvest-guidance?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getHarvestGuidanceCrops: async () => {
    const response = await farmApi.get('/farms/harvest-guidance/crops');
    return response.data?.data || response.data;
  },
};

export default analyticsService;
