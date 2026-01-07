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
    const response = await farmApi.put(`/farms/${farmId}`, farmData);
    return response.data;
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
};

export default FarmService;
