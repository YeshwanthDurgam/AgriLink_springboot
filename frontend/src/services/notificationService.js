import { notificationApi } from './api';

const notificationService = {
  // Get all notifications (paginated)
  getNotifications: async (page = 0, size = 20) => {
    const response = await notificationApi.get('/notifications', {
      params: { page, size }
    });
    return response.data;
  },

  // Get unread notifications
  getUnreadNotifications: async () => {
    const response = await notificationApi.get('/notifications/unread');
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await notificationApi.get('/notifications/count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await notificationApi.post(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await notificationApi.post('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await notificationApi.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Get notification preferences
  getPreferences: async () => {
    const response = await notificationApi.get('/notifications/preferences');
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    const response = await notificationApi.put('/notifications/preferences', preferences);
    return response.data;
  },

  // WebSocket connection for real-time notifications
  connectWebSocket: (token, onMessage, onConnect, onDisconnect) => {
    const wsUrl = `ws://localhost:8087/ws/notifications`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Authenticate with token
      ws.send(JSON.stringify({ type: 'AUTH', token }));
      if (onConnect) onConnect();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      if (onDisconnect) onDisconnect();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Return ws for cleanup
    return ws;
  }
};

export default notificationService;
