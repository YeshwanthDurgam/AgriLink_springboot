import api from './api';

const NOTIFICATION_SERVICE_URL = '/notification-service';

const notificationService = {
  // Get all notifications (paginated)
  getNotifications: (page = 0, size = 20) => {
    return api.get(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications`, {
      params: { page, size }
    });
  },

  // Get unread notifications
  getUnreadNotifications: () => {
    return api.get(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/unread`);
  },

  // Get unread count
  getUnreadCount: () => {
    return api.get(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/count`);
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    return api.post(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: () => {
    return api.post(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/read-all`);
  },

  // Delete notification
  deleteNotification: (notificationId) => {
    return api.delete(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/${notificationId}`);
  },

  // Get notification preferences
  getPreferences: () => {
    return api.get(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/preferences`);
  },

  // Update notification preferences
  updatePreferences: (preferences) => {
    return api.put(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/preferences`, preferences);
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
