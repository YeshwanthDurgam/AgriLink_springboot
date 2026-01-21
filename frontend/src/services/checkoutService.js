import { orderApi } from './api';

/**
 * Checkout Service - handles checkout and payment operations
 */
const checkoutService = {
  /**
   * Get checkout summary (cart totals with shipping and tax)
   */
  getCheckoutSummary: async () => {
    const response = await orderApi.get('/checkout/summary');
    return response.data.data || response.data;
  },

  /**
   * Initialize checkout - creates order and Razorpay payment order
   * @param {Object} checkoutData - Checkout request with shipping details
   */
  initializeCheckout: async (checkoutData) => {
    const response = await orderApi.post('/checkout/initialize', checkoutData);
    return response.data.data || response.data;
  },

  /**
   * Verify payment after Razorpay payment completion
   * @param {Object} paymentData - Payment verification data from Razorpay
   */
  verifyPayment: async (paymentData) => {
    const response = await orderApi.post('/checkout/verify-payment', paymentData);
    return response.data.data || response.data;
  },

  /**
   * Get Razorpay configuration
   */
  getRazorpayConfig: async () => {
    const response = await orderApi.get('/checkout/razorpay-config');
    return response.data.data || response.data;
  }
};

export default checkoutService;
