import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import FarmService from '../services/farmService';
import { toast } from 'react-toastify';
import { 
  FiUser, FiPhone, FiMapPin, FiCamera, FiSave, FiArrowRight, FiArrowLeft,
  FiCheckCircle, FiAlertCircle, FiEdit3, FiUpload, FiX, FiShoppingBag,
  FiTruck, FiAward, FiHeart, FiZap, FiFile, FiFileText, FiTrash2, FiAlertTriangle
} from 'react-icons/fi';
import { FaTractor, FaSeedling, FaIdCard } from 'react-icons/fa';
import './ProfileOnboarding.css';

const ProfileOnboarding = () => {
  const { user, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const farmPhotoInputRef = useRef(null);
  
  // Core states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState('PENDING');
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Image upload states
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [farmPhotoPreview, setFarmPhotoPreview] = useState(null);
  const [uploadingFarmPhoto, setUploadingFarmPhoto] = useState(false);
  
  // Determine user role
  const userRole = user?.roles?.includes('FARMER') ? 'FARMER' 
    : user?.roles?.includes('MANAGER') ? 'MANAGER'
    : user?.roles?.includes('ADMIN') ? 'ADMIN'
    : 'CUSTOMER';

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    age: '',
    profilePhoto: '',
    city: '',
    state: '',
    country: 'India',
    address: '',
    pincode: '',
    // Farmer-specific fields
    farmName: '',
    cropTypes: '',
    farmPhoto: '',
    farmBio: '',
    certificates: '',
    // Verification document (required for farmers)
    verificationDocument: '',
    documentType: 'AADHAAR'
  });

  // Document upload states
  const [documentPreview, setDocumentPreview] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const documentInputRef = useRef(null);

  // Define required fields based on role
  const getRequiredFields = useCallback(() => {
    const baseFields = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    if (userRole === 'FARMER') {
      // Verification document is MANDATORY for farmers
      return [...baseFields, 'farmName', 'farmPhoto', 'verificationDocument'];
    }
    return baseFields;
  }, [userRole]);

  // Check if profile is complete
  const checkProfileCompletion = useCallback((data) => {
    const required = getRequiredFields();
    return required.every(field => data[field] && data[field].toString().trim() !== '');
  }, [getRequiredFields]);

  // Calculate completion percentage
  const calculateCompletion = useCallback(() => {
    const required = getRequiredFields();
    const filled = required.filter(field => formData[field]?.toString().trim()).length;
    return Math.round((filled / required.length) * 100);
  }, [formData, getRequiredFields]);

  // Fetch profile on mount
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
        setProfileStatus(profile.status || 'PENDING');
        const newFormData = {
          name: profile.name || '',
          username: profile.username || '',
          phone: profile.phone || '',
          age: profile.age || '',
          profilePhoto: profile.profilePhoto || '',
          city: profile.city || '',
          state: profile.state || '',
          country: profile.country || 'India',
          address: profile.address || '',
          pincode: profile.pincode || '',
          farmName: profile.farmName || '',
          cropTypes: profile.cropTypes || '',
          farmPhoto: profile.farmPhoto || '',
          farmBio: profile.farmBio || '',
          certificates: profile.certificates || '',
          verificationDocument: profile.verificationDocument || '',
          documentType: profile.documentType || 'AADHAAR'
        };
        setFormData(newFormData);
        
        // Set image preview if exists
        if (profile.profilePhoto) {
          setImagePreview(profile.profilePhoto);
        }
        
        // Set farm photo preview if exists
        if (profile.farmPhoto) {
          setFarmPhotoPreview(profile.farmPhoto);
        }

        // Set document preview if exists
        if (profile.verificationDocument) {
          setDocumentPreview(profile.verificationDocument);
        }
        
        // Check if profile is already complete
        const complete = checkProfileCompletion(newFormData);
        setIsProfileComplete(complete);
        
        // If complete, don't show edit mode by default
        if (complete) {
          setIsEditMode(false);
        } else {
          setIsEditMode(true);
        }
      } else {
        setIsEditMode(true);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setIsEditMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);

    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setFormData(prev => ({ ...prev, profilePhoto: base64String }));
      setUploadingImage(false);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, profilePhoto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle farm photo upload
  const handleFarmPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingFarmPhoto(true);

    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFarmPhotoPreview(base64String);
      setFormData(prev => ({ ...prev, farmPhoto: base64String }));
      setUploadingFarmPhoto(false);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
      setUploadingFarmPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const removeFarmPhoto = () => {
    setFarmPhotoPreview(null);
    setFormData(prev => ({ ...prev, farmPhoto: '' }));
    if (farmPhotoInputRef.current) {
      farmPhotoInputRef.current.value = '';
    }
  };

  // Handle verification document upload
  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type - accept images and PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an image (JPG, PNG) or PDF file');
      return;
    }

    // Validate file size (max 10MB for documents)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Document size should be less than 10MB');
      return;
    }

    setUploadingDocument(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setDocumentPreview(base64String);
      setFormData(prev => ({ ...prev, verificationDocument: base64String }));
      setUploadingDocument(false);
      
      // Show warning if profile was already verified
      if (profileStatus === 'APPROVED') {
        toast.warning('Re-uploading document will reset your verification status to Pending');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read document file');
      setUploadingDocument(false);
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = () => {
    setDocumentPreview(null);
    setFormData(prev => ({ ...prev, verificationDocument: '' }));
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const required = getRequiredFields();
    const missing = required.filter(field => !formData[field]?.toString().trim());
    
    if (missing.length > 0) {
      // Make error message more user-friendly
      const fieldLabels = {
        verificationDocument: 'Verification Document',
        farmName: 'Farm Name',
        farmPhoto: 'Farm Photo'
      };
      const missingLabels = missing.map(f => fieldLabels[f] || f);
      toast.error(`Please fill in all required fields: ${missingLabels.join(', ')}`);
      return;
    }

    // Extra validation for farmers - document is mandatory
    if (userRole === 'FARMER' && !formData.verificationDocument) {
      toast.error('Please upload a verification document (Aadhaar/Government ID/Land proof)');
      return;
    }

    setSaving(true);

    try {
      let endpoint = '/profiles/customer';
      if (userRole === 'FARMER') endpoint = '/profiles/farmer';
      else if (userRole === 'MANAGER') endpoint = '/profiles/manager';

      // Build clean request payload - only send non-empty values
      const payload = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          // Convert age to integer if it's a string
          if (key === 'age' && value) {
            payload[key] = parseInt(value, 10);
          } else {
            payload[key] = value;
          }
        }
      });

      console.log('Sending profile update request:', { endpoint, payload: { ...payload, profilePhoto: payload.profilePhoto ? '[BASE64_IMAGE]' : undefined } });

      const response = await userApi.put(endpoint, payload);
      console.log('Profile update response:', response.data);
      
      // For farmers, call the farm onboarding endpoint to create/update farm in farm-service
      if (userRole === 'FARMER' && formData.farmName) {
        try {
          const farmOnboardingData = {
            farmName: formData.farmName,
            cropTypes: formData.cropTypes || '',
            description: formData.farmBio || '',
            farmImageUrl: formData.farmPhoto || '',
            location: '',
            city: formData.city || '',
            state: formData.state || ''
          };
          
          console.log('Calling farm onboarding endpoint:', { ...farmOnboardingData, farmImageUrl: farmOnboardingData.farmImageUrl ? '[BASE64_IMAGE]' : undefined });
          await FarmService.onboardFarm(farmOnboardingData);
          console.log('Farm onboarding successful');
        } catch (farmErr) {
          console.error('Farm onboarding error:', farmErr);
          // Don't fail the whole process if farm creation fails
          toast.warning('Profile saved, but farm creation had an issue. You can update your farm from the Farms page.');
        }
      }
      
      toast.success('Profile saved successfully! 🎉');
      setIsProfileComplete(true);
      setIsEditMode(false);
      
      // Dispatch event to refresh navbar profile photo
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { profilePhoto: formData.profilePhoto } 
      }));
      
      if (userRole === 'FARMER' || userRole === 'MANAGER') {
        toast.info('Your profile is pending verification.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to save profile';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      // Handle validation errors from backend
      if (err.response?.data?.validationErrors) {
        const validationErrors = err.response.data.validationErrors;
        const errorMessages = [];
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          }
        });
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('; ');
        }
      } else if (err.response?.data?.errors) {
        // Handle other error formats
        const errors = err.response.data.errors;
        if (Array.isArray(errors)) {
          errorMessage = errors.join(', ');
        } else if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleContinueShopping = () => {
    if (userRole === 'CUSTOMER') {
      navigate('/');
    } else {
      navigate(getDashboardRoute());
    }
  };

  // Steps configuration
  const steps = userRole === 'FARMER' 
    ? ['Personal', 'Address', 'Farm'] 
    : ['Personal', 'Address'];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Indian states for dropdown
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
  ];

  // Loading state
  if (loading) {
    return (
      <div className="profile-onboarding">
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Profile Complete View
  if (isProfileComplete && !isEditMode) {
    return (
      <div className="profile-onboarding">
        <div className="profile-complete-container">
          {/* Success Animation */}
          <div className="success-animation">
            <div className="success-circle">
              <FiCheckCircle />
            </div>
            <div className="success-confetti">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`confetti confetti-${i + 1}`}></div>
              ))}
            </div>
          </div>

          {/* Profile Card */}
          <div className="complete-profile-card">
            <div className="profile-header">
              <div className="profile-avatar-large">
                {imagePreview ? (
                  <img src={imagePreview} alt={formData.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="verified-badge">
                  <FiCheckCircle />
                </div>
              </div>
              <h1>{formData.name || 'User'}</h1>
              <p className="profile-role">
                {userRole === 'FARMER' ? '👨‍🌾 Farmer' : '🛒 Customer'}
              </p>
            </div>

            <div className="profile-details-grid">
              <div className="detail-item">
                <FiPhone className="detail-icon" />
                <div>
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{formData.phone || '-'}</span>
                </div>
              </div>
              <div className="detail-item">
                <FiMapPin className="detail-icon" />
                <div>
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{formData.city}, {formData.state}</span>
                </div>
              </div>
              {userRole === 'FARMER' && formData.farmName && (
                <div className="detail-item">
                  <FaTractor className="detail-icon" />
                  <div>
                    <span className="detail-label">Farm</span>
                    <span className="detail-value">{formData.farmName}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="profile-actions">
              <button 
                className="btn-edit-profile"
                onClick={() => setIsEditMode(true)}
              >
                <FiEdit3 /> Edit Profile
              </button>
              <button 
                className="btn-continue"
                onClick={handleContinueShopping}
              >
                {userRole === 'FARMER' ? 'Go to Dashboard' : 'Start Shopping'} <FiArrowRight />
              </button>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="benefits-section">
            <h3>🎉 You're all set! Here's what you can do now:</h3>
            <div className="benefits-grid">
              <div className="benefit-card">
                <FiShoppingBag />
                <span>Shop fresh produce</span>
              </div>
              <div className="benefit-card">
                <FiTruck />
                <span>Fast delivery</span>
              </div>
              <div className="benefit-card">
                <FiAward />
                <span>Earn rewards</span>
              </div>
              <div className="benefit-card">
                <FiHeart />
                <span>Save favorites</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit/Create Profile Form
  return (
    <div className="profile-onboarding">
      <div className="onboarding-wrapper">
        {/* Header */}
        <div className="onboarding-top-bar">
          <Link to="/" className="brand-link">
            <span className="brand-icon">🌾</span>
            <span className="brand-name">AgriLink</span>
          </Link>
          {isProfileComplete && (
            <button 
              className="btn-skip-link"
              onClick={handleContinueShopping}
            >
              Skip for now <FiArrowRight />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="onboarding-content">
          {/* Left: Progress & Info */}
          <div className="onboarding-left">
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Profile Completion</span>
                <span className="progress-value">{calculateCompletion()}%</span>
              </div>
              <div className="progress-bar-track">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${calculateCompletion()}%` }}
                ></div>
              </div>
            </div>

            {/* Step Navigation */}
            <div className="steps-nav">
              {steps.map((stepName, index) => (
                <button
                  key={index}
                  className={`step-nav-item ${currentStep === index ? 'active' : ''} ${currentStep > index ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="step-number">
                    {currentStep > index ? <FiCheckCircle /> : index + 1}
                  </div>
                  <span className="step-name">{stepName}</span>
                </button>
              ))}
            </div>

            {/* Info Cards */}
            <div className="info-cards">
              <div className="info-card">
                <FiZap className="info-icon" />
                <div>
                  <h4>Quick Setup</h4>
                  <p>Takes less than 2 minutes</p>
                </div>
              </div>
              <div className="info-card">
                <FiTruck className="info-icon" />
                <div>
                  <h4>Faster Delivery</h4>
                  <p>Save your address for quick checkout</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="onboarding-right">
            <form onSubmit={handleSubmit} className="profile-form">
              {/* Step 1: Personal Info */}
              {currentStep === 0 && (
                <div className="form-step">
                  <div className="step-header">
                    <h2>Personal Information</h2>
                    <p>Let's get to know you better</p>
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="photo-upload-section">
                    <div className="photo-preview">
                      {uploadingImage ? (
                        <div className="photo-loading">
                          <div className="loading-spinner-small"></div>
                        </div>
                      ) : imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Profile" />
                          <button 
                            type="button" 
                            className="remove-photo-btn"
                            onClick={removeImage}
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <div className="photo-placeholder">
                          <FiUser />
                        </div>
                      )}
                    </div>
                    <div className="photo-actions">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden-input"
                        id="profile-photo-input"
                      />
                      <label htmlFor="profile-photo-input" className="upload-btn">
                        <FiUpload /> Upload Photo
                      </label>
                      <span className="photo-hint">JPG, PNG up to 5MB</span>
                    </div>
                  </div>

                  <div className="form-fields">
                    <div className="field">
                      <label htmlFor="name">
                        Full Name <span className="required">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="phone">
                          Phone Number <span className="required">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-prefix">+91</span>
                          <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="98765 43210"
                            maxLength={10}
                            required
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor="age">Age</label>
                        <input
                          id="age"
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          placeholder="25"
                          min="18"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Address */}
              {currentStep === 1 && (
                <div className="form-step">
                  <div className="step-header">
                    <h2>Delivery Address</h2>
                    <p>Where should we deliver your orders?</p>
                  </div>

                  <div className="form-fields">
                    <div className="field">
                      <label htmlFor="address">
                        Street Address <span className="required">*</span>
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="House/Flat No., Building, Street, Area"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="city">
                          City <span className="required">*</span>
                        </label>
                        <input
                          id="city"
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Mumbai"
                          required
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="pincode">
                          Pincode <span className="required">*</span>
                        </label>
                        <input
                          id="pincode"
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          placeholder="400001"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="state">
                        State <span className="required">*</span>
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select State</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Farm Details (Farmers only) */}
              {currentStep === 2 && userRole === 'FARMER' && (
                <div className="form-step">
                  <div className="step-header">
                    <h2>Farm Details</h2>
                    <p>Tell us about your farm</p>
                  </div>

                  {/* Farm Photo Upload */}
                  <div className="photo-upload-section farm-photo-section">
                    <label className="section-label">
                      Farm Photo <span className="required">*</span>
                    </label>
                    <div className="photo-preview farm-photo-preview">
                      {uploadingFarmPhoto ? (
                        <div className="photo-loading">
                          <div className="loading-spinner-small"></div>
                        </div>
                      ) : farmPhotoPreview ? (
                        <>
                          <img src={farmPhotoPreview} alt="Farm" />
                          <button 
                            type="button" 
                            className="remove-photo-btn"
                            onClick={removeFarmPhoto}
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <div className="photo-placeholder farm-placeholder">
                          <FaTractor />
                          <span>Upload farm photo</span>
                        </div>
                      )}
                    </div>
                    <div className="photo-actions">
                      <input
                        ref={farmPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFarmPhotoUpload}
                        className="hidden-input"
                        id="farm-photo-input"
                      />
                      <label htmlFor="farm-photo-input" className="upload-btn">
                        <FiCamera /> {farmPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      <span className="photo-hint">Show your farm to buyers (JPG, PNG up to 5MB)</span>
                    </div>
                  </div>

                  <div className="form-fields">
                    <div className="field">
                      <label htmlFor="farmName">
                        Farm Name <span className="required">*</span>
                      </label>
                      <input
                        id="farmName"
                        type="text"
                        name="farmName"
                        value={formData.farmName}
                        onChange={handleChange}
                        placeholder="Green Valley Organic Farm"
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="cropTypes">
                        <FaSeedling className="field-icon" /> What do you grow?
                      </label>
                      <input
                        id="cropTypes"
                        type="text"
                        name="cropTypes"
                        value={formData.cropTypes}
                        onChange={handleChange}
                        placeholder="Tomatoes, Rice, Mangoes, etc."
                      />
                      <span className="field-hint">Separate with commas</span>
                    </div>

                    <div className="field">
                      <label htmlFor="farmBio">About Your Farm</label>
                      <textarea
                        id="farmBio"
                        name="farmBio"
                        value={formData.farmBio}
                        onChange={handleChange}
                        placeholder="Tell buyers what makes your farm special..."
                        rows={4}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="certificates">Certifications</label>
                      <input
                        id="certificates"
                        type="text"
                        name="certificates"
                        value={formData.certificates}
                        onChange={handleChange}
                        placeholder="Organic, FSSAI, etc."
                      />
                    </div>
                  </div>

                  {/* Verification Document Upload Section */}
                  <div className="document-upload-section">
                    <h4 className="section-subtitle">
                      <FaIdCard className="field-icon" /> Verification Document <span className="required">*</span>
                    </h4>
                    <p className="section-info">
                      Upload your Aadhaar Card, Government ID, or Land Ownership Proof for verification.
                    </p>
                    
                    {/* Document Type Selector */}
                    <div className="field">
                      <label htmlFor="documentType">Document Type</label>
                      <select
                        id="documentType"
                        name="documentType"
                        value={formData.documentType}
                        onChange={handleChange}
                        className="document-type-select"
                      >
                        <option value="">Select document type...</option>
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="GOV_ID">Government ID (PAN, Voter ID, etc.)</option>
                        <option value="LAND_PROOF">Land Ownership Proof</option>
                        <option value="OTHER">Other Document</option>
                      </select>
                    </div>

                    {/* Document Preview */}
                    <div className="document-preview-container">
                      {documentPreview ? (
                        <div className="document-preview">
                          {documentPreview.endsWith('.pdf') || documentPreview.includes('application/pdf') ? (
                            <div className="pdf-preview">
                              <FiFileText className="pdf-icon" />
                              <span>PDF Document Uploaded</span>
                              <a href={documentPreview} target="_blank" rel="noopener noreferrer" className="view-link">
                                View Document
                              </a>
                            </div>
                          ) : (
                            <img src={documentPreview} alt="Verification Document" className="document-image" />
                          )}
                          <button type="button" className="remove-document-btn" onClick={removeDocument}>
                            <FiTrash2 /> Remove
                          </button>
                        </div>
                      ) : (
                        <div className="document-placeholder">
                          <FiFile className="placeholder-icon" />
                          <span>No document uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div className="document-actions">
                      <input
                        ref={documentInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleDocumentUpload}
                        className="hidden-input"
                        id="document-input"
                        disabled={uploadingDocument}
                      />
                      <label htmlFor="document-input" className={`upload-btn document-upload-btn ${uploadingDocument ? 'uploading' : ''}`}>
                        {uploadingDocument ? (
                          <>
                            <span className="loading-spinner-small"></span> Uploading...
                          </>
                        ) : (
                          <>
                            <FiUpload /> {documentPreview ? 'Change Document' : 'Upload Document'}
                          </>
                        )}
                      </label>
                      <span className="document-hint">PDF or Image (JPG, PNG) up to 10MB</span>
                    </div>

                    {/* Re-verification Warning */}
                    {documentPreview && formData.status === 'APPROVED' && (
                      <div className="reupload-warning">
                        <FiAlertTriangle className="warning-icon" />
                        <span>Re-uploading this document will require admin re-verification. Your verified status will change to PENDING.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                {currentStep > 0 && (
                  <button type="button" className="btn-back" onClick={prevStep}>
                    <FiArrowLeft /> Back
                  </button>
                )}
                
                <div className="actions-right">
                  {currentStep < steps.length - 1 ? (
                    <button type="button" className="btn-next" onClick={nextStep}>
                      Continue <FiArrowRight />
                    </button>
                  ) : (
                    <button type="submit" className="btn-save" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="loading-spinner-small"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave /> Save Profile
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOnboarding;
