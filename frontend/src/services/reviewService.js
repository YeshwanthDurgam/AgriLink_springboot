import api from './api';

const reviewService = {
  // Get reviews for a listing
  getListingReviews: async (listingId, page = 0, size = 10) => {
    const response = await api.get(`/marketplace/api/v1/listings/${listingId}/reviews`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get listing rating summary
  getListingRating: async (listingId) => {
    const response = await api.get(`/marketplace/api/v1/listings/${listingId}/rating`);
    return response.data;
  },

  // Check if user can review
  canReview: async (listingId) => {
    const response = await api.get(`/marketplace/api/v1/listings/${listingId}/can-review`);
    return response.data;
  },

  // Create a review
  createReview: async (listingId, reviewData) => {
    const response = await api.post(`/marketplace/api/v1/listings/${listingId}/reviews`, reviewData);
    return response.data;
  },

  // Get seller reviews
  getSellerReviews: async (sellerId, page = 0, size = 10) => {
    const response = await api.get(`/marketplace/api/v1/sellers/${sellerId}/reviews`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get seller rating details
  getSellerRating: async (sellerId) => {
    const response = await api.get(`/marketplace/api/v1/sellers/${sellerId}/rating/details`);
    return response.data;
  },

  // Mark review as helpful
  markHelpful: async (reviewId) => {
    const response = await api.post(`/marketplace/api/v1/reviews/${reviewId}/helpful`);
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/marketplace/api/v1/reviews/${reviewId}`);
    return response.data;
  }
};

export default reviewService;
