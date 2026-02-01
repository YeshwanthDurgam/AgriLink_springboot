import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
// Tree-shakeable individual icon imports
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiAlertCircle } from '@react-icons/all-files/fi/FiAlertCircle';
import { FiInfo } from '@react-icons/all-files/fi/FiInfo';
import { FiPackage } from '@react-icons/all-files/fi/FiPackage';
import { FiTruck } from '@react-icons/all-files/fi/FiTruck';
import { FiCheckCircle } from '@react-icons/all-files/fi/FiCheckCircle';
import { FiShoppingBag } from '@react-icons/all-files/fi/FiShoppingBag';
import { FiBell } from '@react-icons/all-files/fi/FiBell';
import './ToastNotification.css';

// Context for toast notifications
const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 5000);
    
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <FiCheckCircle />;
      case 'error': return <FiX />;
      case 'warning': return <FiAlertCircle />;
      case 'order-placed': return <FiShoppingBag />;
      case 'order-confirmed': return <FiCheck />;
      case 'order-shipped': return <FiTruck />;
      case 'order-delivered': return <FiPackage />;
      case 'notification': return <FiBell />;
      default: return <FiInfo />;
    }
  };

  const getTypeClass = () => {
    if (toast.type?.startsWith('order-')) return 'order';
    return toast.type || 'info';
  };

  return (
    <div className={`toast toast-${getTypeClass()} ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
        {toast.action && (
          <button className="toast-action" onClick={toast.action.onClick}>
            {toast.action.label}
          </button>
        )}
      </div>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>
        <FiX />
      </button>
      {toast.progress !== false && (
        <div className="toast-progress" style={{ animationDuration: `${toast.duration || 5000}ms` }} />
      )}
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      duration: 5000,
      ...options
    };
    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => 
      t.id === id ? { ...t, exiting: true } : t
    ));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addToast({ type: 'success', message, ...options });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ type: 'error', message, duration: 7000, ...options });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ type: 'warning', message, ...options });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ type: 'info', message, ...options });
  }, [addToast]);

  // Order-specific notifications
  const orderPlaced = useCallback((orderNumber, options = {}) => {
    return addToast({
      type: 'order-placed',
      title: 'Order Placed!',
      message: `Order ${orderNumber} has been placed successfully.`,
      duration: 6000,
      ...options
    });
  }, [addToast]);

  const orderConfirmed = useCallback((orderNumber, options = {}) => {
    return addToast({
      type: 'order-confirmed',
      title: 'Order Confirmed',
      message: `Order ${orderNumber} has been confirmed by the seller.`,
      duration: 6000,
      ...options
    });
  }, [addToast]);

  const orderShipped = useCallback((orderNumber, options = {}) => {
    return addToast({
      type: 'order-shipped',
      title: 'Order Shipped!',
      message: `Order ${orderNumber} is on its way!`,
      duration: 6000,
      ...options
    });
  }, [addToast]);

  const orderDelivered = useCallback((orderNumber, options = {}) => {
    return addToast({
      type: 'order-delivered',
      title: 'Order Delivered',
      message: `Order ${orderNumber} has been delivered.`,
      duration: 6000,
      ...options
    });
  }, [addToast]);

  const value = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    orderPlaced,
    orderConfirmed,
    orderShipped,
    orderDelivered
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
