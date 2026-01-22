import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiArrowLeft, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import './FarmerFollowers.css';

const FarmerFollowers = () => {
  const { user, isAuthenticated } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFollowers();
    }
  }, [isAuthenticated]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.get('/farmers/my/followers');
      const data = response.data?.data || response.data || [];
      setFollowers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching followers:', error);
      // Handle 404 as empty list (no followers)
      if (error.response?.status === 404) {
        setFollowers([]);
      } else {
        setError('Failed to load followers. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="farmer-followers">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading followers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="farmer-followers">
        <div className="followers-header">
          <Link to="/farmer/dashboard" className="back-link">
            <FiArrowLeft /> Back to Dashboard
          </Link>
        </div>
        <div className="followers-content">
          <div className="empty-state">
            <FiUsers className="empty-icon" />
            <h3>Unable to Load Followers</h3>
            <p>{error}</p>
            <button onClick={fetchFollowers} className="retry-btn">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="farmer-followers">
      <div className="followers-header">
        <Link to="/farmer/dashboard" className="back-link">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <div className="header-content">
          <FiUsers className="header-icon" />
          <div>
            <h1>My Followers</h1>
            <p>{followers.length} {followers.length === 1 ? 'person follows' : 'people follow'} you</p>
          </div>
        </div>
      </div>

      <div className="followers-content">
        {followers.length === 0 ? (
          <div className="empty-state">
            <FiUsers className="empty-icon" />
            <h3>No Followers Yet</h3>
            <p>When customers follow you, they'll appear here.</p>
            <p className="tip">Tip: Add quality products and complete your profile to attract more followers!</p>
          </div>
        ) : (
          <div className="followers-grid">
            {followers.map((follower) => (
              <div key={follower.userId} className="follower-card">
                <div className="follower-avatar">
                  {follower.profilePhoto ? (
                    <img 
                      src={follower.profilePhoto} 
                      alt={follower.name || 'Follower'} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="avatar-placeholder" style={{ display: follower.profilePhoto ? 'none' : 'flex' }}>
                    <FiUser />
                  </div>
                </div>
                <div className="follower-info">
                  <span className="follower-name">{follower.name || 'User'}</span>
                  {follower.username && (
                    <span className="follower-username">@{follower.username}</span>
                  )}
                  {follower.followedAt && (
                    <span className="follower-date">Following since {formatDate(follower.followedAt)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerFollowers;
