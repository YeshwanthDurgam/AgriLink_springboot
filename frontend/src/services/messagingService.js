import { notificationApi } from './api';

const messagingService = {
  // Send a message
  sendMessage: async (messageData) => {
    const response = await notificationApi.post('/messages', messageData);
    return response.data; // Returns { success, data, message }
  },

  // Get conversations
  getConversations: async (page = 0, size = 20) => {
    const response = await notificationApi.get('/messages/conversations', {
      params: { page, size }
    });
    return response.data; // Returns { success, data: { content, ... } }
  },

  // Get a specific conversation
  getConversation: async (conversationId) => {
    const response = await notificationApi.get(`/messages/conversations/${conversationId}`);
    return response.data; // Returns { success, data }
  },

  // Get or create conversation with a user
  getOrCreateConversation: async (otherUserId, listingId = null, listingTitle = null) => {
    const params = { otherUserId };
    if (listingId) params.listingId = listingId;
    if (listingTitle) params.listingTitle = listingTitle;
    
    const response = await notificationApi.post('/messages/conversations', null, { params });
    return response.data; // Returns { success, data }
  },

  // Alias for createConversation (used by ChatWidget)
  createConversation: async ({ recipientId, listingId, initialMessage }) => {
    // First create/get the conversation
    const convResponse = await notificationApi.post('/messages/conversations', null, { 
      params: { otherUserId: recipientId, listingId } 
    });
    
    if (convResponse.data?.success && convResponse.data?.data) {
      // Send the initial message
      if (initialMessage) {
        await notificationApi.post('/messages', {
          recipientId,
          content: initialMessage,
          listingId
        });
      }
      return convResponse.data.data;
    }
    return convResponse.data;
  },

  // Get messages in a conversation
  getMessages: async (conversationId, page = 0, size = 50) => {
    const response = await notificationApi.get(`/messages/conversations/${conversationId}/messages`, {
      params: { page, size }
    });
    return response.data; // Returns { success, data: { content, ... } }
  },

  // Alias for getMessages (used by ChatWidget)
  getConversationMessages: async (conversationId) => {
    const response = await notificationApi.get(`/messages/conversations/${conversationId}/messages`, {
      params: { page: 0, size: 50 }
    });
    const data = response.data?.data || response.data;
    return data?.content || [];
  },

  // Mark conversation as read
  markAsRead: async (conversationId) => {
    const response = await notificationApi.post(`/messages/conversations/${conversationId}/read`);
    return response.data;
  },

  // Get unread count - safely handles notification service being down
  getUnreadCount: async () => {
    try {
      const response = await notificationApi.get('/messages/unread-count');
      return response.data?.data?.count || 0;
    } catch (error) {
      // Silently fail if notification service is down - return 0 as default
      console.debug('[messagingService] Notification service unavailable, returning 0 unread count');
      return 0;
    }
  },

  // Contact admin/support
  contactAdmin: async () => {
    // This will need an admin user ID - for now return mock
    // In production, fetch admin user ID from backend
    throw new Error('Admin contact not implemented');
  }
};

export default messagingService;
