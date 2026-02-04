import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiPackage, FiShoppingBag, FiTrendingUp, FiDollarSign, FiUsers, FiBarChart2,
  FiPlus, FiMessageSquare, FiStar, FiAlertCircle, FiChevronRight, FiMap,
  FiCpu, FiSettings, FiEye, FiEdit2, FiClock, FiCheckCircle, FiXCircle, FiUser
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { marketplaceApi, orderApi, farmApi, userApi } from '../services/api';
import './FarmerDashboard.css';

const FarmerDashboard = ({ farmerProfile: propProfile, verificationStatus: propStatus }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileStatus, setProfileStatus] = useState(propStatus || null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    followers: 0,
    rating: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    if (!propStatus) {
      fetchProfileStatus();
    } else {
      setProfileStatus(propStatus);
      setProfileComplete(propProfile?.profileComplete || false);
    }
  }, [propStatus, propProfile]);

  const fetchProfileStatus = async () => {
    try {
      const res = await userApi.get('/profiles/farmer');
      const profile = res.data?.data || res.data;
      setProfileStatus(profile?.status || 'PENDING');
      setProfileComplete(profile?.profileComplete || false);
    } catch (error) {
      // Profile might not exist yet
      console.log('Profile not found or error fetching:', error);
      setProfileStatus('PENDING');
      setProfileComplete(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [listingsRes, ordersRes, analyticsRes] = await Promise.all([
        marketplaceApi.get('/listings/my').catch(() => ({ data: { data: { content: [] } } })),
        orderApi.get('/orders/my/sales').catch(() => ({ data: { data: { content: [] } } })),
        farmApi.get('/analytics/summary').catch(() => ({ data: { data: {} } }))
      ]);

      const listings = listingsRes.data?.data?.content || listingsRes.data?.content || [];
      const orders = ordersRes.data?.data?.content || ordersRes.data?.content || [];
      const analytics = analyticsRes.data?.data || analyticsRes.data || {};

      // Calculate total earnings from orders
      const totalEarnings = orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
      
      // Calculate monthly earnings (orders from this month)
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.orderDate);
        return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
      });
      const monthlyEarnings = monthlyOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);

      setStats({
        totalProducts: listings.length,
        activeListings: listings.filter(l => l.status === 'ACTIVE').length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length,
        totalEarnings: totalEarnings || analytics.totalEarnings || 0,
        monthlyEarnings: monthlyEarnings || analytics.monthlyEarnings || 0,
        followers: analytics.followers || 0,
        rating: analytics.rating || 0
      });

      // Format orders for display
      const formattedOrders = orders.slice(0, 5).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id?.slice(0, 8)}`,
        buyer: order.buyerName || order.buyerEmail || 'Customer',
        items: order.items?.length || order.itemCount || 1,
        total: parseFloat(order.totalAmount) || 0,
        status: order.status,
        date: formatRelativeTime(order.createdAt || order.orderDate)
      }));
      setRecentOrders(formattedOrders);

      // Format listings as top products based on view count or sales
      const topProducts = listings
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 4)
        .map(listing => ({
          id: listing.id,
          title: listing.title,
          image: listing.imageUrl || listing.images?.[0] || 'https://via.placeholder.com/100',
          sold: listing.soldCount || 0,
          revenue: (listing.soldCount || 0) * (parseFloat(listing.price) || 0),
          stock: parseFloat(listing.quantity) || listing.availableQuantity || 0
        }));
      setTopProducts(topProducts);

      // Generate earnings data from orders (last 7 days)
      setEarningsData(calculateWeeklyEarnings(orders));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Show zeros on error instead of fake data
      setStats({
        totalProducts: 0,
        activeListings: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalEarnings: 0,
        monthlyEarnings: 0,
        followers: 0,
        rating: 0
      });
      setRecentOrders([]);
      setTopProducts([]);
      setEarningsData(getEmptyEarningsData());
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const calculateWeeklyEarnings = (orders) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = days.map(day => ({ day, earnings: 0 }));
    const now = new Date();
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.orderDate);
      const diffDays = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        const dayIndex = orderDate.getDay();
        weeklyData[dayIndex].earnings += parseFloat(order.totalAmount) || 0;
      }
    });
    
    // Reorder so current day is last
    const todayIndex = now.getDay();
    const reordered = [...weeklyData.slice(todayIndex + 1), ...weeklyData.slice(0, todayIndex + 1)];
    return reordered;
  };

  const getEmptyEarningsData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({ day, earnings: 0 }));
  };

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
    { icon: FiUser, label: 'My Profile', path: '/profile/onboarding' },
    { icon: FiMap, label: 'Farms', path: '/farms' },
    { icon: FiMessageSquare, label: 'Chats', path: '/messages' },
    { icon: FiShoppingBag, label: 'My Products', path: '/farmer/products', count: stats.totalProducts },
    { icon: FiPackage, label: 'My Sales', path: '/farmer/orders', badge: stats.pendingOrders > 0 },
    { icon: FiDollarSign, label: 'Income', path: '/analytics' },
    { icon: FiUsers, label: 'Followers', path: '/farmer/followers', count: stats.followers },
    { icon: FiSettings, label: 'Settings', path: '/settings' }
  ];

  // Determine verification badge text
  const getVerificationBadge = () => {
    switch (profileStatus) {
      case 'APPROVED':
        return { text: 'Verified Farmer', icon: FiCheckCircle, className: 'verified' };
      case 'REJECTED':
        return { text: 'Verification Rejected', icon: FiXCircle, className: 'rejected' };
      case 'PENDING':
      default:
        return { text: 'Unverified Farmer', icon: FiClock, className: 'pending' };
    }
  };

  const verificationBadge = getVerificationBadge();
  const isVerified = profileStatus === 'APPROVED';

  return (
    <div className="farmer-dashboard">
      {/* Profile Incomplete Banner */}
      {!profileComplete && (
        <div className="verification-banner incomplete">
          <FiAlertCircle className="banner-icon" />
          <div className="banner-content">
            <h4>Complete Your Profile</h4>
            <p>Please complete your profile information to access all farmer features.</p>
          </div>
          <Link to="/profile/onboarding" className="banner-action">Complete Profile</Link>
        </div>
      )}

      {/* Verification Status Banner */}
      {profileComplete && profileStatus === 'PENDING' && (
        <div className="verification-banner pending">
          <FiClock className="banner-icon" />
          <div className="banner-content">
            <h4>Profile Verification Pending</h4>
            <p>Your profile is under review by our team. Some features like creating listings may be limited until approved.</p>
          </div>
          <Link to="/profile/onboarding" className="banner-action">View Profile</Link>
        </div>
      )}
      {profileStatus === 'REJECTED' && (
        <div className="verification-banner rejected">
          <FiXCircle className="banner-icon" />
          <div className="banner-content">
            <h4>Profile Verification Rejected</h4>
            <p>Please update your profile information and resubmit for verification.</p>
          </div>
          <Link to="/profile/onboarding" className="banner-action">Update Profile</Link>
        </div>
      )}
      {profileStatus === 'APPROVED' && (
        <div className="verification-banner approved">
          <FiCheckCircle className="banner-icon" />
          <div className="banner-content">
            <h4>Verified Farmer</h4>
            <p>Your profile is verified. You have full access to all features.</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <section className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Farmer Dashboard</h1>
            <p>Manage your products, orders, and farm operations</p>
          </div>
          <div className="header-actions">
            <Link to="/marketplace/create" className="add-product-btn">
              <FiPlus /> Add Product
            </Link>
          </div>
        </div>
      </section>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          {/* Farm Profile Card */}
          <div className="profile-card">
            <div className="profile-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'F'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || user?.email?.split('@')[0] || 'Farmer'}</span>
              <span className={`profile-role ${verificationBadge.className}`}>
                <verificationBadge.icon className="role-icon" />
                {verificationBadge.text}
              </span>
            </div>
            <div className="profile-stats">
              <div className="profile-stat">
                <FiStar className="star" />
                <span>{stats.rating}</span>
              </div>
              <div className="profile-stat">
                <FiUsers />
                <span>{stats.followers}</span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
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
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card earnings">
              <div className="stat-header">
                <span className="stat-label">Total Earnings</span>
                <FiDollarSign className="stat-icon" />
              </div>
              <span className="stat-value">₹{stats.totalEarnings.toLocaleString()}</span>
              <span className="stat-change positive">+12% from last month</span>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Monthly Earnings</span>
                <FiTrendingUp className="stat-icon" />
              </div>
              <span className="stat-value">₹{stats.monthlyEarnings.toLocaleString()}</span>
              <span className="stat-change positive">+8% from last month</span>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Total Orders</span>
                <FiPackage className="stat-icon" />
              </div>
              <span className="stat-value">{stats.totalOrders}</span>
              <span className="stat-change">{stats.pendingOrders} pending</span>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Active Products</span>
                <FiShoppingBag className="stat-icon" />
              </div>
              <span className="stat-value">{stats.activeListings}</span>
              <span className="stat-change">{stats.totalProducts} total</span>
            </div>
          </div>

          {/* Earnings Chart */}
          <section className="dashboard-section chart-section">
            <div className="section-header">
              <h2>Weekly Earnings</h2>
              <select className="chart-filter">
                <option>This Week</option>
                <option>Last Week</option>
                <option>Last Month</option>
              </select>
            </div>
            <div className="earnings-chart">
              {earningsData.map((data, index) => (
                <div key={index} className="chart-bar-container">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${(data.earnings / 7000) * 100}%` }}
                  >
                    <span className="bar-value">₹{(data.earnings / 1000).toFixed(1)}k</span>
                  </div>
                  <span className="bar-label">{data.day}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Orders & Top Products Row */}
          <div className="two-column-row">
            {/* Recent Orders */}
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Recent Orders</h2>
                <Link to="/farmer/orders" className="view-all">View All <FiChevronRight /></Link>
              </div>
              <div className="orders-list">
                {recentOrders.map((order) => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <span className="order-number">{order.orderNumber}</span>
                      <span className="order-buyer">{order.buyer}</span>
                    </div>
                    <div className="order-meta">
                      <span className="order-items">{order.items} items</span>
                      <span className="order-time"><FiClock /> {order.date}</span>
                    </div>
                    <div className="order-status" style={{ backgroundColor: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}>
                      {order.status}
                    </div>
                    <span className="order-total">₹{order.total}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Top Products */}
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Top Selling Products</h2>
                <Link to="/farmer/products" className="view-all">View All <FiChevronRight /></Link>
              </div>
              <div className="products-list">
                {topProducts.map((product) => (
                  <div key={product.id} className="product-item">
                    <img src={product.image} alt={product.title} className="product-image" />
                    <div className="product-info">
                      <span className="product-title">{product.title}</span>
                      <span className="product-sold">{product.sold} sold</span>
                    </div>
                    <div className="product-stats">
                      <span className="product-revenue">₹{product.revenue.toLocaleString()}</span>
                      <span className="product-stock">{product.stock} in stock</span>
                    </div>
                    <div className="product-actions">
                      <button className="action-btn" title="View"><FiEye /></button>
                      <button className="action-btn" title="Edit"><FiEdit2 /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Quick Actions */}
          <section className="quick-actions">
            <Link to="/marketplace/create" className="action-card">
              <FiPlus className="action-icon" />
              <span>Add New Product</span>
            </Link>
            <Link to="/farms/create" className="action-card">
              <FiMap className="action-icon" />
              <span>Add Farm</span>
            </Link>
            <Link to="/devices/add" className="action-card">
              <FiCpu className="action-icon" />
              <span>Add IoT Device</span>
            </Link>
            <Link to="/analytics" className="action-card">
              <FiBarChart2 className="action-icon" />
              <span>View Analytics</span>
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
};

export default FarmerDashboard;
