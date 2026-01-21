import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiPackage, FiClock, FiCheck, FiX, FiTruck, FiRefreshCw,
  FiShoppingBag, FiDollarSign, FiCalendar, FiMapPin, FiChevronRight,
  FiEye, FiCheckCircle
} from 'react-icons/fi';
import orderService from '../services/orderService';
import EmptyState from '../components/EmptyState';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('buyer');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'buyer') {
        response = await orderService.getMyOrders(page, 10);
      } else {
        response = await orderService.getSellerOrders(page, 10);
      }
      
      // Handle paginated response with data wrapper
      const data = response.data || response;
      if (data.content) {
        setOrders(data.content);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setOrders(data);
        setTotalPages(1);
      } else {
        setOrders([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await orderService.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await orderService.confirmOrder(orderId);
      toast.success('Order confirmed successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to confirm order');
    }
  };

  const handleShipOrder = async (orderId) => {
    try {
      await orderService.shipOrder(orderId);
      toast.success('Order marked as shipped');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleDeliverOrder = async (orderId) => {
    try {
      await orderService.deliverOrder(orderId);
      toast.success('Order marked as delivered');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to mark order as delivered');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PENDING': <FiClock />,
      'CONFIRMED': <FiCheckCircle />,
      'PROCESSING': <FiPackage />,
      'SHIPPED': <FiTruck />,
      'IN_TRANSIT': <FiTruck />,
      'DELIVERED': <FiCheck />,
      'CANCELLED': <FiX />
    };
    return icons[status?.toUpperCase()] || <FiPackage />;
  };

  const getStatusClass = (status) => {
    const classes = {
      'PENDING': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'PROCESSING': 'status-processing',
      'SHIPPED': 'status-shipped',
      'IN_TRANSIT': 'status-shipped',
      'DELIVERED': 'status-delivered',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status?.toUpperCase()] || 'status-pending';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'PENDING': 'Pending',
      'CONFIRMED': 'Confirmed',
      'PROCESSING': 'Processing',
      'SHIPPED': 'Shipped',
      'IN_TRANSIT': 'In Transit',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled'
    };
    return labels[status?.toUpperCase()] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price || 0);
  };

  const getDeliveryEstimate = (status, createdAt) => {
    if (status === 'DELIVERED') return 'Delivered';
    if (status === 'CANCELLED') return 'Cancelled';
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 5);
    return `Est. ${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-header">
        <div className="header-left">
          <FiPackage className="header-icon" />
          <div>
            <h1>My Orders</h1>
            <p className="header-subtitle">Track and manage your orders</p>
          </div>
        </div>
        <button 
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`} 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="orders-tabs">
        <button
          className={`tab-btn ${activeTab === 'buyer' ? 'active' : ''}`}
          onClick={() => { setActiveTab('buyer'); setPage(0); }}
        >
          <FiShoppingBag /> My Purchases
        </button>
        <button
          className={`tab-btn ${activeTab === 'seller' ? 'active' : ''}`}
          onClick={() => { setActiveTab('seller'); setPage(0); }}
        >
          <FiDollarSign /> My Sales
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState 
          type={activeTab === 'buyer' ? 'orders' : 'seller-orders'}
        />
      ) : (
        <>
          {/* Orders List */}
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                {/* Card Header */}
                <div className="card-header">
                  <div className="order-info">
                    <div className="order-number">
                      <span className="label">Order</span>
                      <span className="value">#{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="order-date">
                      <FiCalendar />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className={`order-status ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span>{getStatusLabel(order.status)}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  {/* Product Info */}
                  <div className="product-section">
                    <div className="product-image">
                      {order.items?.[0]?.imageUrl ? (
                        <img src={order.items[0].imageUrl} alt="Product" />
                      ) : (
                        <div className="placeholder-image">🌾</div>
                      )}
                    </div>
                    <div className="product-details">
                      <h3 className="product-name">
                        {order.items?.[0]?.productName || order.listing?.title || order.productName || 'Agricultural Product'}
                      </h3>
                      <p className="product-quantity">
                        Qty: {order.items?.[0]?.quantity || order.quantity || 1} {order.items?.[0]?.unit || order.unit || 'kg'}
                      </p>
                      {order.items?.length > 1 && (
                        <p className="more-items">+{order.items.length - 1} more items</p>
                      )}
                    </div>
                    <div className="price-section">
                      <span className="total-label">Total</span>
                      <span className="total-amount">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="delivery-section">
                    <div className="delivery-estimate">
                      <FiTruck />
                      <span>{getDeliveryEstimate(order.status, order.createdAt)}</span>
                    </div>
                    {order.shippingAddress && (
                      <div className="delivery-address">
                        <FiMapPin />
                        <span>
                          {typeof order.shippingAddress === 'string' 
                            ? order.shippingAddress 
                            : `${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="card-footer">
                  <Link to={`/order-confirmation/${order.id}`} className="view-details-btn">
                    <FiEye /> View Details
                    <FiChevronRight />
                  </Link>

                  <div className="action-buttons">
                    {/* Buyer Actions */}
                    {activeTab === 'buyer' && order.status === 'PENDING' && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <FiX /> Cancel
                      </button>
                    )}

                    {/* Seller Actions */}
                    {activeTab === 'seller' && (
                      <>
                        {order.status === 'PENDING' && (
                          <button
                            className="confirm-btn"
                            onClick={() => handleConfirmOrder(order.id)}
                          >
                            <FiCheck /> Confirm
                          </button>
                        )}
                        {(order.status === 'CONFIRMED' || order.status === 'PROCESSING') && (
                          <button
                            className="ship-btn"
                            onClick={() => handleShipOrder(order.id)}
                          >
                            <FiTruck /> Ship
                          </button>
                        )}
                        {order.status === 'SHIPPED' && (
                          <button
                            className="deliver-btn"
                            onClick={() => handleDeliverOrder(order.id)}
                          >
                            <FiCheck /> Mark Delivered
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {order.status !== 'CANCELLED' && (
                  <div className="progress-bar-container">
                    <div 
                      className={`progress-bar ${getStatusClass(order.status)}`}
                      style={{
                        width: order.status === 'PENDING' ? '20%' :
                               order.status === 'CONFIRMED' ? '40%' :
                               order.status === 'PROCESSING' ? '60%' :
                               order.status === 'SHIPPED' ? '80%' :
                               order.status === 'DELIVERED' ? '100%' : '10%'
                      }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <div className="page-info">
                Page {page + 1} of {totalPages}
              </div>
              <button
                className="page-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Orders;
