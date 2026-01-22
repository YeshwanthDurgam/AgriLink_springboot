import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiPackage, FiClock, FiCheck, FiX, FiTruck, FiRefreshCw,
  FiDollarSign, FiCalendar, FiEye, FiCheckCircle, FiArrowLeft
} from 'react-icons/fi';
import orderService from '../services/orderService';
import EmptyState from '../components/EmptyState';
import './Orders.css';

const FarmerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orderService.getSellerOrders(page, 10);
      
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
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
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

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-header">
        <div className="header-left">
          <Link to="/farmer/dashboard" className="back-btn">
            <FiArrowLeft />
          </Link>
          <FiDollarSign className="header-icon" />
          <div>
            <h1>My Sales</h1>
            <p className="header-subtitle">Manage orders from your customers</p>
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

      {/* Content */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your sales...</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState type="seller-orders" />
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
                        {order.items?.[0]?.productName || order.items?.[0]?.title || 'Order Items'}
                      </h3>
                      <p className="product-quantity">
                        {order.items?.length || 1} item(s)
                      </p>
                      <p className="buyer-info">
                        <strong>Buyer:</strong> {order.buyerName || order.buyerEmail || 'Customer'}
                      </p>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="order-actions">
                    <div className="order-total">
                      <span className="total-label">Total</span>
                      <span className="total-value">{formatPrice(order.totalAmount)}</span>
                    </div>
                    
                    <div className="action-buttons">
                      <Link 
                        to={`/orders/${order.id}`}
                        className="action-btn view"
                      >
                        <FiEye /> View
                      </Link>
                      
                      {order.status === 'PENDING' && (
                        <button 
                          className="action-btn confirm"
                          onClick={() => handleConfirmOrder(order.id)}
                        >
                          <FiCheckCircle /> Confirm
                        </button>
                      )}
                      
                      {order.status === 'CONFIRMED' && (
                        <button 
                          className="action-btn ship"
                          onClick={() => handleShipOrder(order.id)}
                        >
                          <FiTruck /> Ship
                        </button>
                      )}
                      
                      {order.status === 'SHIPPED' && (
                        <button 
                          className="action-btn deliver"
                          onClick={() => handleDeliverOrder(order.id)}
                        >
                          <FiCheck /> Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="page-info">
                Page {page + 1} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="pagination-btn"
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

export default FarmerOrders;
