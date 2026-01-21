import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit2, FiSave, FiX, FiHeart, FiUsers } from 'react-icons/fi';
import { userApi, authApi } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [followedFarmers, setFollowedFarmers] = useState([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    bio: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchFollowedFarmers();
  }, []);

  const fetchFollowedFarmers = async () => {
    // Only fetch for customers/buyers, not farmers
    if (user?.roles?.includes('FARMER')) return;
    
    try {
      setLoadingFollowed(true);
      
      // Get followed farmer IDs
      const followedResponse = await userApi.get('/farmers/followed');
      const followedData = followedResponse?.data?.data || [];
      
      if (followedData.length === 0) {
        setFollowedFarmers([]);
        return;
      }
      
      // Get farmer details from auth-service
      const authResponse = await authApi.get('/auth/farmers');
      const allFarmers = authResponse?.data?.data || [];
      
      // Map followed farmer IDs to farmer details
      const enrichedFarmers = followedData.map(follow => {
        const farmer = allFarmers.find(f => f.id === follow.farmerId);
        return {
          ...follow,
          farmerName: farmer?.email?.split('@')[0] || 'Farmer',
          farmerEmail: farmer?.email
        };
      });
      
      setFollowedFarmers(enrichedFarmers);
    } catch (err) {
      console.warn('Could not fetch followed farmers:', err);
    } finally {
      setLoadingFollowed(false);
    }
  };

  const handleUnfollow = async (farmerId) => {
    try {
      await userApi.delete(`/farmers/${farmerId}/follow`);
      setFollowedFarmers(prev => prev.filter(f => f.farmerId !== farmerId));
    } catch (err) {
      console.error('Error unfollowing farmer:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userApi.get('/users/profile');
      const profileData = response.data?.data || response.data;
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        dateOfBirth: profileData.dateOfBirth || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        country: profileData.country || '',
        postalCode: profileData.postalCode || '',
        bio: profileData.bio || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await userApi.put('/users/profile', formData);
      const updatedProfile = response.data?.data || response.data;
      setProfile(updatedProfile);
      setEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      dateOfBirth: profile?.dateOfBirth || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || '',
      postalCode: profile?.postalCode || '',
      bio: profile?.bio || ''
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!editing && (
          <button className="edit-btn" onClick={() => setEditing(true)}>
            <FiEdit2 /> Edit Profile
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-content">
        {/* Profile Avatar Section */}
        <div className="profile-avatar-section">
          <div className="avatar-large">
            {profile?.firstName ? profile.firstName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <h2>{profile?.fullName || user?.email?.split('@')[0]}</h2>
          <p className="email">{user?.email}</p>
          <div className="role-badges">
            {user?.roles?.map((role, index) => (
              <span key={index} className="role-badge">{role}</span>
            ))}
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="profile-details">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3><FiUser /> Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label><FiCalendar /> Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </div>

            <div className="form-section">
              <h3><FiMapPin /> Address</h3>
              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter street address"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>State/Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Country"
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Postal code"
                  />
                </div>
              </div>
            </div>

            {editing && (
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={cancelEdit}>
                  <FiX /> Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Followed Farmers Section - Only for Customers */}
        {!user?.roles?.includes('FARMER') && (
          <div className="followed-farmers-section">
            <h3><FiHeart /> Followed Farmers</h3>
            {loadingFollowed ? (
              <p className="loading-text">Loading followed farmers...</p>
            ) : followedFarmers.length === 0 ? (
              <div className="no-followed">
                <FiUsers size={32} />
                <p>You're not following any farmers yet.</p>
                <Link to="/farmers" className="browse-farmers-btn">Browse Farmers</Link>
              </div>
            ) : (
              <div className="followed-farmers-list">
                {followedFarmers.map(follow => (
                  <div key={follow.id} className="followed-farmer-card">
                    <div className="farmer-info">
                      <div className="farmer-avatar-small">
                        {follow.farmerName?.charAt(0).toUpperCase() || 'F'}
                      </div>
                      <div className="farmer-details">
                        <Link to={`/farmers/${follow.farmerId}`} className="farmer-name-link">
                          {follow.farmerName}
                        </Link>
                        <span className="followed-date">
                          Followed {new Date(follow.followedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="unfollow-btn"
                      onClick={() => handleUnfollow(follow.farmerId)}
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
