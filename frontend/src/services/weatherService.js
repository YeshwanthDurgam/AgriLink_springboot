import { farmApi } from './api';

const weatherService = {
  // Get weather for a specific farm
  getWeatherForFarm: async (farmId) => {
    const response = await farmApi.get(`/weather/farm/${farmId}`);
    return response.data?.data || response.data;
  },

  // Get weather for coordinates
  getWeatherForLocation: async (latitude, longitude) => {
    const response = await farmApi.get('/weather/location', {
      params: { latitude, longitude }
    });
    return response.data?.data || response.data;
  },

  // Get farming recommendations based on weather
  getFarmingRecommendations: async (farmId) => {
    const response = await farmApi.get(`/weather/farm/${farmId}/recommendations`);
    return response.data?.data || response.data;
  }
};

export default weatherService;
