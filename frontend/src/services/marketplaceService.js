import { marketplaceApi } from './api';

const marketplaceService = {
  // Get all listings with pagination and filters
  getListings: async (params = {}) => {
    const { page = 0, size = 12, categoryId, minPrice, maxPrice, search, sortBy } = params;
    
    // If categoryId is provided, use the category endpoint
    if (categoryId) {
      const response = await marketplaceApi.get(`/listings/category/${categoryId}`, {
        params: { page, size }
      });
      return response.data.data || response.data;
    }
    
    // If search or filters, use search endpoint
    if (search || minPrice || maxPrice) {
      const response = await marketplaceApi.get('/listings/search', {
        params: { 
          keyword: search, 
          minPrice, 
          maxPrice, 
          page, 
          size,
          sortBy: sortBy?.split(',')[0] || 'createdAt',
          sortDir: sortBy?.split(',')[1] || 'desc'
        }
      });
      return response.data.data || response.data;
    }
    
    // Default: get all listings
    const response = await marketplaceApi.get('/listings', {
      params: { page, size }
    });
    // API returns { success, data: { content, page, size, ... } }
    return response.data.data || response.data;
  },

  // Get listings by category ID
  getListingsByCategory: async (categoryId, page = 0, size = 12) => {
    const response = await marketplaceApi.get(`/listings/category/${categoryId}`, {
      params: { page, size }
    });
    return response.data.data || response.data;
  },

  // Get listing by ID
  getListingById: async (id) => {
    const response = await marketplaceApi.get(`/listings/${id}`);
    // API returns { success, data: {...} }
    return response.data.data || response.data;
  },

  // Create a new listing (farmers only)
  createListing: async (listingData) => {
    const response = await marketplaceApi.post('/listings', listingData);
    return response.data.data || response.data;
  },

  // Update listing
  updateListing: async (id, listingData) => {
    const response = await marketplaceApi.put(`/listings/${id}`, listingData);
    return response.data.data || response.data;
  },

  // Delete listing
  deleteListing: async (id) => {
    const response = await marketplaceApi.delete(`/listings/${id}`);
    return response.data.data || response.data;
  },

  // Get my listings (for farmers)
  getMyListings: async (page = 0, size = 10) => {
    const response = await marketplaceApi.get('/listings/my', {
      params: { page, size }
    });
    return response.data.data || response.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await marketplaceApi.get('/categories');
    // API returns { success, data: [...] }
    return response.data.data || response.data;
  },

  // Search listings
  searchListings: async (query, page = 0, size = 12) => {
    const response = await marketplaceApi.get('/listings/search', {
      params: { query, page, size }
    });
    return response.data.data || response.data;
  },

  // Publish a listing (change status to ACTIVE)
  publishListing: async (id) => {
    const response = await marketplaceApi.post(`/listings/${id}/publish`);
    return response.data.data || response.data;
  },

  // Get top listings
  getTopListings: async (limit = 10) => {
    const response = await marketplaceApi.get('/listings/top', {
      params: { limit }
    });
    return response.data.data || response.data;
  },

  // Get recent listings
  getRecentListings: async (limit = 10) => {
    const response = await marketplaceApi.get('/listings/recent', {
      params: { limit }
    });
    return response.data.data || response.data;
  },
};

export default marketplaceService;
