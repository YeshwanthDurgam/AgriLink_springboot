import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { FiPackage, FiTruck, FiCheck, FiMapPin, FiPhone, FiUser, FiClock, FiCreditCard } from 'react-icons/fi';
import orderService from '../services/orderService';
import './OrderDetail.css';

const OrderDetail = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Check if this is a new order confirmation
  const isNewOrder = location.state?.newOrder;
  const paymentId = location.state?.paymentId;

  // Check if the orderId is an order number (e.g., ORD-xxx) or a UUID
  const isOrderNumber = (id) => {
    return id && (id.startsWith('ORD-') || id.startsWith('ORD_') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
  };

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      // If it looks like an order number, use getOrderByNumber, otherwise use getOrderById
      if (isOrderNumber(orderId)) {
        response = await orderService.getOrderByNumber(orderId);
      } else {
        response = await orderService.getOrderById(orderId);
      }
      // Handle wrapped API response (response.data) or direct data
      const orderData = response.data || response;
      setOrder(orderData);
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

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <FiClock />;
      case 'CONFIRMED':
        return <FiCheck />;
      case 'PROCESSING':
        return <FiPackage />;
      case 'SHIPPED':
        return <FiTruck />;
      case 'DELIVERED':
        return <FiCheck />;
      default:
        return <FiClock />;
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'PROCESSING':
        return 'status-processing';
      case 'SHIPPED':
        return 'status-shipped';
      case 'DELIVERED':
        return 'status-delivered';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-detail-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-container">
        <div className="error-state">
          <h2>Order Not Found</h2>
          <p>The order you're looking for doesn't exist.</p>
          <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      {/* Success Banner for New Orders */}
      {isNewOrder && (
        <div className="success-banner">
          <div className="success-icon">
            <FiCheck />
          </div>
          <div className="success-content">
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for your purchase. Your order has been confirmed.</p>
            {paymentId && <p className="payment-id">Payment ID: {paymentId}</p>}
          </div>
        </div>
      )}

      {/* Order Header */}
      <div className="order-header">
        <div className="order-header-info">
          <h1>Order #{order.orderNumber || order.id}</h1>
          <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className={`order-status ${getStatusClass(order.status)}`}>
          {getStatusIcon(order.status)}
          <span>{order.status || 'PENDING'}</span>
        </div>
      </div>

      <div className="order-detail-content">
        {/* Order Items */}
        <section className="order-section">
          <h2><FiPackage /> Order Items</h2>
          <div className="order-items">
            {order.items?.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} />
                  ) : (
                    <div className="placeholder-image">🌾</div>
                  )}
                </div>
                <div className="item-details">
                  <h3 className="item-name">{item.productName || item.listingTitle}</h3>
                  <p className="item-seller">Seller: {item.sellerName || 'AgriLink Farmer'}</p>
                  <p className="item-qty">Quantity: {item.quantity} {item.unit || 'kg'}</p>
                </div>
                <div className="item-pricing">
                  <span className="item-unit-price">₹{item.unitPrice?.toFixed(2)} per {item.unit || 'kg'}</span>
                  <span className="item-total">₹{(item.quantity * item.unitPrice)?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="order-details-grid">
          {/* Delivery Address */}
          <section className="order-section">
            <h2><FiMapPin /> Delivery Address</h2>
            <div className="address-box">
              <p className="address-name">
                <FiUser /> {order.shippingAddress?.fullName || order.buyerName || 'Customer'}
              </p>
              <p>{order.shippingAddress?.addressLine1 || order.shippingAddress}</p>
              {order.shippingAddress?.addressLine2 && (
                <p>{order.shippingAddress?.addressLine2}</p>
              )}
              <p>
                {order.shippingAddress?.city || order.shippingCity}, {order.shippingAddress?.state || order.shippingState} {order.shippingAddress?.postalCode || order.shippingPostalCode}
              </p>
              <p>{order.shippingAddress?.country || order.shippingCountry}</p>
              <p className="address-phone">
                <FiPhone /> {order.shippingAddress?.phoneNumber || order.shippingPhone}
              </p>
            </div>
          </section>

          {/* Payment Info */}
          <section className="order-section">
            <h2><FiCreditCard /> Payment Details</h2>
            <div className="payment-box">
              <div className="payment-row">
                <span>Payment Method</span>
                <span>{order.latestPayment?.paymentMethod || order.payment?.paymentMethod || 'Razorpay'}</span>
              </div>
              <div className="payment-row">
                <span>Payment Status</span>
                <span className={`payment-status ${(order.latestPayment?.paymentStatus || order.payment?.status || 'completed').toLowerCase()}`}>
                  {order.latestPayment?.paymentStatus || order.payment?.status || 'COMPLETED'}
                </span>
              </div>
              {(order.latestPayment?.razorpayPaymentId || order.payment?.razorpayPaymentId) && (
                <div className="payment-row">
                  <span>Transaction ID</span>
                  <span className="transaction-id">{order.latestPayment?.razorpayPaymentId || order.payment?.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <section className="order-section order-summary">
          <h2>Order Summary</h2>
          <div className="summary-rows">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{order.subtotal?.toFixed(2) || order.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{order.shippingCharges > 0 ? `₹${order.shippingCharges.toFixed(2)}` : 'FREE'}</span>
            </div>
            <div className="summary-row">
              <span>Tax (GST)</span>
              <span>₹{order.tax?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Order Notes */}
        {order.notes && (
          <section className="order-section">
            <h2>📝 Order Notes</h2>
            <p className="order-notes">{order.notes}</p>
          </section>
        )}

        {/* Order Timeline */}
        <section className="order-section">
          <h2><FiClock /> Order Timeline</h2>
          <div className="order-timeline">
            <div className={`timeline-step ${order.status ? 'completed' : ''}`}>
              <div className="timeline-icon"><FiCheck /></div>
              <div className="timeline-content">
                <h4>Order Placed</h4>
                <p>{formatDate(order.createdAt)}</p>
              </div>
            </div>
            <div className={`timeline-step ${['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'completed' : ''}`}>
              <div className="timeline-icon"><FiCheck /></div>
              <div className="timeline-content">
                <h4>Order Confirmed</h4>
                <p>{['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'Payment verified' : 'Pending'}</p>
              </div>
            </div>
            <div className={`timeline-step ${['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'completed' : ''}`}>
              <div className="timeline-icon"><FiPackage /></div>
              <div className="timeline-content">
                <h4>Processing</h4>
                <p>{['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'Order is being prepared' : 'Pending'}</p>
              </div>
            </div>
            <div className={`timeline-step ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'completed' : ''}`}>
              <div className="timeline-icon"><FiTruck /></div>
              <div className="timeline-content">
                <h4>Shipped</h4>
                <p>{['SHIPPED', 'DELIVERED'].includes(order.status) ? 'On the way' : 'Pending'}</p>
              </div>
            </div>
            <div className={`timeline-step ${order.status === 'DELIVERED' ? 'completed' : ''}`}>
              <div className="timeline-icon"><FiCheck /></div>
              <div className="timeline-content">
                <h4>Delivered</h4>
                <p>{order.status === 'DELIVERED' ? formatDate(order.deliveredAt) : 'Pending'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="order-actions">
        <Link to="/orders" className="btn btn-outline">
          View All Orders
        </Link>
        <Link to="/marketplace" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderDetail;
