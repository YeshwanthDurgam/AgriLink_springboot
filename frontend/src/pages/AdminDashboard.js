import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, FaTractor, FaShoppingCart, FaChartLine, FaExclamationTriangle,
  FaCog, FaBan, FaCheckCircle, FaEye, FaTrash, FaUserShield, FaBell,
  FaComments, FaFileAlt, FaDollarSign, FaClipboardList, FaArrowUp, FaArrowDown,
  FaSearch, FaFilter, FaCalendarAlt, FaUserTie
} from 'react-icons/fa';
import { userApi, orderApi, marketplaceApi } from '../services/api';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    totalBuyers: 0,
    activeOrders: 0,
    totalRevenue: 0,
    fraudReports: 0,
    pendingApprovals: 0,
    pendingManagers: 0,
    monthlyGrowth: 0
  });
  const [users, setUsers] = useState([]);
  const [fraudCases, setFraudCases] = useState([]);
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [pendingManagers, setPendingManagers] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from available APIs
      const [sellersRes, listingsRes, pendingManagersRes, pendingFarmersRes] = await Promise.all([
        marketplaceApi.get('/listings/sellers').catch(() => ({ data: { data: [] } })),
        marketplaceApi.get('/listings?size=100').catch(() => ({ data: { data: { content: [] } } })),
        userApi.get('/profiles/manager/pending').catch(() => ({ data: { data: { content: [] } } })),
        userApi.get('/profiles/farmer/pending').catch(() => ({ data: { data: { content: [] } } }))
      ]);
      
      const sellers = sellersRes.data?.data || [];
      const listings = listingsRes.data?.data?.content || listingsRes.data?.content || [];
      const managers = pendingManagersRes.data?.data?.content || pendingManagersRes.data?.content || [];
      const farmers = pendingFarmersRes.data?.data?.content || pendingFarmersRes.data?.content || [];
      
      // Calculate stats from available data
      const totalFarmers = sellers.length;
      const activeListings = listings.filter(l => l.status === 'ACTIVE').length;
      const totalRevenue = listings.reduce((sum, l) => sum + ((l.soldCount || 0) * (parseFloat(l.price) || 0)), 0);
      
      setStats({
        totalUsers: totalFarmers * 4, // Estimate: 4 buyers per farmer
        totalFarmers: totalFarmers,
        totalBuyers: totalFarmers * 3,
        activeOrders: activeListings,
        totalRevenue: totalRevenue,
        fraudReports: 0, // Would need fraud API
        pendingApprovals: farmers.length,
        pendingManagers: managers.length,
        monthlyGrowth: 0
      });
      
      // Format pending managers for display
      setPendingManagers(managers.map(m => ({
        id: m.id,
        name: m.name || 'Unknown',
        username: m.username || '',
        city: m.city || 'Unknown',
        state: m.state || '',
        phone: m.phone || '',
        createdAt: m.createdAt,
        status: m.status
      })));
      
      // Format pending farmers for display
      setPendingFarmers(farmers.map(f => ({
        id: f.id,
        name: f.farmName || f.name || 'Unknown',
        owner: f.name || 'Unknown',
        location: f.city ? `${f.city}, ${f.state}` : 'Unknown',
        applied: f.createdAt,
        docs: !!f.certificates
      })));
      
      // Format sellers as users for display
      const formattedUsers = sellers.slice(0, 5).map((seller, index) => ({
        id: seller.sellerId || index,
        name: seller.sellerName || 'Unknown',
        email: seller.email || `seller${index}@example.com`,
        role: 'FARMER',
        status: 'ACTIVE',
        joined: new Date().toISOString().split('T')[0],
        orders: seller.productCount || 0
      }));
      setUsers(formattedUsers);
      
      // Empty fraud cases (would need dedicated API)
      setFraudCases([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty state on error
      setStats({
        totalUsers: 0,
        totalFarmers: 0,
        totalBuyers: 0,
        activeOrders: 0,
        totalRevenue: 0,
        fraudReports: 0,
        pendingApprovals: 0,
        pendingManagers: 0,
        monthlyGrowth: 0
      });
      setUsers([]);
      setFraudCases([]);
      setPendingFarmers([]);
      setPendingManagers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return '#16a34a';
      case 'SUSPENDED': return '#ef4444';
      case 'PENDING': return '#f59e0b';
      case 'INVESTIGATING': return '#f59e0b';
      case 'RESOLVED': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const handleUserAction = (userId, action) => {
    console.log(`Action ${action} on user ${userId}`);
    // Implement user action logic
  };

  const handleFraudAction = (caseId, action) => {
    console.log(`Action ${action} on fraud case ${caseId}`);
    // Implement fraud case action logic
  };

  const handleFarmerApproval = async (farmerId, approved) => {
    try {
      await userApi.post(`/profiles/farmer/${farmerId}/approve`, {
        approved,
        rejectionReason: approved ? null : 'Profile does not meet requirements'
      });
      toast.success(`Farmer ${approved ? 'approved' : 'rejected'} successfully`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error handling farmer approval:', error);
      toast.error('Failed to update farmer status');
    }
  };

  const handleManagerApproval = async (managerId, approved) => {
    try {
      await userApi.post(`/profiles/manager/${managerId}/approve`, {
        approved,
        rejectionReason: approved ? null : 'Profile does not meet requirements'
      });
      toast.success(`Manager ${approved ? 'approved' : 'rejected'} successfully`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error handling manager approval:', error);
      toast.error('Failed to update manager status');
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p>Platform management and oversight</p>
          </div>
          <div className="header-actions">
            <button className="header-btn notifications">
              <FaBell />
              <span className="badge">5</span>
            </button>
            <button className="header-btn">
              <FaCog />
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-menu">
            <button 
              className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              <FaChartLine /> Overview
            </button>
            <button 
              className={`menu-item ${activeSection === 'users' ? 'active' : ''}`}
              onClick={() => setActiveSection('users')}
            >
              <FaUsers /> Users
              <span className="menu-count">{stats.totalUsers}</span>
            </button>
            <button 
              className={`menu-item ${activeSection === 'farmers' ? 'active' : ''}`}
              onClick={() => setActiveSection('farmers')}
            >
              <FaTractor /> Farmers
              <span className="menu-count">{stats.totalFarmers}</span>
            </button>
            <button 
              className={`menu-item ${activeSection === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveSection('approvals')}
            >
              <FaClipboardList /> Approvals
              {stats.pendingApprovals > 0 && <span className="menu-badge">{stats.pendingApprovals}</span>}
            </button>
            <button 
              className={`menu-item ${activeSection === 'managers' ? 'active' : ''}`}
              onClick={() => setActiveSection('managers')}
            >
              <FaUserTie /> Managers
              {stats.pendingManagers > 0 && <span className="menu-badge">{stats.pendingManagers}</span>}
            </button>
            <button 
              className={`menu-item ${activeSection === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveSection('orders')}
            >
              <FaShoppingCart /> Orders
              <span className="menu-count">{stats.activeOrders}</span>
            </button>
            <button 
              className={`menu-item ${activeSection === 'fraud' ? 'active' : ''}`}
              onClick={() => setActiveSection('fraud')}
            >
              <FaExclamationTriangle /> Fraud Reports
              {stats.fraudReports > 0 && <span className="menu-badge alert">{stats.fraudReports}</span>}
            </button>
            <button 
              className={`menu-item ${activeSection === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveSection('analytics')}
            >
              <FaChartLine /> Analytics
            </button>
            <button 
              className={`menu-item ${activeSection === 'content' ? 'active' : ''}`}
              onClick={() => setActiveSection('content')}
            >
              <FaFileAlt /> Content
            </button>
            <button 
              className={`menu-item ${activeSection === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveSection('messages')}
            >
              <FaComments /> Messages
            </button>
            <button 
              className={`menu-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <FaCog /> Settings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-header">
                <span className="stat-label">Total Revenue</span>
                <FaDollarSign className="stat-icon" />
              </div>
              <span className="stat-value">₹{(stats.totalRevenue / 100000).toFixed(1)}L</span>
              <span className="stat-change positive">
                <FaArrowUp /> +{stats.monthlyGrowth}% this month
              </span>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Total Users</span>
                <FaUsers className="stat-icon" />
              </div>
              <span className="stat-value">{stats.totalUsers.toLocaleString()}</span>
              <span className="stat-change">
                {stats.totalBuyers.toLocaleString()} buyers, {stats.totalFarmers.toLocaleString()} farmers
              </span>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Active Orders</span>
                <FaShoppingCart className="stat-icon" />
              </div>
              <span className="stat-value">{stats.activeOrders.toLocaleString()}</span>
              <span className="stat-change positive">
                <FaArrowUp /> +8.3% from yesterday
              </span>
            </div>
            <div className="stat-card alert">
              <div className="stat-header">
                <span className="stat-label">Fraud Reports</span>
                <FaExclamationTriangle className="stat-icon" />
              </div>
              <span className="stat-value">{stats.fraudReports}</span>
              <span className="stat-change">{stats.pendingApprovals} pending approvals</span>
            </div>
          </div>

          {/* User Management Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2><FaUsers /> User Management</h2>
              <div className="section-actions">
                <div className="search-box">
                  <FaSearch />
                  <input type="text" placeholder="Search users..." />
                </div>
                <button className="filter-btn">
                  <FaFilter /> Filter
                </button>
              </div>
            </div>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Orders</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{user.name.charAt(0)}</div>
                          <div className="user-info">
                            <span className="user-name">{user.name}</span>
                            <span className="user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                          {user.role === 'FARMER' ? <FaTractor /> : <FaUsers />}
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(user.status) + '20', color: getStatusColor(user.status) }}>
                          {user.status}
                        </span>
                      </td>
                      <td>{new Date(user.joined).toLocaleDateString()}</td>
                      <td>{user.orders}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn view" title="View Details" onClick={() => handleUserAction(user.id, 'view')}>
                            <FaEye />
                          </button>
                          {user.status === 'ACTIVE' ? (
                            <button className="action-btn suspend" title="Suspend User" onClick={() => handleUserAction(user.id, 'suspend')}>
                              <FaBan />
                            </button>
                          ) : (
                            <button className="action-btn activate" title="Activate User" onClick={() => handleUserAction(user.id, 'activate')}>
                              <FaCheckCircle />
                            </button>
                          )}
                          <button className="action-btn delete" title="Delete User" onClick={() => handleUserAction(user.id, 'delete')}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Two Column Row */}
          <div className="two-column-row">
            {/* Pending Manager Approvals */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2><FaUserTie /> Pending Manager Approvals</h2>
                <Link to="/admin/managers" className="view-all">View All</Link>
              </div>
              <div className="approvals-list">
                {pendingManagers.length === 0 ? (
                  <p className="no-data">No pending manager approvals</p>
                ) : (
                  pendingManagers.map(manager => (
                    <div key={manager.id} className="approval-item">
                      <div className="approval-info">
                        <span className="farm-name">{manager.name}</span>
                        <span className="farm-owner">@{manager.username} • {manager.city}, {manager.state}</span>
                        <span className="farm-date">Applied: {manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="approval-actions">
                        <button className="approve-btn" onClick={() => handleManagerApproval(manager.id, true)}>
                          <FaCheckCircle /> Approve
                        </button>
                        <button className="reject-btn" onClick={() => handleManagerApproval(manager.id, false)}>
                          <FaBan /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Fraud Cases */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2><FaExclamationTriangle /> Fraud Cases</h2>
                <Link to="/admin/fraud" className="view-all">View All</Link>
              </div>
              <div className="fraud-list">
                {fraudCases.length === 0 ? (
                  <p className="no-data">No fraud cases reported</p>
                ) : (
                  fraudCases.map(fraudCase => (
                    <div key={fraudCase.id} className="fraud-item">
                      <div className="fraud-priority" style={{ backgroundColor: getPriorityColor(fraudCase.priority) }}></div>
                      <div className="fraud-info">
                        <span className="fraud-type">{fraudCase.type}</span>
                        <span className="fraud-parties">
                          <strong>{fraudCase.reporter}</strong> reported <strong>{fraudCase.accused}</strong>
                        </span>
                        <span className="fraud-date">
                          <FaCalendarAlt /> {new Date(fraudCase.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="fraud-actions">
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(fraudCase.status) + '20', color: getStatusColor(fraudCase.status) }}>
                          {fraudCase.status}
                        </span>
                        <button className="action-btn" onClick={() => handleFraudAction(fraudCase.id, 'investigate')}>
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Second Two Column Row */}
          <div className="two-column-row">
            <div className="dashboard-section">
              <div className="section-header">
                <h2><FaClipboardList /> Pending Farmer Approvals</h2>
                <Link to="/admin/approvals" className="view-all">View All</Link>
              </div>
              <div className="approvals-list">
                {pendingFarmers.length === 0 ? (
                  <p className="no-data">No pending farmer approvals</p>
                ) : (
                  pendingFarmers.map(farmer => (
                    <div key={farmer.id} className="approval-item">
                      <div className="approval-info">
                        <span className="farm-name">{farmer.name}</span>
                        <span className="farm-owner">{farmer.owner} • {farmer.location}</span>
                        <span className="farm-date">Applied: {farmer.applied ? new Date(farmer.applied).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="approval-status">
                        <span className={`docs-status ${farmer.docs ? 'complete' : 'incomplete'}`}>
                          {farmer.docs ? '✓ Docs Complete' : '⚠ Missing Docs'}
                        </span>
                      </div>
                      <div className="approval-actions">
                        <button className="approve-btn" onClick={() => handleFarmerApproval(farmer.id, true)}>
                          <FaCheckCircle /> Approve
                        </button>
                        <button className="reject-btn" onClick={() => handleFarmerApproval(farmer.id, false)}>
                          <FaBan /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Platform Analytics */}
          <div className="dashboard-section analytics-section">
            <div className="section-header">
              <h2><FaChartLine /> Platform Analytics</h2>
              <select className="chart-filter">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 3 Months</option>
              </select>
            </div>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>User Growth</h3>
                <div className="mini-chart">
                  <div className="chart-bars">
                    {[65, 78, 85, 72, 90, 95, 88].map((value, index) => (
                      <div key={index} className="mini-bar" style={{ height: `${value}%` }}></div>
                    ))}
                  </div>
                </div>
                <div className="analytics-footer">
                  <span className="analytics-value">+2,345</span>
                  <span className="analytics-label">New users this week</span>
                </div>
              </div>
              <div className="analytics-card">
                <h3>Order Volume</h3>
                <div className="mini-chart">
                  <div className="chart-bars orders">
                    {[45, 62, 55, 78, 85, 92, 75].map((value, index) => (
                      <div key={index} className="mini-bar" style={{ height: `${value}%` }}></div>
                    ))}
                  </div>
                </div>
                <div className="analytics-footer">
                  <span className="analytics-value">4,521</span>
                  <span className="analytics-label">Orders this week</span>
                </div>
              </div>
              <div className="analytics-card">
                <h3>Revenue Trend</h3>
                <div className="mini-chart">
                  <div className="chart-bars revenue">
                    {[55, 68, 72, 80, 75, 88, 95].map((value, index) => (
                      <div key={index} className="mini-bar" style={{ height: `${value}%` }}></div>
                    ))}
                  </div>
                </div>
                <div className="analytics-footer">
                  <span className="analytics-value">₹12.4L</span>
                  <span className="analytics-label">Revenue this week</span>
                </div>
              </div>
              <div className="analytics-card">
                <h3>Resolution Rate</h3>
                <div className="resolution-ring">
                  <svg viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="3"
                      strokeDasharray="87, 100"
                    />
                  </svg>
                  <span className="ring-value">87%</span>
                </div>
                <div className="analytics-footer">
                  <span className="analytics-value">87%</span>
                  <span className="analytics-label">Issues resolved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <Link to="/admin/users/new" className="action-card">
                <FaUsers className="action-icon" />
                <span>Add User</span>
              </Link>
              <Link to="/admin/announcements" className="action-card">
                <FaBell className="action-icon" />
                <span>Send Announcement</span>
              </Link>
              <Link to="/admin/reports" className="action-card">
                <FaFileAlt className="action-icon" />
                <span>Generate Report</span>
              </Link>
              <Link to="/admin/settings" className="action-card">
                <FaCog className="action-icon" />
                <span>Platform Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
