import { notificationApi } from './api';

const messagingService = {
  // Send a message
  sendMessage: async (messageData) => {
    const response = await notificationApi.post('/messages', messageData);
    return response.data?.data || response.data;
  },

  // Get conversations
  getConversations: async (page = 0, size = 20) => {
    const response = await notificationApi.get('/messages/conversations', {
      params: { page, size }
    });
    return response.data?.data || response.data;
  },

  // Get a specific conversation
  getConversation: async (conversationId) => {
    const response = await notificationApi.get(`/messages/conversations/${conversationId}`);
    return response.data?.data || response.data;
  },

  // Get or create conversation with a user
  getOrCreateConversation: async (otherUserId, listingId = null, listingTitle = null) => {
    const params = { otherUserId };
    if (listingId) params.listingId = listingId;
    if (listingTitle) params.listingTitle = listingTitle;
    
    const response = await notificationApi.post('/messages/conversations', null, { params });
    return response.data?.data || response.data;
  },

  // Get messages in a conversation
  getMessages: async (conversationId, page = 0, size = 50) => {
    const response = await notificationApi.get(`/messages/conversations/${conversationId}/messages`, {
      params: { page, size }
    });
    return response.data?.data || response.data;
  },

  // Mark conversation as read
  markAsRead: async (conversationId) => {
    const response = await notificationApi.post(`/messages/conversations/${conversationId}/read`);
    return response.data?.data || response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await notificationApi.get('/messages/unread-count');
    return response.data?.data || response.data || 0;
  }
};

export default messagingService;
