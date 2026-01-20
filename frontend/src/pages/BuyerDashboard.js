import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiPackage, FiHeart, FiUsers, FiMessageSquare, FiUser, FiShoppingCart,
  FiTrendingUp, FiClock, FiMapPin, FiAlertCircle, FiChevronRight, 
  FiStar, FiDollarSign, FiSettings
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './BuyerDashboard.css';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    wishlistItems: 0,
    followingFarmers: 0,
    walletBalance: 0,
    totalSpent: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [followingFarmers, setFollowingFarmers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const [ordersRes, wishlistRes, farmersRes] = await Promise.all([
        api.get('/order-service/api/v1/orders').catch(() => ({ data: { data: { content: [] } } })),
        api.get('/marketplace-service/api/v1/wishlist').catch(() => ({ data: { data: [] } })),
        api.get('/user-service/api/v1/farmers/followed').catch(() => ({ data: { data: [] } }))
      ]);

      const orders = ordersRes.data?.data?.content || [];
      const wishlist = wishlistRes.data?.data || [];
      const farmers = farmersRes.data?.data || [];

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length,
        wishlistItems: wishlist.length,
        followingFarmers: farmers.length,
        walletBalance: 2450,
        totalSpent: 15680
      });

      setRecentOrders(orders.slice(0, 4));
      setFollowingFarmers(farmers.slice(0, 4));
      setRecommendations(getMockRecommendations());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Use empty data on error
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        wishlistItems: 0,
        followingFarmers: 0,
        walletBalance: 0,
        totalSpent: 0
      });
      setRecentOrders([]);
      setFollowingFarmers([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getMockOrders = () => [
    { id: '1', orderNumber: 'ORD-2024-001', status: 'DELIVERED', total: 456, itemCount: 3, date: '2024-01-15' },
    { id: '2', orderNumber: 'ORD-2024-002', status: 'PROCESSING', total: 289, itemCount: 2, date: '2024-01-18' },
    { id: '3', orderNumber: 'ORD-2024-003', status: 'SHIPPED', total: 678, itemCount: 5, date: '2024-01-20' },
    { id: '4', orderNumber: 'ORD-2024-004', status: 'PENDING', total: 199, itemCount: 1, date: '2024-01-22' }
  ];



  const getMockRecommendations = () => [
    { id: '1', title: 'Organic Tomatoes', price: 49, originalPrice: 80, image: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=150', farmer: 'Green Valley' },
    { id: '2', title: 'Fresh Spinach', price: 35, originalPrice: 60, image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=150', farmer: 'Sunrise Organic' },
    { id: '3', title: 'Premium Rice', price: 99, originalPrice: 150, image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=150', farmer: 'Punjab Grains' },
    { id: '4', title: 'Farm Eggs', price: 89, originalPrice: 120, image: 'https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?w=150', farmer: 'Happy Hens' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#f59e0b',
      PROCESSING: '#3b82f6',
      SHIPPED: '#8b5cf6',
      DELIVERED: '#22c55e',
      CANCELLED: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const menuItems = [
    { icon: FiPackage, label: 'My Orders', path: '/orders', count: stats.totalOrders },
    { icon: FiHeart, label: 'Wishlist', path: '/wishlist', count: stats.wishlistItems },
    { icon: FiUsers, label: 'Following Farmers', path: '/farmers?following=true', count: stats.followingFarmers },
    { icon: FiMessageSquare, label: 'Messages', path: '/messages', badge: true },
    { icon: FiUser, label: 'My Profile', path: '/profile' },
    { icon: FiAlertCircle, label: 'Report Issue', path: '/report' },
    { icon: FiSettings, label: 'Settings', path: '/settings' }
  ];

  return (
    <div className="buyer-dashboard">
      {/* Welcome Section */}
      <section className="dashboard-welcome">
        <div className="welcome-content">
          <div className="welcome-text">
            <h1>Welcome back, {user?.email?.split('@')[0] || 'User'}!</h1>
            <p>Here's what's happening with your orders today.</p>
          </div>
          <Link to="/marketplace" className="shop-now-btn">
            <FiShoppingCart /> Shop Now
          </Link>
        </div>
      </section>

      <div className="dashboard-layout">
        {/* Sidebar Menu */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-menu">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path} className="menu-item">
                <item.icon />
                <span>{item.label}</span>
                {item.count !== undefined && <span className="menu-count">{item.count}</span>}
                {item.badge && <span className="menu-badge"></span>}
              </Link>
            ))}
          </div>
          
          {/* Wallet Card */}
          <div className="wallet-card">
            <div className="wallet-header">
              <span className="wallet-label">Wallet Balance</span>
              <FiDollarSign />
            </div>
            <span className="wallet-amount">₹{stats.walletBalance.toLocaleString()}</span>
            <button className="add-money-btn">Add Money</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon orders">
                <FiPackage />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalOrders}</span>
                <span className="stat-label">Total Orders</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon pending">
                <FiClock />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.pendingOrders}</span>
                <span className="stat-label">Pending Orders</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon wishlist">
                <FiHeart />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.wishlistItems}</span>
                <span className="stat-label">Wishlist Items</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon spent">
                <FiTrendingUp />
              </div>
              <div className="stat-info">
                <span className="stat-value">₹{stats.totalSpent.toLocaleString()}</span>
                <span className="stat-label">Total Spent</span>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Recent Orders</h2>
              <Link to="/orders" className="view-all">View All <FiChevronRight /></Link>
            </div>
            
            <div className="orders-list">
              {recentOrders.map((order) => (
                <div key={order.id} className="order-item" onClick={() => navigate(`/orders/${order.id}`)}>
                  <div className="order-icon">
                    <FiPackage />
                  </div>
                  <div className="order-info">
                    <span className="order-number">{order.orderNumber}</span>
                    <span className="order-meta">{order.itemCount} items • {order.date}</span>
                  </div>
                  <div className="order-status" style={{ backgroundColor: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}>
                    {order.status}
                  </div>
                  <div className="order-total">₹{order.total}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Following Farmers */}
          {followingFarmers.length > 0 && (
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Following Farmers</h2>
              <Link to="/farmers?following=true" className="view-all">View All <FiChevronRight /></Link>
            </div>
            
            <div className="farmers-grid">
              {followingFarmers.map((farmer) => (
                <div key={farmer.farmerId || farmer.id} className="farmer-card" onClick={() => navigate(`/farmers/${farmer.farmerId || farmer.id}`)}>
                  <img src={farmer.profilePictureUrl || farmer.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'} alt={farmer.farmerName || farmer.name} className="farmer-avatar" />
                  <div className="farmer-info">
                    <span className="farmer-name">{farmer.farmerName || farmer.name || 'Farmer'}</span>
                    <span className="farm-name">{farmer.farmName || farmer.location || ''}</span>
                  </div>
                  <div className="farmer-stats">
                    <span className="farmer-rating"><FiStar /> {farmer.rating > 0 ? farmer.rating.toFixed(1) : 'Not rated'}</span>
                    <span className="farmer-products">{farmer.productCount || farmer.products || 0} products</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}

          {/* Recommendations */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Recommended for You</h2>
              <Link to="/marketplace" className="view-all">View All <FiChevronRight /></Link>
            </div>
            
            <div className="recommendations-grid">
              {recommendations.map((product) => (
                <div key={product.id} className="recommendation-card" onClick={() => navigate(`/marketplace/${product.id}`)}>
                  <img src={product.image} alt={product.title} />
                  <div className="recommendation-info">
                    <span className="product-title">{product.title}</span>
                    <span className="product-farmer">{product.farmer}</span>
                    <div className="product-price">
                      <span className="current-price">₹{product.price}</span>
                      <span className="original-price">₹{product.originalPrice}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default BuyerDashboard;
