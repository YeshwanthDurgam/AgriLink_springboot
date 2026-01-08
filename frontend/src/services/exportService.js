import api from './api';

const FARM_SERVICE_URL = '/farm-service';

const exportService = {
  // Farm exports
  exportFarms: () => {
    return api.get(`${FARM_SERVICE_URL}/api/v1/export/farms`, {
      responseType: 'blob'
    });
  },

  exportFields: () => {
    return api.get(`${FARM_SERVICE_URL}/api/v1/export/fields`, {
      responseType: 'blob'
    });
  },

  exportCropPlans: () => {
    return api.get(`${FARM_SERVICE_URL}/api/v1/export/crops`, {
      responseType: 'blob'
    });
  },

  exportFarmAnalytics: () => {
    return api.get(`${FARM_SERVICE_URL}/api/v1/export/analytics`, {
      responseType: 'blob'
    });
  },

  // Order/Sales exports
  exportOrders: () => {
    return api.get(`/order-service/api/v1/export/orders`, {
      responseType: 'blob'
    });
  },

  exportOrderItems: () => {
    return api.get(`/order-service/api/v1/export/order-items`, {
      responseType: 'blob'
    });
  },

  exportSalesAnalytics: (period = 'MONTH') => {
    return api.get(`/order-service/api/v1/export/sales-analytics`, {
      params: { period },
      responseType: 'blob'
    });
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
