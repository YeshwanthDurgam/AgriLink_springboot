import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMap, FiPackage, FiDollarSign, FiTrendingUp, FiPlus, FiArrowRight } from 'react-icons/fi';
import FarmService from '../services/farmService';
import './Dashboard.css';

const Dashboard = () => {
  const { user, getDashboardRoute } = useAuth();
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalCrops: 0,
    activeListings: 0,
    totalRevenue: 0,
  });
  const [recentFarms, setRecentFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/dashboard');

  useEffect(() => {
    // Check if we should redirect to a role-specific dashboard
    const dashboardRoute = getDashboardRoute();
    if (dashboardRoute && dashboardRoute !== '/dashboard') {
      setShouldRedirect(true);
      setRedirectPath(dashboardRoute);
    } else {
      fetchDashboardData();
    }
  }, [getDashboardRoute]);

  // Redirect to role-specific dashboard
  if (shouldRedirect) {
    return <Navigate to={redirectPath} replace />;
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch farms
      const farmsResponse = await FarmService.getMyFarms({ page: 0, size: 5 });
      if (farmsResponse.success) {
        const farms = farmsResponse.data.content || [];
        setRecentFarms(farms);
        setStats(prev => ({
          ...prev,
          totalFarms: farmsResponse.data.totalElements || farms.length,
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for demo
      setStats({
        totalFarms: 3,
        totalCrops: 12,
        activeListings: 8,
        totalRevenue: 45230,
      });
      setRecentFarms([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>{getGreeting()}, {user?.email?.split('@')[0] || 'Farmer'}! 👋</h1>
            <p>Here's what's happening with your farms today.</p>
          </div>
          <Link to="/farms/create" className="btn btn-primary">
            <FiPlus />
            Add New Farm
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon green">
              <FiMap />
            </div>
            <div className="stat-info">
              <h3>{stats.totalFarms}</h3>
              <p>Total Farms</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <FiPackage />
            </div>
            <div className="stat-info">
              <h3>{stats.totalCrops}</h3>
              <p>Total Crops</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              <FiTrendingUp />
            </div>
            <div className="stat-info">
              <h3>{stats.activeListings}</h3>
              <p>Active Listings</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <FiDollarSign />
            </div>
            <div className="stat-info">
              <h3>{formatCurrency(stats.totalRevenue)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/farms/create" className="quick-action-card">
              <div className="quick-action-icon">🌾</div>
              <h3>Add Farm</h3>
              <p>Register a new farm</p>
            </Link>
            <Link to="/marketplace" className="quick-action-card">
              <div className="quick-action-icon">🛒</div>
              <h3>Marketplace</h3>
              <p>Browse or sell products</p>
            </Link>
            <Link to="/devices" className="quick-action-card">
              <div className="quick-action-icon">📡</div>
              <h3>IoT Devices</h3>
              <p>Monitor your sensors</p>
            </Link>
            <Link to="/orders" className="quick-action-card">
              <div className="quick-action-icon">📦</div>
              <h3>Orders</h3>
              <p>Track your orders</p>
            </Link>
          </div>
        </div>

        {/* Recent Farms */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Farms</h2>
            <Link to="/farms" className="view-all-link">
              View All <FiArrowRight />
            </Link>
          </div>
          {recentFarms.length > 0 ? (
            <div className="data-grid">
              {recentFarms.map((farm) => (
                <Link to={`/farms/${farm.id}`} key={farm.id} className="farm-card">
                  <div className="farm-card-image">
                    🏡
                  </div>
                  <div className="farm-card-content">
                    <h3>{farm.name}</h3>
                    <p>📍 {farm.location || 'Location not set'}</p>
                    <p>📐 {farm.size ? `${farm.size} acres` : 'Size not set'}</p>
                  </div>
                  <div className="farm-card-footer">
                    <span className={`farm-status ${farm.status?.toLowerCase() || 'active'}`}>
                      {farm.status || 'Active'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <h3>No farms yet</h3>
              <p>Start by adding your first farm to track your agricultural activities.</p>
              <Link to="/farms/create" className="btn btn-primary">
                <FiPlus />
                Add Your First Farm
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
