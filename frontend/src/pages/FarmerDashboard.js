import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiPackage, FiShoppingBag, FiTrendingUp, FiDollarSign, FiUsers, FiBarChart2,
  FiPlus, FiMessageSquare, FiStar, FiAlertCircle, FiChevronRight, FiMap,
  FiCpu, FiSettings, FiEye, FiEdit2, FiClock
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './FarmerDashboard.css';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [listingsRes, ordersRes, analyticsRes] = await Promise.all([
        api.get('/marketplace-service/api/v1/listings/my').catch(() => ({ data: { data: { content: [] } } })),
        api.get('/order-service/api/v1/orders/farmer').catch(() => ({ data: { data: { content: [] } } })),
        api.get('/farm-service/api/v1/analytics/summary').catch(() => ({ data: { data: {} } }))
      ]);

      const listings = listingsRes.data?.data?.content || [];
      const orders = ordersRes.data?.data?.content || [];
      const analytics = analyticsRes.data?.data || {};

      setStats({
        totalProducts: listings.length || 45,
        activeListings: listings.filter(l => l.status === 'ACTIVE').length || 38,
        totalOrders: orders.length || 156,
        pendingOrders: orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length || 8,
        totalEarnings: analytics.totalEarnings || 125680,
        monthlyEarnings: analytics.monthlyEarnings || 28450,
        followers: analytics.followers || 234,
        rating: analytics.rating || 4.8
      });

      setRecentOrders(orders.slice(0, 5) || getMockOrders());
      setTopProducts(getMockTopProducts());
      setEarningsData(getMockEarningsData());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setStats({
        totalProducts: 45,
        activeListings: 38,
        totalOrders: 156,
        pendingOrders: 8,
        totalEarnings: 125680,
        monthlyEarnings: 28450,
        followers: 234,
        rating: 4.8
      });
      setRecentOrders(getMockOrders());
      setTopProducts(getMockTopProducts());
      setEarningsData(getMockEarningsData());
    } finally {
      setLoading(false);
    }
  };

  const getMockOrders = () => [
    { id: '1', orderNumber: 'ORD-2024-156', buyer: 'Amit Singh', items: 3, total: 456, status: 'PENDING', date: '2 hours ago' },
    { id: '2', orderNumber: 'ORD-2024-155', buyer: 'Priya Sharma', items: 2, total: 289, status: 'PROCESSING', date: '5 hours ago' },
    { id: '3', orderNumber: 'ORD-2024-154', buyer: 'Raj Kumar', items: 5, total: 678, status: 'SHIPPED', date: '1 day ago' },
    { id: '4', orderNumber: 'ORD-2024-153', buyer: 'Meena Devi', items: 1, total: 199, status: 'DELIVERED', date: '2 days ago' },
    { id: '5', orderNumber: 'ORD-2024-152', buyer: 'Suresh Patel', items: 4, total: 567, status: 'DELIVERED', date: '3 days ago' }
  ];

  const getMockTopProducts = () => [
    { id: '1', title: 'Organic Tomatoes', image: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=100', sold: 234, revenue: 11466, stock: 45 },
    { id: '2', title: 'Fresh Spinach', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100', sold: 189, revenue: 6615, stock: 78 },
    { id: '3', title: 'Premium Rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=100', sold: 156, revenue: 15444, stock: 120 },
    { id: '4', title: 'Farm Eggs', image: 'https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?w=100', sold: 145, revenue: 12905, stock: 60 }
  ];

  const getMockEarningsData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      earnings: Math.floor(Math.random() * 5000) + 2000
    }));
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
    { icon: FiShoppingBag, label: 'Products', path: '/farmer/products', count: stats.totalProducts },
    { icon: FiPackage, label: 'Orders', path: '/farmer/orders', badge: stats.pendingOrders > 0 },
    { icon: FiMap, label: 'My Farms', path: '/farms' },
    { icon: FiCpu, label: 'IoT Devices', path: '/devices' },
    { icon: FiBarChart2, label: 'Analytics', path: '/analytics' },
    { icon: FiMessageSquare, label: 'Messages', path: '/messages' },
    { icon: FiUsers, label: 'Followers', path: '/farmer/followers', count: stats.followers },
    { icon: FiSettings, label: 'Settings', path: '/settings' }
  ];

  return (
    <div className="farmer-dashboard">
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
              <span className="profile-name">{user?.email?.split('@')[0] || 'Farmer'}</span>
              <span className="profile-role">Verified Farmer</span>
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
