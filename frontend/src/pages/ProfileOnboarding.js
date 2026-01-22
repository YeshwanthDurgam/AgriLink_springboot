import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import FarmService from '../services/farmService';
import { toast } from 'react-toastify';
import { 
  FiUser, FiPhone, FiMapPin, FiCamera, FiSave, FiSkipForward,
  FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import { FaTractor, FaSeedling } from 'react-icons/fa';
import './ProfileOnboarding.css';

const ProfileOnboarding = () => {
  const { user, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState('PENDING');
  const [step, setStep] = useState(1);
  
  // Determine user role
  const userRole = user?.roles?.includes('FARMER') ? 'FARMER' 
    : user?.roles?.includes('MANAGER') ? 'MANAGER'
    : user?.roles?.includes('ADMIN') ? 'ADMIN'
    : 'CUSTOMER';

  const totalSteps = userRole === 'FARMER' ? 3 : 2;

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    age: '',
    profilePhoto: '',
    city: '',
    state: '',
    country: '',
    // Farmer-specific fields
    farmName: '',
    cropTypes: '',
    farmPhoto: '',
    farmBio: '',
    certificates: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let endpoint = '/profiles/customer';
      if (userRole === 'FARMER') endpoint = '/profiles/farmer';
      else if (userRole === 'MANAGER') endpoint = '/profiles/manager';

      const response = await userApi.get(endpoint);
      const profile = response.data?.data;
      
      if (profile) {
        setProfileStatus(profile.status);
        setFormData({
          name: profile.name || '',
          username: profile.username || '',
          phone: profile.phone || '',
          age: profile.age || '',
          profilePhoto: profile.profilePhoto || '',
          city: profile.city || '',
          state: profile.state || '',
          country: profile.country || '',
          farmName: profile.farmName || '',
          cropTypes: profile.cropTypes || '',
          farmPhoto: profile.farmPhoto || '',
          farmBio: profile.farmBio || '',
          certificates: profile.certificates || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
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

    try {
      let endpoint = '/profiles/customer';
      if (userRole === 'FARMER') endpoint = '/profiles/farmer';
      else if (userRole === 'MANAGER') endpoint = '/profiles/manager';

      await userApi.put(endpoint, formData);
      
      // For farmers, also create a farm in farm-service if farmName is provided
      if (userRole === 'FARMER' && formData.farmName) {
        try {
          // Check if farm already exists
          const farmsResponse = await FarmService.getMyFarms();
          const existingFarms = farmsResponse?.data || [];
          
          // Only create if no farm exists
          if (existingFarms.length === 0) {
            const farmData = {
              name: formData.farmName,
              description: formData.farmBio || '',
              location: formData.city && formData.state 
                ? `${formData.city}, ${formData.state}` 
                : formData.city || formData.state || '',
              totalArea: 0,
              areaUnit: 'HECTARE'
            };
            await FarmService.createFarm(farmData);
            console.log('Farm created successfully from profile onboarding');
          } else {
            console.log('Farm already exists, skipping creation');
          }
        } catch (farmErr) {
          console.error('Could not create farm entry:', farmErr);
          // Don't fail the whole operation if farm creation fails
        }
      }
      
      toast.success('Profile saved successfully!');
      
      if (userRole === 'FARMER' || userRole === 'MANAGER') {
        toast.info('Your profile is pending verification. You will be notified once approved.');
      }
      
      navigate(getDashboardRoute());
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    toast.warning('Profile incomplete. Some features will be disabled until you complete your profile.');
    navigate(getDashboardRoute());
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (loading) {
    return (
      <div className="onboarding-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Header */}
        <div className="onboarding-header">
          <h1>Complete Your Profile</h1>
          <p>
            {userRole === 'FARMER' 
              ? 'Set up your farmer profile to start selling on AgriLink'
              : userRole === 'MANAGER'
              ? 'Complete your manager profile for verification'
              : 'Complete your profile to get started'
            }
          </p>
          
          {/* Progress */}
          <div className="progress-bar">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div 
                key={i} 
                className={`progress-step ${step > i ? 'completed' : step === i + 1 ? 'active' : ''}`}
              >
                <div className="step-circle">{i + 1}</div>
                <span className="step-label">
                  {i === 0 ? 'Basic Info' : i === 1 ? 'Address' : 'Farm Details'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Banner */}
        {profileStatus === 'PENDING' && (userRole === 'FARMER' || userRole === 'MANAGER') && (
          <div className="status-banner pending">
            <FiAlertCircle />
            <span>Your profile is pending verification</span>
          </div>
        )}
        {profileStatus === 'APPROVED' && (
          <div className="status-banner approved">
            <FiCheckCircle />
            <span>Your profile is verified!</span>
          </div>
        )}
        {profileStatus === 'REJECTED' && (
          <div className="status-banner rejected">
            <FiAlertCircle />
            <span>Your profile was rejected. Please update and resubmit.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="form-step">
              <h2><FiUser /> Basic Information</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <div className="input-with-icon">
                    <FiPhone className="field-icon" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Your age"
                    min="18"
                    max="120"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Profile Photo URL</label>
                  <div className="input-with-icon">
                    <FiCamera className="field-icon" />
                    <input
                      type="url"
                      name="profilePhoto"
                      value={formData.profilePhoto}
                      onChange={handleChange}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="form-step">
              <h2><FiMapPin /> Address Information</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Your city"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>State/Province *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Your state"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Your country"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Farm Details (Farmers only) */}
          {step === 3 && userRole === 'FARMER' && (
            <div className="form-step">
              <h2><FaTractor /> Farm Details</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Farm Name *</label>
                  <input
                    type="text"
                    name="farmName"
                    value={formData.farmName}
                    onChange={handleChange}
                    placeholder="Name of your farm"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Crop Types</label>
                  <div className="input-with-icon">
                    <FaSeedling className="field-icon" />
                    <input
                      type="text"
                      name="cropTypes"
                      value={formData.cropTypes}
                      onChange={handleChange}
                      placeholder="e.g., Rice, Wheat, Vegetables"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Farm Photo URL</label>
                  <input
                    type="url"
                    name="farmPhoto"
                    value={formData.farmPhoto}
                    onChange={handleChange}
                    placeholder="https://example.com/farm.jpg"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Farm Bio</label>
                  <textarea
                    name="farmBio"
                    value={formData.farmBio}
                    onChange={handleChange}
                    placeholder="Tell us about your farm..."
                    rows={4}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Certificates (Optional)</label>
                  <textarea
                    name="certificates"
                    value={formData.certificates}
                    onChange={handleChange}
                    placeholder="List any certifications (Organic, Fair Trade, etc.)"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-actions">
            {step > 1 && (
              <button type="button" className="btn-secondary" onClick={prevStep}>
                Previous
              </button>
            )}
            
            {step < totalSteps ? (
              <button type="button" className="btn-primary" onClick={nextStep}>
                Next
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            )}
          </div>
        </form>

        {/* Skip Option */}
        <div className="skip-section">
          <button type="button" className="btn-skip" onClick={handleSkip}>
            <FiSkipForward /> Skip for now
          </button>
          <p className="skip-note">
            {userRole === 'FARMER' 
              ? 'You can browse your dashboard, but business features will be disabled until verified.'
              : 'Some features may be limited without a complete profile.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileOnboarding;
