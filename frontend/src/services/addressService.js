import { userApi } from './api';

/**
 * Address Service - handles user address operations
 */
const addressService = {
  /**
   * Get all addresses for current user
   */
  getAddresses: async () => {
    const response = await userApi.get('/addresses');
    return response.data;
  },

  /**
   * Get address by ID
   */
  getAddress: async (addressId) => {
    const response = await userApi.get(`/addresses/${addressId}`);
    return response.data;
  },

  /**
   * Get default address
   */
  getDefaultAddress: async () => {
    const response = await userApi.get('/addresses/default');
    return response.data;
  },

  /**
   * Get shipping addresses
   */
  getShippingAddresses: async () => {
    const response = await userApi.get('/addresses/shipping');
    return response.data;
  },

  /**
   * Get billing addresses
   */
  getBillingAddresses: async () => {
    const response = await userApi.get('/addresses/billing');
    return response.data;
  },

  /**
   * Create new address
   */
  createAddress: async (addressData) => {
    const response = await userApi.post('/addresses', addressData);
    return response.data;
  },

  /**
   * Update address
   */
  updateAddress: async (addressId, addressData) => {
    const response = await userApi.put(`/addresses/${addressId}`, addressData);
    return response.data;
  },

  /**
   * Set address as default
   */
  setDefaultAddress: async (addressId) => {
    const response = await userApi.patch(`/addresses/${addressId}/default`);
    return response.data;
  },

  /**
   * Delete address
   */
  deleteAddress: async (addressId) => {
    const response = await userApi.delete(`/addresses/${addressId}`);
    return response.data;
  },

  /**
   * Get address count
   */
  getAddressCount: async () => {
    const response = await userApi.get('/addresses/count');
    return response.data.count;
  }
};

export default addressService;
