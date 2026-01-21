import { farmApi, orderApi } from './api';

const exportService = {
  // Farm exports
  exportFarms: async () => {
    const response = await farmApi.get('/export/farms', {
      responseType: 'blob'
    });
    return response;
  },

  exportFields: async () => {
    const response = await farmApi.get('/export/fields', {
      responseType: 'blob'
    });
    return response;
  },

  exportCropPlans: async () => {
    const response = await farmApi.get('/export/crops', {
      responseType: 'blob'
    });
    return response;
  },

  exportFarmAnalytics: async () => {
    const response = await farmApi.get('/export/analytics', {
      responseType: 'blob'
    });
    return response;
  },

  // Order/Sales exports
  exportOrders: async () => {
    const response = await orderApi.get('/export/orders', {
      responseType: 'blob'
    });
    return response;
  },

  exportOrderItems: async () => {
    const response = await orderApi.get('/export/order-items', {
      responseType: 'blob'
    });
    return response;
  },

  exportSalesAnalytics: async (period = 'MONTH') => {
    const response = await orderApi.get('/export/sales-analytics', {
      params: { period },
      responseType: 'blob'
    });
    return response;
  },

  // Helper function to download blob as file
  downloadBlob: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default exportService;
