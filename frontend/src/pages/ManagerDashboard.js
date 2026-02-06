import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, FaTractor, FaCheckCircle, FaTimesCircle, FaEye, FaCog,
  FaBell, FaComments, FaSearch, FaClipboardList, FaUserShield, FaIdCard
} from 'react-icons/fa';
import { FiUser, FiSettings, FiMessageSquare, FiFile, FiFileText, FiExternalLink, FiAlertTriangle } from 'react-icons/fi';
import { userApi, marketplaceApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingFarmers: 0,
    approvedFarmers: 0,
    totalProducts: 0,
    pendingChats: 0
  });
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [managerProfile, setManagerProfile] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    fetchManagerProfile();
    fetchDashboardData();
  }, []);

  const fetchManagerProfile = async () => {
    try {
      const response = await userApi.get('/profiles/manager');
      const profile = response.data?.data;
      setManagerProfile(profile);
      setIsApproved(profile?.status === 'APPROVED');
    } catch (err) {
      console.error('Error fetching manager profile:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending farmers
      const [pendingRes, listingsRes] = await Promise.all([
        userApi.get('/profiles/farmer/pending?size=10').catch(() => ({ data: { data: { content: [] } } })),
        marketplaceApi.get('/listings?size=100').catch(() => ({ data: { data: { content: [] } } }))
      ]);

      const pending = pendingRes.data?.data?.content || [];
      const listings = listingsRes.data?.data?.content || listingsRes.data?.content || [];

      setPendingFarmers(pending);
      setStats({
        pendingFarmers: pending.length,
        approvedFarmers: 0,
        totalProducts: listings.length,
        pendingChats: 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (farmerId, approved) => {
    try {
      await userApi.post(`/profiles/farmer/${farmerId}/approve`, {
        approved,
        rejectionReason: approved ? null : 'Profile does not meet requirements'
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating farmer approval:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="manager-dashboard">
      {/* Verification Banner */}
      {!isApproved && (
        <div className="verification-banner warning">
          <FaUserShield />
          <div className="banner-content">
            <h4>Pending Verification</h4>
            <p>Your manager account is pending approval by an Admin. Some features are disabled until approved.</p>
          </div>
          <Link to="/profile/onboarding" className="complete-profile-btn">
            Complete Profile
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Manager Dashboard</h1>
            <p>Farmer verification and oversight</p>
          </div>
          <div className="header-actions">
            <button className="header-btn notifications">
              <FaBell />
              <span className="badge">0</span>
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
            <Link to="/profile/onboarding" className="menu-item">
              <FiUser /> My Profile
            </Link>
            <button 
              className={`menu-item ${activeSection === 'farmers' ? 'active' : ''}`}
              onClick={() => setActiveSection('farmers')}
              disabled={!isApproved}
            >
              <FaTractor /> Farmers
              {stats.pendingFarmers > 0 && <span className="menu-badge">{stats.pendingFarmers}</span>}
            </button>
            <Link to="/messages" className="menu-item">
              <FiMessageSquare /> Chats
            </Link>
            <Link to="/settings" className="menu-item">
              <FiSettings /> Settings
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {activeSection === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon pending">
                    <FaTractor />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.pendingFarmers}</span>
                    <span className="stat-label">Pending Farmers</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon approved">
                    <FaCheckCircle />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.approvedFarmers}</span>
                    <span className="stat-label">Approved Farmers</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon products">
                    <FaEye />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.totalProducts}</span>
                    <span className="stat-label">Total Products</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon chats">
                    <FaComments />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.pendingChats}</span>
                    <span className="stat-label">Pending Chats</span>
                  </div>
                </div>
              </div>

              {/* Manager Notice */}
              <div className="info-card">
                <h3>Manager Responsibilities</h3>
                <ul>
                  <li>✓ Verify farmer profiles and documentation</li>
                  <li>✓ Monitor farmer activities</li>
                  <li>✓ Respond to farmer inquiries</li>
                  <li>✓ View products (read-only)</li>
                  <li>✗ Managers cannot purchase products or place orders</li>
                  <li>✗ Managers cannot rate or review products</li>
                </ul>
              </div>
            </>
          )}

          {activeSection === 'farmers' && (
            <div className="section-content">
              <div className="section-header">
                <h2>Pending Farmer Verifications</h2>
                <div className="search-bar">
                  <FaSearch />
                  <input type="text" placeholder="Search farmers..." />
                </div>
              </div>
              
              {!isApproved ? (
                <div className="disabled-notice">
                  <FaUserShield />
                  <p>You must be approved by an Admin before you can verify farmers.</p>
                </div>
              ) : pendingFarmers.length === 0 ? (
                <div className="empty-state">
                  <FaCheckCircle />
                  <h3>No Pending Verifications</h3>
                  <p>All farmer profiles have been reviewed.</p>
                </div>
              ) : (
                <div className="farmers-list">
                  {pendingFarmers.map(farmer => (
                    <div key={farmer.id} className="farmer-card">
                      <div className="farmer-avatar">
                        {farmer.profilePhoto ? (
                          <img src={farmer.profilePhoto} alt={farmer.name} />
                        ) : (
                          <span>{farmer.name?.charAt(0) || 'F'}</span>
                        )}
                      </div>
                      <div className="farmer-info">
                        <h4>{farmer.name || 'Unknown'}</h4>
                        <p>@{farmer.username || 'N/A'}</p>
                        <p>{farmer.city}, {farmer.state}</p>
                        <p className="farm-name">{farmer.farmName}</p>
                        
                        {/* Verification Document Section */}
                        <div className="document-section">
                          <h5><FaIdCard /> Verification Document</h5>
                          {farmer.verificationDocument ? (
                            <div className="document-preview-card">
                              <span className="document-type-badge">
                                {farmer.documentType?.replace('_', ' ') || 'Document'}
                              </span>
                              {farmer.verificationDocument.includes('application/pdf') || 
                               farmer.verificationDocument.endsWith('.pdf') ? (
                                <div className="pdf-document">
                                  <FiFileText className="pdf-icon" />
                                  <a 
                                    href={farmer.verificationDocument} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="view-document-btn"
                                  >
                                    <FiExternalLink /> View PDF
                                  </a>
                                </div>
                              ) : (
                                <div className="image-document">
                                  <img 
                                    src={farmer.verificationDocument} 
                                    alt="Verification Document" 
                                    className="document-thumbnail"
                                    onClick={() => window.open(farmer.verificationDocument, '_blank')}
                                  />
                                  <a 
                                    href={farmer.verificationDocument} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="view-document-btn"
                                  >
                                    <FiExternalLink /> View Full Size
                                  </a>
                                </div>
                              )}
                              {farmer.documentUploadedAt && (
                                <span className="upload-date">
                                  Uploaded: {new Date(farmer.documentUploadedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="no-document-warning">
                              <FiAlertTriangle className="warning-icon" />
                              <span>No document uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="farmer-actions">
                        <button 
                          className="btn-approve"
                          onClick={() => handleApproval(farmer.id, true)}
                          disabled={!farmer.verificationDocument}
                          title={!farmer.verificationDocument ? 'Cannot approve without verification document' : 'Approve farmer'}
                        >
                          <FaCheckCircle /> Approve
                        </button>
                        <button 
                          className="btn-reject"
                          onClick={() => handleApproval(farmer.id, false)}
                        >
                          <FaTimesCircle /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'products' && (
            <div className="section-content">
              <div className="section-header">
                <h2>Products (View Only)</h2>
              </div>
              <div className="info-card">
                <p>As a manager, you can view products but cannot purchase, rate, or review them.</p>
                <Link to="/marketplace" className="btn-primary">
                  View Marketplace
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
