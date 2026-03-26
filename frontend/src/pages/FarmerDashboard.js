import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPackage, FiShoppingBag, FiTrendingUp, FiDollarSign, FiUsers,
  FiPlus, FiMessageSquare, FiStar, FiAlertCircle, FiChevronRight, FiMap,
  FiSettings, FiEye, FiEdit2, FiClock, FiCheckCircle, FiXCircle, FiUser, FiSun,
  FiRefreshCw, FiChevronUp, FiChevronDown, FiSliders
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import marketplaceService from '../services/marketplaceService';
import orderService from '../services/orderService';
import analyticsService from '../services/analyticsService';
import './FarmerDashboard.css';

const DASHBOARD_WIDGET_ORDER = ['recommendations', 'alerts', 'stats', 'chart', 'ordersProducts', 'quickActions'];

const FarmerDashboard = ({ verificationStatus: propStatus }) => {
  const { user } = useAuth();
  const [profileStatus, setProfileStatus] = useState(propStatus || null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
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
  const [allListings, setAllListings] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [widgetPrefs, setWidgetPrefs] = useState({ order: DASHBOARD_WIDGET_ORDER, hidden: [] });

  const widgetPrefsKey = useMemo(
    () => `farmerDashboardWidgetPrefs:${user?.id || user?.email || 'default'}`,
    [user?.id, user?.email]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(widgetPrefsKey);
      if (!raw) {
        setWidgetPrefs({ order: DASHBOARD_WIDGET_ORDER, hidden: [] });
        return;
      }
      const parsed = JSON.parse(raw);
      const order = Array.isArray(parsed?.order)
        ? DASHBOARD_WIDGET_ORDER.filter(id => parsed.order.includes(id)).concat(
            DASHBOARD_WIDGET_ORDER.filter(id => !parsed.order.includes(id))
          )
        : DASHBOARD_WIDGET_ORDER;
      const hidden = Array.isArray(parsed?.hidden)
        ? parsed.hidden.filter(id => DASHBOARD_WIDGET_ORDER.includes(id))
        : [];
      setWidgetPrefs({ order, hidden });
    } catch (prefError) {
      setWidgetPrefs({ order: DASHBOARD_WIDGET_ORDER, hidden: [] });
    }
  }, [widgetPrefsKey]);

  const persistWidgetPrefs = useCallback((nextPrefs) => {
    setWidgetPrefs(nextPrefs);
    try {
      localStorage.setItem(widgetPrefsKey, JSON.stringify(nextPrefs));
    } catch (storageError) {
      // Ignore storage write failures.
    }
  }, [widgetPrefsKey]);

  const moveWidget = useCallback((widgetId, direction) => {
    const currentOrder = widgetPrefs.order;
    const index = currentOrder.indexOf(widgetId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
    persistWidgetPrefs({ ...widgetPrefs, order: nextOrder });
  }, [persistWidgetPrefs, widgetPrefs]);

  const toggleWidgetHidden = useCallback((widgetId) => {
    const hidden = widgetPrefs.hidden.includes(widgetId)
      ? widgetPrefs.hidden.filter(id => id !== widgetId)
      : [...widgetPrefs.hidden, widgetId];
    persistWidgetPrefs({ ...widgetPrefs, hidden });
  }, [persistWidgetPrefs, widgetPrefs]);

  const fetchProfileStatus = useCallback(async () => {
    try {
      const res = await userApi.get('/profiles/farmer');
      const profile = res.data?.data || res.data;
      setProfileStatus(profile?.status || 'PENDING');
      setProfileComplete(Boolean(profile?.profileComplete));
    } catch (fetchError) {
      setProfileStatus('PENDING');
      setProfileComplete(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [listingsResponse, ordersResponse, salesAnalyticsResponse, farmSummaryResponse] = await Promise.all([
        marketplaceService.getMyListings(0, 100),
        orderService.getSellerOrders(0, 100),
        analyticsService.getSalesAnalytics(),
        analyticsService.getDashboardSummary()
      ]);

      const listings = Array.isArray(listingsResponse)
        ? listingsResponse
        : (listingsResponse?.content || []);

      const ordersData = ordersResponse?.data || ordersResponse || {};
      const orders = Array.isArray(ordersData?.content)
        ? ordersData.content
        : (Array.isArray(ordersData) ? ordersData : []);

      setAllListings(listings);
      setAllOrders(orders);

      const salesAnalytics = salesAnalyticsResponse?.data || salesAnalyticsResponse || {};
      const farmSummary = farmSummaryResponse?.data || farmSummaryResponse || {};

      const totalRevenue = parseFloat(salesAnalytics.totalRevenue) || 0;
      const totalRevenueThisMonth = parseFloat(salesAnalytics.totalRevenueThisMonth) || 0;
      const pendingOrders = (salesAnalytics.pendingOrders ?? null) != null
        ? Number(salesAnalytics.pendingOrders)
        : orders.filter(o => ['PENDING', 'PROCESSING'].includes((o.status || '').toUpperCase())).length;
      const followers = Number(farmSummary.followers || 0);
      const rating = Number(salesAnalytics.averageRating || farmSummary.averageRating || 0);

      setStats({
        totalProducts: listings.length,
        activeListings: listings.filter(l => (l.status || '').toUpperCase() === 'ACTIVE').length,
        totalOrders: orders.length,
        pendingOrders,
        totalEarnings: totalRevenue,
        monthlyEarnings: totalRevenueThisMonth,
        followers,
        rating
      });

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

      const topProductsData = [...listings]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 4)
        .map(listing => ({
          id: listing.id,
          title: listing.title,
          image: listing.imageUrl || listing.images?.[0]?.imageUrl || listing.images?.[0] || 'https://via.placeholder.com/100',
          sold: listing.soldCount || 0,
          revenue: (listing.soldCount || 0) * (parseFloat(listing.pricePerUnit || listing.price) || 0),
          stock: parseFloat(listing.quantity) || listing.availableQuantity || 0,
          unit: listing.quantityUnit || listing.unit || 'kg'
        }));
      setTopProducts(topProductsData);

      setEarningsData(calculateWeeklyEarnings(orders));
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError('Unable to load some dashboard data. Please retry.');
      setAllListings([]);
      setAllOrders([]);
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchProfileStatus();
  }, [fetchDashboardData, fetchProfileStatus]);

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
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
    { icon: FiSun, label: 'Farm Insights', path: '/analytics' },
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
  const maxWeeklyEarnings = useMemo(() => {
    const maxVal = Math.max(...earningsData.map(d => d.earnings || 0), 0);
    return maxVal > 0 ? maxVal : 1;
  }, [earningsData]);

  const hasCoreData = stats.totalProducts > 0 || stats.totalOrders > 0 || stats.totalEarnings > 0;
  const lowStockCount = allListings.filter(listing => {
    const qty = Number(listing?.quantity || listing?.availableQuantity || 0);
    return qty > 0 && qty <= 10;
  }).length;

  const delayedFulfillmentCount = useMemo(() => {
    const pendingStatuses = new Set(['PENDING', 'CONFIRMED', 'PROCESSING']);
    const now = Date.now();
    return allOrders.filter((order) => {
      const status = (order?.status || '').toUpperCase();
      if (!pendingStatuses.has(status)) return false;
      const createdAt = new Date(order?.createdAt || order?.orderDate || 0).getTime();
      if (!createdAt) return false;
      const ageHours = (now - createdAt) / (1000 * 60 * 60);
      return ageHours > 48;
    }).length;
  }, [allOrders]);

  const alerts = useMemo(() => {
    const items = [];
    if (delayedFulfillmentCount > 0) {
      items.push({
        id: 'delayed-fulfillment',
        title: `${delayedFulfillmentCount} orders delayed beyond 48h`,
        description: 'Prioritize confirmation and dispatch to reduce cancellation risk.',
        ctaLabel: 'Review orders',
        ctaPath: '/farmer/orders',
        severity: 'high'
      });
    }
    if (lowStockCount > 0) {
      items.push({
        id: 'low-stock-alert',
        title: `${lowStockCount} low-stock listings`,
        description: 'Update inventory soon to avoid missed demand.',
        ctaLabel: 'Update listings',
        ctaPath: '/farmer/products',
        severity: 'medium'
      });
    }
    return items;
  }, [delayedFulfillmentCount, lowStockCount]);

  const recommendations = useMemo(() => {
    const items = [];
    if (!profileComplete) {
      items.push({
        id: 'complete-profile',
        title: 'Complete farmer profile',
        description: 'Complete your profile to boost trust and unlock all seller capabilities.',
        ctaLabel: 'Complete',
        ctaPath: '/profile/onboarding'
      });
    }
    if (stats.pendingOrders > 0) {
      items.push({
        id: 'pending-orders',
        title: `${stats.pendingOrders} pending sale orders`,
        description: 'Confirm and dispatch quickly to improve fulfillment score.',
        ctaLabel: 'Manage orders',
        ctaPath: '/farmer/orders'
      });
    }
    if (lowStockCount > 0) {
      items.push({
        id: 'low-stock',
        title: `${lowStockCount} products running low`,
        description: 'Update stock to avoid out-of-stock losses on high-interest listings.',
        ctaLabel: 'Update stock',
        ctaPath: '/farmer/products'
      });
    }
    if (stats.totalProducts === 0) {
      items.push({
        id: 'first-listing',
        title: 'Publish your first listing',
        description: 'Listings are required before orders and revenue can start flowing.',
        ctaLabel: 'Add product',
        ctaPath: '/marketplace/create'
      });
    }
    return items.slice(0, 4);
  }, [profileComplete, stats.pendingOrders, stats.totalProducts, lowStockCount]);

  const widgetCatalog = [
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'alerts', label: 'Operational Alerts' },
    { id: 'stats', label: 'KPI Cards' },
    { id: 'chart', label: 'Weekly Earnings Chart' },
    { id: 'ordersProducts', label: 'Orders and Top Products' },
    { id: 'quickActions', label: 'Quick Actions' }
  ];

  const visibleWidgetIds = widgetPrefs.order.filter(id => !widgetPrefs.hidden.includes(id));
  const noWidgetsVisible = visibleWidgetIds.length === 0;

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
            <Link to="/orders" state={{ initialTab: 'buyer' }} className="order-mode-link">
              Purchases
            </Link>
            <Link to="/orders" state={{ initialTab: 'seller' }} className="order-mode-link">
              Sales
            </Link>
            <button type="button" className="refresh-btn" onClick={fetchDashboardData}>
              <FiRefreshCw /> Refresh
            </button>
            <Link to="/marketplace/create" className="add-product-btn">
              <FiPlus /> Add Product
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <section className="dashboard-error-banner">
          <span>{error}</span>
          <button type="button" onClick={fetchDashboardData}>Try Again</button>
        </section>
      )}

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
          <section className="dashboard-tools">
            <button
              type="button"
              className="customize-btn"
              onClick={() => setCustomizeOpen(prev => !prev)}
            >
              <FiSliders /> {customizeOpen ? 'Close Customize' : 'Customize Dashboard'}
            </button>
          </section>

          {customizeOpen && (
            <section className="dashboard-section customize-panel">
              <div className="section-header">
                <h2>Dashboard Layout</h2>
                <span className="section-meta">Reorder and hide widgets. Preferences are saved for your account.</span>
              </div>
              <div className="customize-list">
                {widgetCatalog.map((widget) => {
                  const index = widgetPrefs.order.indexOf(widget.id);
                  return (
                    <div key={widget.id} className="customize-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={!widgetPrefs.hidden.includes(widget.id)}
                          onChange={() => toggleWidgetHidden(widget.id)}
                        />
                        <span>{widget.label}</span>
                      </label>
                      <div className="customize-actions">
                        <button type="button" onClick={() => moveWidget(widget.id, 'up')} disabled={index <= 0}>
                          <FiChevronUp />
                        </button>
                        <button type="button" onClick={() => moveWidget(widget.id, 'down')} disabled={index === widgetPrefs.order.length - 1}>
                          <FiChevronDown />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {!loading && !hasCoreData && !error && (
            <section className="dashboard-empty-state">
              <h3>Start growing your farmer business</h3>
              <p>Add your first listing to see earnings, orders, and performance trends here.</p>
              <Link to="/marketplace/create" className="add-product-btn">
                <FiPlus /> Add First Product
              </Link>
            </section>
          )}

          {!loading && noWidgetsVisible && (
            <section className="dashboard-empty-state">
              <h3>All dashboard widgets are hidden</h3>
              <p>Use Customize Dashboard to turn widgets back on.</p>
            </section>
          )}

          {visibleWidgetIds.map((widgetId) => {
            if (widgetId === 'recommendations') {
              if (!loading && recommendations.length === 0) return null;
              return (
                <section key={widgetId} className="dashboard-section recommendation-section">
                  <div className="section-header">
                    <h2>Recommended Next Steps</h2>
                    <span className="section-meta">Prioritized for growth and smoother operations</span>
                  </div>
                  <div className="recommendation-list">
                    {loading ? (
                      Array.from({ length: 2 }).map((_, idx) => (
                        <div key={idx} className="recommendation-item skeleton-item" />
                      ))
                    ) : (
                      recommendations.map((item) => (
                        <div key={item.id} className="recommendation-item">
                          <div>
                            <h4>{item.title}</h4>
                            <p>{item.description}</p>
                          </div>
                          <Link to={item.ctaPath} className="recommendation-cta">
                            {item.ctaLabel}
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              );
            }

            if (widgetId === 'alerts') {
              if (!loading && alerts.length === 0) return null;
              return (
                <section key={widgetId} className="dashboard-section alerts-section">
                  <div className="section-header">
                    <h2>Operational Alerts</h2>
                    <span className="section-meta">Must-fix items for fulfillment and inventory health</span>
                  </div>
                  <div className="alert-list">
                    {loading ? (
                      Array.from({ length: 2 }).map((_, idx) => (
                        <div key={idx} className="alert-item skeleton-item" />
                      ))
                    ) : (
                      alerts.map((alert) => (
                        <div key={alert.id} className={`alert-item ${alert.severity}`}>
                          <div>
                            <h4>{alert.title}</h4>
                            <p>{alert.description}</p>
                          </div>
                          <Link to={alert.ctaPath} className="recommendation-cta">
                            {alert.ctaLabel}
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              );
            }

            if (widgetId === 'stats') {
              return (
                <div key={widgetId} className="stats-grid">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="stat-card skeleton-item" />
                    ))
                  ) : (
                    <>
                      <Link to="/analytics" className="stat-card earnings clickable-card">
                        <div className="stat-header">
                          <span className="stat-label">Total Earnings</span>
                          <FiDollarSign className="stat-icon" />
                        </div>
                        <span className="stat-value">₹{stats.totalEarnings.toLocaleString()}</span>
                        <span className="stat-change">Revenue analytics</span>
                      </Link>

                      <Link to="/analytics" className="stat-card clickable-card">
                        <div className="stat-header">
                          <span className="stat-label">Monthly Earnings</span>
                          <FiTrendingUp className="stat-icon" />
                        </div>
                        <span className="stat-value">₹{stats.monthlyEarnings.toLocaleString()}</span>
                        <span className="stat-change">This month</span>
                      </Link>

                      <Link to="/farmer/orders" className="stat-card clickable-card">
                        <div className="stat-header">
                          <span className="stat-label">Total Orders</span>
                          <FiPackage className="stat-icon" />
                        </div>
                        <span className="stat-value">{stats.totalOrders}</span>
                        <span className="stat-change">{stats.pendingOrders} pending</span>
                      </Link>

                      <Link to="/farmer/products" className="stat-card clickable-card">
                        <div className="stat-header">
                          <span className="stat-label">Active Products</span>
                          <FiShoppingBag className="stat-icon" />
                        </div>
                        <span className="stat-value">{stats.activeListings}</span>
                        <span className="stat-change">{stats.totalProducts} total</span>
                      </Link>
                    </>
                  )}
                </div>
              );
            }

            if (widgetId === 'chart') {
              return (
                <section key={widgetId} className="dashboard-section chart-section">
                  <div className="section-header">
                    <h2>Weekly Earnings</h2>
                    <span className="section-meta">Last 7 days</span>
                  </div>
                  <div className="earnings-chart">
                    {(loading ? getEmptyEarningsData() : earningsData).map((data, index) => (
                      <div key={index} className="chart-bar-container">
                        <div
                          className={`chart-bar ${loading ? 'skeleton-item' : ''}`}
                          style={
                            loading
                              ? { height: `${20 + (index % 4) * 10}%` }
                              : { height: `${Math.max((data.earnings / maxWeeklyEarnings) * 100, data.earnings > 0 ? 8 : 0)}%` }
                          }
                        >
                          {!loading && <span className="bar-value">₹{Math.round(data.earnings).toLocaleString()}</span>}
                        </div>
                        <span className="bar-label">{data.day}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (widgetId === 'ordersProducts') {
              return (
                <div key={widgetId} className="two-column-row">
                  <section className="dashboard-section">
                    <div className="section-header">
                      <h2>Recent Orders</h2>
                      <Link to="/farmer/orders" className="view-all">View All <FiChevronRight /></Link>
                    </div>
                    <div className="orders-list">
                      {loading ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="order-item skeleton-item" />
                        ))
                      ) : recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
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
                            <span className="order-total">₹{order.total.toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="empty-inline">No sales orders yet.</div>
                      )}
                    </div>
                  </section>

                  <section className="dashboard-section">
                    <div className="section-header">
                      <h2>Top Selling Products</h2>
                      <Link to="/farmer/products" className="view-all">View All <FiChevronRight /></Link>
                    </div>
                    <div className="products-list">
                      {loading ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="product-item skeleton-item" />
                        ))
                      ) : topProducts.length > 0 ? (
                        topProducts.map((product) => (
                          <div key={product.id} className="product-item">
                            <img src={product.image} alt={product.title} className="product-image" />
                            <div className="product-info">
                              <span className="product-title">{product.title}</span>
                              <span className="product-sold">{product.sold} sold</span>
                            </div>
                            <div className="product-stats">
                              <span className="product-revenue">₹{product.revenue.toLocaleString()}</span>
                              <span className="product-stock">{product.stock} {product.unit} in stock</span>
                            </div>
                            <div className="product-actions">
                              <Link className="action-btn" title="View" to={`/marketplace/${product.id}`}><FiEye /></Link>
                              <Link className="action-btn" title="Edit" to={`/marketplace/edit/${product.id}`}><FiEdit2 /></Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-inline">Add products to track top performers.</div>
                      )}
                    </div>
                  </section>
                </div>
              );
            }

            if (widgetId === 'quickActions') {
              return (
                <section key={widgetId} className="dashboard-section">
                  <div className="section-header">
                    <h2>Quick Actions</h2>
                    <span className="section-meta">Frequently used farmer operations</span>
                  </div>
                  <div className="quick-actions">
                    <Link to="/marketplace/create" className="action-card">
                      <FiPlus className="action-icon" />
                      <span>Add New Product</span>
                    </Link>
                    <Link to="/farms/create" className="action-card">
                      <FiMap className="action-icon" />
                      <span>Add Farm</span>
                    </Link>
                    <Link to="/analytics" className="action-card">
                      <FiSun className="action-icon" />
                      <span>Farm Insights</span>
                    </Link>
                    <Link to="/analytics" className="action-card" state={{ tab: 'demandForecast' }}>
                      <FiTrendingUp className="action-icon" />
                      <span>Demand Forecast</span>
                    </Link>
                  </div>
                </section>
              );
            }

            return null;
          })}

          {lastUpdatedAt && (
            <div className="dashboard-last-updated">
              Last updated: {lastUpdatedAt.toLocaleString()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FarmerDashboard;
