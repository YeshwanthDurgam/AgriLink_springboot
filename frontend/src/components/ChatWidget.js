import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// Tree-shakeable individual icon imports
import { FiMessageSquare } from '@react-icons/all-files/fi/FiMessageSquare';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiSend } from '@react-icons/all-files/fi/FiSend';
import { FiChevronDown } from '@react-icons/all-files/fi/FiChevronDown';
import { FiUser } from '@react-icons/all-files/fi/FiUser';
import { useAuth } from '../context/AuthContext';
import messagingService from '../services/messagingService';
import './ChatWidget.css';

const ChatWidget = ({ sellerId, sellerName, listingId, listingTitle }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load or create conversation when widget opens
  useEffect(() => {
    if (isOpen && isAuthenticated && sellerId) {
      loadConversation();
    }
  }, [isOpen, isAuthenticated, sellerId]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      // Check if conversation already exists
      const response = await messagingService.getConversations();
      const conversations = response?.data?.content || response?.content || [];
      const existing = conversations.find(c => 
        c.otherParticipantId === sellerId && 
        (!listingId || c.listingId === listingId)
      );

      if (existing) {
        setConversationId(existing.id);
        // Load messages
        const msgs = await messagingService.getConversationMessages(existing.id);
        setMessages(msgs || []);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setIsOpen(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const messageText = message.trim();
    setMessage('');
    setSending(true);

    try {
      let convId = conversationId;

      // Create conversation if it doesn't exist
      if (!convId) {
        const newConv = await messagingService.createConversation({
          recipientId: sellerId,
          listingId: listingId,
          initialMessage: messageText
        });
        convId = newConv.id;
        setConversationId(convId);
      } else {
        // Send message to existing conversation
        await messagingService.sendMessage({
          conversationId: convId,
          content: messageText
        });
      }

      // Add message to local state optimistically
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: messageText,
        senderId: user?.id,
        sentByMe: true,
        createdAt: new Date().toISOString()
      }]);

      // Refresh messages
      setTimeout(async () => {
        try {
          const msgs = await messagingService.getConversationMessages(convId);
          setMessages(msgs || []);
        } catch (err) {
          console.error('Error refreshing messages:', err);
        }
      }, 500);

    } catch (err) {
      console.error('Error sending message:', err);
      setMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quickMessages = [
    'Is this product available?',
    'What is the minimum order quantity?',
    'Can you provide a discount for bulk orders?',
    'What are the delivery options?'
  ];

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      {/* Chat Button */}
      {!isOpen && (
        <button className="chat-widget-btn" onClick={handleOpen}>
          <FiMessageSquare />
          <span>Chat with Seller</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="seller-avatar">
                {sellerName?.charAt(0)?.toUpperCase() || <FiUser />}
              </div>
              <div className="seller-details">
                <span className="seller-name">{sellerName || 'Seller'}</span>
                {listingTitle && (
                  <span className="listing-ref">Re: {listingTitle}</span>
                )}
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="minimize-btn" onClick={() => setIsOpen(false)}>
                <FiChevronDown />
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <FiX />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {loading ? (
              <div className="chat-loading">Loading conversation...</div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <p>Start a conversation with {sellerName || 'the seller'}</p>
                <div className="quick-messages">
                  {quickMessages.map((msg, i) => (
                    <button 
                      key={i}
                      className="quick-message-btn"
                      onClick={() => setMessage(msg)}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div 
                    key={msg.id || index}
                    className={`message ${msg.sentByMe || msg.senderId === user?.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-bubble">
                      {msg.content}
                    </div>
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form className="chat-input" onSubmit={handleSend}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
            />
            <button 
              type="submit" 
              disabled={!message.trim() || sending}
              className="send-btn"
            >
              <FiSend />
            </button>
          </form>

          {/* View Full Conversation Link */}
          {conversationId && (
            <div className="view-full-link">
              <button onClick={() => navigate(`/messages?conversation=${conversationId}`)}>
                View Full Conversation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
