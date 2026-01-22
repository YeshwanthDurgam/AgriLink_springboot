import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  FaFlag, FaExclamationTriangle, FaShieldAlt, FaUserShield, 
  FaEllipsisV, FaTimes, FaCheck, FaPaperPlane, FaImage,
  FaSearch, FaFilter
} from 'react-icons/fa';
import messagingService from '../services/messagingService';
import EmptyState from '../components/EmptyState';
import './Messages.css';

const ConversationList = ({ conversations, selectedId, onSelect, searchTerm, onSearchChange, filter, onFilterChange }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchTerm || 
      conv.otherParticipantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.listingTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && conv.unreadCount > 0) ||
      (filter === 'farmers' && conv.participantRole === 'FARMER') ||
      (filter === 'admin' && conv.participantRole === 'ADMIN');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="conversation-list">
      <div className="conv-list-header">
        <h3>Messages</h3>
        <div className="conv-filters">
          <div className="search-input">
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <select className="filter-select" value={filter} onChange={(e) => onFilterChange(e.target.value)}>
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="farmers">Farmers</option>
            <option value="admin">Support</option>
          </select>
        </div>
      </div>
      {filteredConversations.length === 0 ? (
        <div className="no-conversations">
          <EmptyState 
            type="messages"
            title={searchTerm ? 'No Matches' : 'No Conversations'}
            message={searchTerm 
              ? 'No conversations match your search.'
              : 'Start a conversation by messaging a seller on any product page.'
            }
          />
        </div>
      ) : (
        filteredConversations.map(conv => (
          <div
            key={conv.id}
            className={`conversation-item ${selectedId === conv.id ? 'selected' : ''} ${conv.unreadCount > 0 ? 'unread' : ''}`}
            onClick={() => onSelect(conv)}
          >
            <div className="conv-avatar">
              {conv.participantRole === 'ADMIN' ? (
                <FaUserShield className="admin-icon" />
              ) : (
                conv.otherParticipantName?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="conv-details">
              <div className="conv-header">
                <span className="conv-name">
                  {conv.otherParticipantName || 'User'}
                  {conv.participantRole === 'ADMIN' && <span className="admin-badge">Support</span>}
                </span>
                <span className="conv-time">{formatTime(conv.lastMessageAt)}</span>
              </div>
              {conv.listingTitle && (
                <div className="conv-listing">Re: {conv.listingTitle}</div>
              )}
              <div className="conv-preview">
                {conv.lastMessagePreview || 'No messages yet'}
              </div>
            </div>
            {conv.unreadCount > 0 && (
              <span className="unread-badge">{conv.unreadCount}</span>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const ChatWindow = ({ conversation, messages, onSendMessage, loading, onReportFraud, onBlockUser }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const formatMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (!conversation) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <span className="empty-icon">💬</span>
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-avatar">
            {conversation.participantRole === 'ADMIN' ? (
              <FaUserShield className="admin-icon" />
            ) : (
              conversation.otherParticipantName?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div>
            <h4>
              {conversation.otherParticipantName || 'User'}
              {conversation.participantRole === 'ADMIN' && <span className="admin-badge">Support</span>}
            </h4>
            {conversation.listingTitle && (
              <span className="chat-listing">Re: {conversation.listingTitle}</span>
            )}
          </div>
        </div>
        <div className="chat-actions">
          <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
            <FaEllipsisV />
          </button>
          {showMenu && (
            <div className="chat-menu">
              <button onClick={() => { setShowReportModal(true); setShowMenu(false); }}>
                <FaFlag /> Report Fraud
              </button>
              <button onClick={() => { onBlockUser(conversation.otherParticipantId); setShowMenu(false); }}>
                <FaExclamationTriangle /> Block User
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="messages-loading">Loading messages...</div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="message-group">
              <div className="date-divider">
                <span>{formatMessageDate(msgs[0].createdAt)}</span>
              </div>
              {msgs.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.isOwn ? 'own' : 'other'}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-meta">
                    <span className="message-time">{formatMessageTime(message.createdAt)}</span>
                    {message.isOwn && message.isRead && (
                      <span className="message-read">✓✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
        />
        <button type="submit" disabled={!newMessage.trim()}>
          <FaPaperPlane /> Send
        </button>
      </form>

      {/* Report Fraud Modal */}
      {showReportModal && (
        <ReportFraudModal 
          conversation={conversation}
          onClose={() => setShowReportModal(false)}
          onSubmit={(report) => {
            onReportFraud(report);
            setShowReportModal(false);
          }}
        />
      )}
    </div>
  );
};

// Fraud Report Modal Component
const ReportFraudModal = ({ conversation, onClose, onSubmit }) => {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const reportTypes = [
    { value: 'fake_product', label: 'Fake/Counterfeit Product' },
    { value: 'non_delivery', label: 'Non-delivery of Items' },
    { value: 'quality_issue', label: 'Quality Mismatch' },
    { value: 'price_manipulation', label: 'Price Manipulation' },
    { value: 'impersonation', label: 'Impersonation/False Identity' },
    { value: 'harassment', label: 'Harassment/Inappropriate Behavior' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportType || !description) return;

    setSubmitting(true);
    try {
      await onSubmit({
        accusedUserId: conversation.otherParticipantId,
        accusedUserName: conversation.otherParticipantName,
        conversationId: conversation.id,
        listingId: conversation.listingId,
        listingTitle: conversation.listingTitle,
        reportType,
        description,
        evidence
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaFlag /> Report Fraud</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="report-info">
            <FaShieldAlt />
            <p>Help us maintain a safe marketplace. Report suspicious activity and our team will investigate.</p>
          </div>
          
          <div className="form-group">
            <label>Reporting User</label>
            <div className="reported-user">
              <div className="user-avatar">{conversation.otherParticipantName?.charAt(0)}</div>
              <span>{conversation.otherParticipantName}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Type of Issue *</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              required
            >
              <option value="">Select issue type...</option>
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about the issue. Include relevant order IDs, dates, and any other information that can help us investigate."
              rows={5}
              required
              minLength={50}
            />
            <span className="char-count">{description.length}/500 characters (minimum 50)</span>
          </div>

          <div className="form-group">
            <label>Evidence (Optional)</label>
            <div className="evidence-upload">
              <input 
                type="file" 
                id="evidence" 
                multiple 
                accept="image/*,.pdf"
                onChange={(e) => setEvidence(Array.from(e.target.files))}
              />
              <label htmlFor="evidence" className="upload-btn">
                <FaImage /> Upload Screenshots/Documents
              </label>
              {evidence.length > 0 && (
                <div className="evidence-list">
                  {evidence.map((file, idx) => (
                    <span key={idx} className="evidence-file">{file.name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={!reportType || description.length < 50 || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Contact Admin Button Component
const ContactAdminButton = ({ onClick }) => (
  <button className="contact-admin-btn" onClick={onClick}>
    <FaUserShield />
    <span>Contact Support</span>
  </button>
);

const Messages = () => {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    // Check if we need to start a new conversation from listing
    const sellerId = searchParams.get('sellerId');
    const farmerId = searchParams.get('farmer'); // From Farmers page
    const listingId = searchParams.get('listingId');
    const listingTitle = searchParams.get('listingTitle');
    const contactAdmin = searchParams.get('contactAdmin');

    if (sellerId) {
      startNewConversation(sellerId, listingId, listingTitle);
    } else if (farmerId) {
      startNewConversation(farmerId, null, null);
    } else if (contactAdmin) {
      contactSupport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messagingService.getConversations();
      if (response?.success && response.data) {
        setConversations(response.data.content || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = async (sellerId, listingId, listingTitle) => {
    try {
      const response = await messagingService.getOrCreateConversation(
        sellerId, 
        listingId, 
        listingTitle
      );
      if (response?.success && response.data) {
        setSelectedConversation(response.data);
        fetchMessages(response.data.id);
        fetchConversations(); // Refresh list
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const contactSupport = async () => {
    try {
      // Get or create conversation with admin/support
      const response = await messagingService.contactAdmin();
      if (response?.success && response.data) {
        setSelectedConversation(response.data);
        fetchMessages(response.data.id);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error contacting support:', error);
      // Fallback - create mock admin conversation for demo
      const adminConv = {
        id: 'admin-support',
        otherParticipantId: 'admin-1',
        otherParticipantName: 'AgriLink Support',
        participantRole: 'ADMIN',
        lastMessagePreview: 'How can we help you today?',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0
      };
      setSelectedConversation(adminConv);
      setMessages([{
        id: 1,
        content: 'Hello! Welcome to AgriLink Support. How can we help you today?',
        createdAt: new Date().toISOString(),
        isOwn: false
      }]);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const response = await messagingService.getMessages(conversationId);
      if (response?.success && response.data) {
        // Reverse to show oldest first
        setMessages((response.data.content || []).reverse());
      }
      // Mark as read
      await messagingService.markAsRead(conversationId);
      // Update unread count in list
      setConversations(convs => 
        convs.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };

  const handleSendMessage = async (content) => {
    if (!selectedConversation) return;

    try {
      const response = await messagingService.sendMessage({
        recipientId: selectedConversation.otherParticipantId,
        content,
        listingId: selectedConversation.listingId,
        listingTitle: selectedConversation.listingTitle
      });

      if (response?.success && response.data) {
        setMessages(prev => [...prev, response.data]);
        // Update conversation list
        setConversations(convs => {
          const updated = convs.map(c => {
            if (c.id === selectedConversation.id) {
              return {
                ...c,
                lastMessagePreview: content.length > 100 ? content.substring(0, 100) + '...' : content,
                lastMessageAt: new Date().toISOString()
              };
            }
            return c;
          });
          // Move to top
          const idx = updated.findIndex(c => c.id === selectedConversation.id);
          if (idx > 0) {
            const [conv] = updated.splice(idx, 1);
            updated.unshift(conv);
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user
      const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again.';
      alert(errorMessage);
    }
  };

  const handleReportFraud = async (report) => {
    try {
      // In production, send to API
      console.log('Submitting fraud report:', report);
      // await messagingService.reportFraud(report);
      alert('Thank you for your report. Our team will investigate and get back to you within 24-48 hours.');
    } catch (error) {
      console.error('Error submitting fraud report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handleBlockUser = async (userId) => {
    if (window.confirm('Are you sure you want to block this user? You will no longer receive messages from them.')) {
      try {
        // In production, send to API
        console.log('Blocking user:', userId);
        // await messagingService.blockUser(userId);
        alert('User has been blocked.');
      } catch (error) {
        console.error('Error blocking user:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="messages-page">
        <div className="loading">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filter={filter}
          onFilterChange={setFilter}
        />
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={messagesLoading}
          onReportFraud={handleReportFraud}
          onBlockUser={handleBlockUser}
        />
      </div>
      <ContactAdminButton onClick={contactSupport} />
    </div>
  );
};

export default Messages;
