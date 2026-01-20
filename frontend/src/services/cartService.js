import { orderApi } from './api';

/**
 * Cart Service - handles shopping cart operations
 */
const cartService = {
  /**
   * Get current user's cart
   */
  getCart: async () => {
    const response = await orderApi.get('/cart');
    return response.data;
  },

  /**
   * Add item to cart
   * @param {Object} item - Cart item with listingId, sellerId, quantity, unitPrice, listingTitle, listingImageUrl, unit, availableQuantity
   */
  addToCart: async (item) => {
    const response = await orderApi.post('/cart/items', {
      listingId: item.listingId,
      sellerId: item.sellerId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      listingTitle: item.listingTitle,
      listingImageUrl: item.listingImageUrl || null,
      unit: item.unit || 'kg',
      availableQuantity: item.availableQuantity || null
    });
    return response.data;
  },

  /**
   * Update cart item quantity (uses listingId)
   */
  updateCartItem: async (listingId, quantity) => {
    const response = await orderApi.put(`/cart/items/${listingId}`, {
      quantity
    });
    return response.data;
  },

  /**
   * Remove item from cart (uses listingId)
   */
  removeFromCart: async (listingId) => {
    const response = await orderApi.delete(`/cart/items/${listingId}`);
    return response.data;
  },

  /**
   * Clear entire cart
   */
  clearCart: async () => {
    const response = await orderApi.delete('/cart');
    return response.data;
  },

  /**
   * Get cart count
   */
  getCartCount: async () => {
    const response = await orderApi.get('/cart/count');
    return response.data;
  }
};

export default cartService;
