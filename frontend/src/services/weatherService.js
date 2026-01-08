import api from './api';

const FARM_SERVICE_URL = '/farm-service';

const weatherService = {
  // Get weather for a specific farm
  getWeatherForFarm: (farmId) => {
    return api.get(`${FARM_SERVICE_URL}/api/v1/weather/farm/${farmId}`);
  },

  // Get weather for coordinates
  getWeatherForLocation: (latitude, longitude) => {
    return api.get(`${FARM_SERVICE_URL}/api/v1/weather/location`, {
      params: { latitude, longitude }
    });
  },

  // Get farming recommendations based on weather
  getFarmingRecommendations: (farmId) => {
    return api.get(`${FARM_SERVICE_URL}/api/v1/weather/farm/${farmId}/recommendations`);
  }
};

export default weatherService;
