import { farmApi } from './api';

const FarmService = {
  /**
   * Get all farms for the current user
   * @param {Object} params - { page, size, sort }
   */
  getMyFarms: async (params = {}) => {
    const response = await farmApi.get('/farms', { params });
    return response.data;
  },

  /**
   * Get a specific farm by ID
   * @param {string} farmId
   */
  getFarmById: async (farmId) => {
    const response = await farmApi.get(`/farms/${farmId}`);
    return response.data;
  },

  /**
   * Create a new farm
   * @param {Object} farmData
   */
  createFarm: async (farmData) => {
    const response = await farmApi.post('/farms', farmData);
    return response.data;
  },

  /**
   * Update an existing farm
   * @param {string} farmId
   * @param {Object} farmData
   */
  updateFarm: async (farmId, farmData) => {
    try {
      console.log(`FarmService.updateFarm - Making PUT request to /farms/${farmId}`);
      console.log('FarmService.updateFarm - Farm data:', { 
        ...farmData, 
        farmImageUrl: farmData.farmImageUrl ? '[IMAGE_PRESENT]' : '[NO_IMAGE]' 
      });
      const response = await farmApi.put(`/farms/${farmId}`, farmData);
      console.log('FarmService.updateFarm - Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('FarmService.updateFarm - Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        isNetworkError: !error.response
      });
      throw error;
    }
  },

  /**
   * Delete a farm
   * @param {string} farmId
   */
  deleteFarm: async (farmId) => {
    const response = await farmApi.delete(`/farms/${farmId}`);
    return response.data;
  },

  /**
   * Get all crops for a farm
   * @param {string} farmId
   */
  getFarmCrops: async (farmId) => {
    const response = await farmApi.get(`/farms/${farmId}/crops`);
    return response.data;
  },

  /**
   * Add a crop to a farm
   * @param {string} farmId
   * @param {Object} cropData
   */
  addCrop: async (farmId, cropData) => {
    const response = await farmApi.post(`/farms/${farmId}/crops`, cropData);
    return response.data;
  },

  /**
   * Update a crop
   * @param {string} cropId
   * @param {Object} cropData
   */
  updateCrop: async (cropId, cropData) => {
    const response = await farmApi.put(`/crops/${cropId}`, cropData);
    return response.data;
  },

  /**
   * Delete a crop
   * @param {string} cropId
   */
  deleteCrop: async (cropId) => {
    const response = await farmApi.delete(`/crops/${cropId}`);
    return response.data;
  },

  /**
   * Get farm statistics
   */
  getFarmStats: async () => {
    const response = await farmApi.get('/farms/stats');
    return response.data;
  },

  /**
   * Onboard a farm during profile setup
   * Creates a new farm or updates existing one for the farmer
   * @param {Object} farmData - { farmName, cropTypes, description, farmImageUrl, location, city, state }
   */
  onboardFarm: async (farmData) => {
    try {
      console.log('FarmService.onboardFarm - Making request to /farms/onboarding');
      console.log('FarmService.onboardFarm - Farm data:', { 
        ...farmData, 
        farmImageUrl: farmData.farmImageUrl ? '[BASE64_IMAGE_PRESENT]' : '[NO_IMAGE]' 
      });
      const response = await farmApi.post('/farms/onboarding', farmData);
      console.log('FarmService.onboardFarm - Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('FarmService.onboardFarm - Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        isNetworkError: !error.response
      });
      throw error;
    }
  },
};

export default FarmService;
