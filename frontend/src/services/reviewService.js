import { marketplaceApi } from './api';

const reviewService = {
  // Get reviews for a listing
  getListingReviews: async (listingId, page = 0, size = 10) => {
    const response = await marketplaceApi.get(`/listings/${listingId}/reviews`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get listing rating summary
  getListingRating: async (listingId) => {
    const response = await marketplaceApi.get(`/listings/${listingId}/rating`);
    return response.data;
  },

  // Check if user can review
  canReview: async (listingId) => {
    const response = await marketplaceApi.get(`/listings/${listingId}/can-review`);
    return response.data;
  },

  // Create a review
  createReview: async (listingId, reviewData) => {
    const response = await marketplaceApi.post(`/listings/${listingId}/reviews`, reviewData);
    return response.data;
  },

  // Get seller reviews
  getSellerReviews: async (sellerId, page = 0, size = 10) => {
    const response = await marketplaceApi.get(`/sellers/${sellerId}/reviews`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get seller rating details
  getSellerRating: async (sellerId) => {
    const response = await marketplaceApi.get(`/sellers/${sellerId}/rating/details`);
    return response.data;
  },

  // Mark review as helpful
  markHelpful: async (reviewId) => {
    const response = await marketplaceApi.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    const response = await marketplaceApi.delete(`/reviews/${reviewId}`);
    return response.data;
  }
};

export default reviewService;
