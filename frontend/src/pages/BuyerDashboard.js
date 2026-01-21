import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiPackage, FiHeart, FiUsers, FiMessageSquare, FiUser, FiShoppingCart,
  FiTrendingUp, FiClock, FiMapPin, FiAlertCircle, FiChevronRight, 
  FiStar, FiDollarSign, FiSettings
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { orderApi, marketplaceApi, userApi } from '../services/api';
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
      
      // Fetch dashboard stats using proper API instances
      const [ordersRes, wishlistRes, farmersRes, recommendationsRes] = await Promise.all([
        orderApi.get('/orders/my/purchases').catch(() => ({ data: { data: { content: [] } } })),
        marketplaceApi.get('/wishlist').catch(() => ({ data: { data: [] } })),
        userApi.get('/farmers/followed').catch(() => ({ data: { data: [] } })),
        marketplaceApi.get('/listings/top?limit=4').catch(() => ({ data: { data: [] } }))
      ]);

      const orders = ordersRes.data?.data?.content || ordersRes.data?.content || [];
      const wishlist = wishlistRes.data?.data || wishlistRes.data || [];
      const farmers = farmersRes.data?.data || farmersRes.data || [];
      const topListings = recommendationsRes.data?.data || recommendationsRes.data || [];

      // Calculate total spent from orders
      const totalSpent = orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length,
        wishlistItems: Array.isArray(wishlist) ? wishlist.length : 0,
        followingFarmers: Array.isArray(farmers) ? farmers.length : 0,
        walletBalance: 0, // Would need wallet service
        totalSpent: totalSpent
      });

      setRecentOrders(orders.slice(0, 4));
      setFollowingFarmers(Array.isArray(farmers) ? farmers.slice(0, 4) : []);
      
      // Format listings as recommendations
      const formattedRecommendations = topListings.map(listing => ({
        id: listing.id,
        title: listing.title,
        price: parseFloat(listing.price) || 0,
        originalPrice: parseFloat(listing.originalPrice) || parseFloat(listing.price) * 1.2,
        image: listing.imageUrl || listing.images?.[0] || 'https://via.placeholder.com/150',
        farmer: listing.sellerName || listing.farmerName || 'Local Farmer'
      }));
      setRecommendations(formattedRecommendations);
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

  // Remove unused mock functions

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
