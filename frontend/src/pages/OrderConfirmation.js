import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  FiCheck, FiPackage, FiTruck, FiMapPin, FiPhone, FiUser, 
  FiClock, FiCreditCard, FiMail, FiCalendar, FiCheckCircle,
  FiShoppingBag, FiArrowRight, FiHome
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import orderService from '../services/orderService';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [statusProgress, setStatusProgress] = useState(0);

  // Get data passed from checkout
  const orderNumber = location.state?.orderNumber;
  const paymentId = location.state?.paymentId;
  const isNewOrder = location.state?.newOrder;

  const STATUS_SEQUENCE = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(orderId);
      const orderData = response.data || response;
      setOrder(orderData);
      
      // Update status progress
      const statusIndex = STATUS_SEQUENCE.indexOf(orderData.status);
      setStatusProgress(statusIndex >= 0 ? statusIndex : 0);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Auto-refresh order status every 5 seconds in demo mode
  useEffect(() => {
    let interval;
    if (demoMode && order && order.status !== 'DELIVERED') {
      interval = setInterval(() => {
        fetchOrder();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [demoMode, order, fetchOrder]);

  // Start demo mode - simulate order progression
  const handleStartDemo = async () => {
    try {
      setDemoMode(true);
      toast.info('Demo mode started! Order status will update every 5 seconds');
      
      // Trigger backend demo progress
      try {
        await orderService.startDemoProgress(orderId);
      } catch (e) {
        console.log('Demo progress API not available, using frontend simulation');
      }
    } catch (err) {
      console.error('Error starting demo:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExpectedDelivery = () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'PENDING': { label: 'Order Placed', icon: <FiClock />, color: '#f59e0b' },
      'CONFIRMED': { label: 'Order Confirmed', icon: <FiCheckCircle />, color: '#3b82f6' },
      'PROCESSING': { label: 'Processing', icon: <FiPackage />, color: '#8b5cf6' },
      'SHIPPED': { label: 'Shipped', icon: <FiTruck />, color: '#06b6d4' },
      'DELIVERED': { label: 'Delivered', icon: <FiCheck />, color: '#10b981' },
      'CANCELLED': { label: 'Cancelled', icon: <FiCheck />, color: '#ef4444' }
    };
    return statusMap[status] || statusMap['PENDING'];
  };

  if (loading) {
    return (
      <div className="order-confirmation-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-container">
        <div className="error-state">
          <FiPackage className="error-icon" />
          <h2>Order Not Found</h2>
          <p>{error || "We couldn't find the order you're looking for."}</p>
          <Link to="/orders" className="btn-primary">View My Orders</Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="order-confirmation-container">
      {/* Success Header */}
      <div className="confirmation-header">
        <div className="success-checkmark">
          <FiCheck />
        </div>
        <h1>Thank You For Your Order!</h1>
        <p className="confirmation-subtitle">
          Your order has been placed successfully and is being processed.
        </p>
      </div>

      {/* Order Info Banner */}
      <div className="order-info-banner">
        <div className="banner-item">
          <span className="banner-label">Order Number</span>
          <span className="banner-value">{order.orderNumber || `#${orderId?.slice(0, 8).toUpperCase()}`}</span>
        </div>
        <div className="banner-item">
          <span className="banner-label">Order Date</span>
          <span className="banner-value">{formatDate(order.createdAt)}</span>
        </div>
        <div className="banner-item">
          <span className="banner-label">Total Amount</span>
          <span className="banner-value price">₹{order.totalAmount?.toFixed(2)}</span>
        </div>
        <div className="banner-item">
          <span className="banner-label">Payment ID</span>
          <span className="banner-value">{paymentId || order.latestPayment?.razorpayPaymentId || 'N/A'}</span>
        </div>
      </div>

      {/* Estimated Delivery */}
      <div className="delivery-estimate">
        <FiCalendar className="estimate-icon" />
        <div className="estimate-content">
          <span className="estimate-label">Estimated Delivery</span>
          <span className="estimate-date">{getExpectedDelivery()}</span>
        </div>
      </div>

      {/* Order Status Tracker */}
      <div className="status-tracker-section">
        <div className="section-header">
          <h2>Order Tracking</h2>
          {!demoMode && order.status !== 'DELIVERED' && (
            <button className="demo-btn" onClick={handleStartDemo}>
              <FiArrowRight /> Start Demo Tracking
            </button>
          )}
          {demoMode && order.status !== 'DELIVERED' && (
            <span className="demo-badge">
              <span className="pulse"></span> Demo Mode Active
            </span>
          )}
        </div>
        
        <div className="status-tracker">
          {STATUS_SEQUENCE.map((status, index) => {
            const info = getStatusInfo(status);
            const isActive = STATUS_SEQUENCE.indexOf(order.status) >= index;
            const isCurrent = order.status === status;
            
            return (
              <div key={status} className={`tracker-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="step-indicator" style={{ '--step-color': isActive ? info.color : '#d1d5db' }}>
                  {info.icon}
                </div>
                <div className="step-content">
                  <span className="step-label">{info.label}</span>
                  {isCurrent && <span className="current-badge">Current</span>}
                </div>
                {index < STATUS_SEQUENCE.length - 1 && (
                  <div className={`step-connector ${isActive ? 'active' : ''}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="confirmation-grid">
        {/* Order Items */}
        <div className="confirmation-card items-card">
          <div className="card-header">
            <FiShoppingBag />
            <h3>Order Items</h3>
          </div>
          <div className="items-list">
            {order.items?.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} />
                    ) : (
                      <div className="placeholder-image">🌾</div>
                    )}
                  </div>
                  <div className="item-info">
                    <h4 className="item-name">{item.productName || item.listingTitle || 'Product'}</h4>
                    <p className="item-seller">Sold by: {item.sellerName || 'AgriLink Farmer'}</p>
                    <p className="item-qty">Qty: {item.quantity} {item.unit || 'kg'}</p>
                  </div>
                  <div className="item-price">
                    <span className="unit-price">₹{item.unitPrice?.toFixed(2)}/{item.unit || 'kg'}</span>
                    <span className="total-price">₹{(item.quantity * item.unitPrice)?.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="order-item">
                <div className="item-image">
                  <div className="placeholder-image">🌾</div>
                </div>
                <div className="item-info">
                  <h4 className="item-name">{order.productName || 'Agricultural Product'}</h4>
                  <p className="item-qty">Qty: {order.quantity || 1} {order.unit || 'kg'}</p>
                </div>
                <div className="item-price">
                  <span className="total-price">₹{order.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="confirmation-card address-card">
          <div className="card-header">
            <FiMapPin />
            <h3>Delivery Address</h3>
          </div>
          <div className="address-content">
            <p className="address-name">
              <FiUser /> {order.shippingAddress?.fullName || order.buyerName || 'Customer'}
            </p>
            <p className="address-line">{order.shippingAddress?.addressLine1 || order.shippingAddress || 'Address not available'}</p>
            {order.shippingAddress?.addressLine2 && (
              <p className="address-line">{order.shippingAddress.addressLine2}</p>
            )}
            <p className="address-city">
              {order.shippingAddress?.city || order.shippingCity}, {order.shippingAddress?.state || order.shippingState} - {order.shippingAddress?.postalCode || order.shippingPostalCode}
            </p>
            <p className="address-country">{order.shippingAddress?.country || order.shippingCountry || 'India'}</p>
            <p className="address-phone">
              <FiPhone /> {order.shippingAddress?.phoneNumber || order.shippingPhone || 'Phone not available'}
            </p>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="confirmation-card payment-card">
          <div className="card-header">
            <FiCreditCard />
            <h3>Payment Summary</h3>
          </div>
          <div className="payment-content">
            <div className="payment-row">
              <span>Subtotal</span>
              <span>₹{(order.subtotal || order.totalAmount)?.toFixed(2)}</span>
            </div>
            <div className="payment-row">
              <span>Shipping</span>
              <span>{order.shippingCharges > 0 ? `₹${order.shippingCharges.toFixed(2)}` : 'FREE'}</span>
            </div>
            <div className="payment-row">
              <span>Tax (GST)</span>
              <span>₹{(order.tax || 0)?.toFixed(2)}</span>
            </div>
            <div className="payment-row total">
              <span>Total Paid</span>
              <span>₹{order.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="payment-method">
              <span className="method-label">Payment Method</span>
              <span className="method-value">
                <FiCreditCard /> {order.latestPayment?.paymentMethod || 'Razorpay'}
              </span>
            </div>
            <div className="payment-status-badge success">
              <FiCheckCircle /> Payment Successful
            </div>
          </div>
        </div>
      </div>

      {/* Email Notification */}
      <div className="email-notification">
        <FiMail className="email-icon" />
        <p>A confirmation email has been sent to your registered email address.</p>
      </div>

      {/* Action Buttons */}
      <div className="confirmation-actions">
        <Link to="/orders" className="btn-secondary">
          <FiPackage /> View My Orders
        </Link>
        <Link to="/marketplace" className="btn-primary">
          <FiShoppingBag /> Continue Shopping
        </Link>
        <Link to="/" className="btn-outline">
          <FiHome /> Go to Home
        </Link>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h3>Need Help?</h3>
        <p>If you have any questions about your order, please contact our support team.</p>
        <div className="help-links">
          <a href="/help">Help Center</a>
          <span>•</span>
          <a href="/contact">Contact Us</a>
          <span>•</span>
          <a href="/track">Track Order</a>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
