import React, { useState, useEffect, useCallback } from 'react';
// Tree-shakeable individual icon imports
import { FiBell } from '@react-icons/all-files/fi/FiBell';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiCheckCircle } from '@react-icons/all-files/fi/FiCheckCircle';
import { FiTrash2 } from '@react-icons/all-files/fi/FiTrash2';
import { FiRefreshCw } from '@react-icons/all-files/fi/FiRefreshCw';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiAlertCircle } from '@react-icons/all-files/fi/FiAlertCircle';
import { FiInfo } from '@react-icons/all-files/fi/FiInfo';
import { FiPackage } from '@react-icons/all-files/fi/FiPackage';
import { FiMessageSquare } from '@react-icons/all-files/fi/FiMessageSquare';
import notificationService from '../services/notificationService';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (pageNum = 0) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(pageNum, 20);
      const data = response.data?.data || response.data;
      
      if (pageNum === 0) {
        setNotifications(data.content || []);
      } else {
        setNotifications(prev => [...prev, ...(data.content || [])]);
      }
      setHasMore(!data.last);
      setError('');
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(0);
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER': return <FiPackage className="notif-icon order" />;
      case 'ALERT': return <FiAlertCircle className="notif-icon alert" />;
      case 'MESSAGE': return <FiMessageSquare className="notif-icon message" />;
      default: return <FiInfo className="notif-icon info" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={e => e.stopPropagation()}>
        <div className="notification-header">
          <div className="header-title">
            <FiBell />
            <h3>Notifications</h3>
          </div>
          <div className="header-actions">
            <button 
              className="action-btn" 
              onClick={() => fetchNotifications(0)}
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
            <button 
              className="action-btn" 
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
            >
              <FiCheckCircle />
            </button>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>

        <div className="notification-list">
          {loading && notifications.length === 0 ? (
            <div className="notification-loading">
              <div className="loading-spinner"></div>
              <span>Loading notifications...</span>
            </div>
          ) : error ? (
            <div className="notification-error">
              <FiAlertCircle />
              <span>{error}</span>
              <button onClick={() => fetchNotifications(0)}>Retry</button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <FiBell className="empty-icon" />
              <span>No notifications yet</span>
            </div>
          ) : (
            <>
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-content">
                    {getNotificationIcon(notification.notificationType)}
                    <div className="notification-text">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <button 
                        className="mark-read-btn"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <button 
                  className="load-more-btn"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
