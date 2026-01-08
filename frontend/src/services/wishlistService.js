import { marketplaceApi } from './api';

/**
 * Wishlist Service - handles wishlist operations
 */
const wishlistService = {
  /**
   * Get current user's wishlist
   */
  getWishlist: async (page = 0, size = 12) => {
    const response = await marketplaceApi.get('/wishlist', {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Get all wishlist items (no pagination)
   */
  getAllWishlistItems: async () => {
    const response = await marketplaceApi.get('/wishlist/all');
    return response.data;
  },

  /**
   * Add listing to wishlist
   */
  addToWishlist: async (listingId) => {
    const response = await marketplaceApi.post(`/wishlist/${listingId}`);
    return response.data;
  },

  /**
   * Remove listing from wishlist
   */
  removeFromWishlist: async (listingId) => {
    const response = await marketplaceApi.delete(`/wishlist/${listingId}`);
    return response.data;
  },

  /**
   * Check if listing is in wishlist
   */
  isInWishlist: async (listingId) => {
    const response = await marketplaceApi.get(`/wishlist/check/${listingId}`);
    return response.data.inWishlist;
  },

  /**
   * Get wishlist count
   */
  getWishlistCount: async () => {
    const response = await marketplaceApi.get('/wishlist/count');
    return response.data.count;
  },

  /**
   * Get list of listing IDs in wishlist
   */
  getWishlistIds: async () => {
    const response = await marketplaceApi.get('/wishlist/ids');
    return response.data;
  },

  /**
   * Clear wishlist
   */
  clearWishlist: async () => {
    const response = await marketplaceApi.delete('/wishlist');
    return response.data;
  }
};

export default wishlistService;
