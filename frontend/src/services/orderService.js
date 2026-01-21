import { orderApi } from './api';

const orderService = {
  // Get all orders for the current user (as buyer)
  getMyOrders: async (page = 0, size = 10) => {
    const response = await orderApi.get('/orders/my/purchases', {
      params: { page, size }
    });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await orderApi.get(`/orders/${id}`);
    return response.data;
  },

  // Get order by order number
  getOrderByNumber: async (orderNumber) => {
    const response = await orderApi.get(`/orders/number/${orderNumber}`);
    return response.data;
  },

  // Create a new order
  createOrder: async (orderData) => {
    const response = await orderApi.post('/orders', orderData);
    return response.data;
  },

  // Update order status (for farmers/sellers)
  updateOrderStatus: async (id, status) => {
    const response = await orderApi.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  // Confirm order (seller only)
  confirmOrder: async (id) => {
    const response = await orderApi.post(`/orders/${id}/confirm`);
    return response.data;
  },

  // Ship order (seller only)
  shipOrder: async (id) => {
    const response = await orderApi.post(`/orders/${id}/ship`);
    return response.data;
  },

  // Mark as delivered (seller only)
  deliverOrder: async (id) => {
    const response = await orderApi.post(`/orders/${id}/deliver`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id) => {
    const response = await orderApi.post(`/orders/${id}/cancel`);
    return response.data;
  },

  // Get orders for seller (farmers)
  getSellerOrders: async (page = 0, size = 10) => {
    const response = await orderApi.get('/orders/my/sales', {
      params: { page, size }
    });
    return response.data;
  },

  // Start demo auto-progress for order (simulates order lifecycle)
  startDemoProgress: async (orderId) => {
    const response = await orderApi.post(`/orders/${orderId}/demo-progress`);
    return response.data;
  },
};

export default orderService;
