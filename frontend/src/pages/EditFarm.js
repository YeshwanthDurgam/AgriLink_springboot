import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiArrowLeft, FiSave, FiCamera, FiX, FiMapPin, FiPhone,
  FiUpload, FiLoader
} from 'react-icons/fi';
import { FaTractor, FaSeedling } from 'react-icons/fa';
import FarmService from '../services/farmService';
import './EditFarm.css';

const EditFarm = () => {
  const { id: farmId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    cropTypes: '',
    description: '',
    location: '',
    farmImageUrl: '',
    totalArea: '',
    areaUnit: 'HECTARE',
    latitude: '',
    longitude: ''
  });

  // Fetch farm data on mount
  useEffect(() => {
    const fetchFarm = async () => {
      if (!farmId) {
        setError('Farm ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('[EditFarm] Fetching farm:', farmId);
        
        const response = await FarmService.getFarmById(farmId);
        console.log('[EditFarm] Farm data received:', response);

        const farm = response.data || response;
        
        if (!farm) {
          throw new Error('Farm not found');
        }

        // Pre-fill form with backend data
        setFormData({
          name: farm.name || '',
          cropTypes: farm.cropTypes || '',
          description: farm.description || '',
          location: farm.location || '',
          farmImageUrl: farm.farmImageUrl || '',
          totalArea: farm.totalArea || '',
          areaUnit: farm.areaUnit || 'HECTARE',
          latitude: farm.latitude || '',
          longitude: farm.longitude || ''
        });

        // Set image preview
        if (farm.farmImageUrl) {
          setImagePreview(farm.farmImageUrl);
        }

        console.log('[EditFarm] Form pre-filled successfully');
      } catch (err) {
        console.error('[EditFarm] Error fetching farm:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load farm details');
        toast.error('Failed to load farm details');
      } finally {
        setLoading(false);
      }
    };

    fetchFarm();
  }, [farmId]);

  // Handle input changes
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

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setFormData(prev => ({ ...prev, farmImageUrl: base64String }));
      setUploadingImage(false);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, farmImageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name?.trim()) {
      toast.error('Farm name is required');
      return;
    }

    if (!formData.cropTypes?.trim()) {
      toast.error('Crop types are required');
      return;
    }

    if (!formData.farmImageUrl) {
      toast.error('Farm image is required');
      return;
    }

    setSaving(true);

    try {
      // Prepare payload matching CreateFarmRequest DTO
      const payload = {
        name: formData.name.trim(),
        cropTypes: formData.cropTypes.trim(),
        description: formData.description?.trim() || '',
        location: formData.location?.trim() || '',
        farmImageUrl: formData.farmImageUrl,
        totalArea: formData.totalArea ? parseFloat(formData.totalArea) : null,
        areaUnit: formData.areaUnit || 'HECTARE',
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      console.log('[EditFarm] Updating farm:', farmId, {
        ...payload,
        farmImageUrl: payload.farmImageUrl ? '[BASE64_IMAGE]' : '[NO_IMAGE]'
      });

      const response = await FarmService.updateFarm(farmId, payload);
      console.log('[EditFarm] Update successful:', response);

      toast.success('Farm updated successfully! 🎉');
      
      // Navigate back to farm detail page
      navigate(`/farms/${farmId}`);
    } catch (err) {
      console.error('[EditFarm] Error updating farm:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update farm';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="edit-farm-page">
          <div className="loading-container">
            <FiLoader className="spinner" />
            <p>Loading farm details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <div className="edit-farm-page">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <Link to="/farms" className="btn btn-primary">
              Back to My Farms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="edit-farm-page">
        {/* Header */}
        <div className="page-header">
          <Link to={`/farms/${farmId}`} className="back-link">
            <FiArrowLeft />
            Back to Farm
          </Link>
          <h1>
            <FaTractor className="header-icon" />
            Edit Farm
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-farm-form">
          {/* Farm Image Section */}
          <div className="form-section">
            <h2>Farm Photo</h2>
            <div className="image-upload-section">
              <div className="image-preview-container">
                {uploadingImage ? (
                  <div className="image-loading">
                    <FiLoader className="spinner" />
                  </div>
                ) : imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Farm" className="farm-image-preview" />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={removeImage}
                    >
                      <FiX />
                    </button>
                  </>
                ) : (
                  <div className="image-placeholder">
                    <FaTractor />
                    <span>No farm image</span>
                  </div>
                )}
              </div>
              <div className="image-upload-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden-input"
                  id="farm-image-input"
                />
                <label htmlFor="farm-image-input" className="btn btn-outline">
                  <FiCamera /> {imagePreview ? 'Change Photo' : 'Upload Photo'}
                </label>
                <p className="upload-hint">JPG, PNG up to 5MB. Required.</p>
              </div>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="name">
                Farm Name <span className="required">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter farm name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cropTypes">
                <FaSeedling className="label-icon" />
                Crop Types <span className="required">*</span>
              </label>
              <input
                id="cropTypes"
                type="text"
                name="cropTypes"
                value={formData.cropTypes}
                onChange={handleChange}
                placeholder="e.g., Rice, Wheat, Vegetables"
                required
              />
              <span className="field-hint">Separate multiple crops with commas</span>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell customers about your farm..."
                rows={4}
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="form-section">
            <h2>
              <FiMapPin className="section-icon" />
              Location
            </h2>
            
            <div className="form-group">
              <label htmlFor="location">Address / Location</label>
              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Village Name, District, State"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">Latitude</label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g., 17.3850"
                />
              </div>
              <div className="form-group">
                <label htmlFor="longitude">Longitude</label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., 78.4867"
                />
              </div>
            </div>
          </div>

          {/* Farm Size Section */}
          <div className="form-section">
            <h2>Farm Size</h2>
            
            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="totalArea">Total Area</label>
                <input
                  id="totalArea"
                  type="number"
                  step="0.01"
                  min="0"
                  name="totalArea"
                  value={formData.totalArea}
                  onChange={handleChange}
                  placeholder="e.g., 10.5"
                />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="areaUnit">Unit</label>
                <select
                  id="areaUnit"
                  name="areaUnit"
                  value={formData.areaUnit}
                  onChange={handleChange}
                >
                  <option value="HECTARE">Hectares</option>
                  <option value="ACRE">Acres</option>
                  <option value="SQFT">Square Feet</option>
                  <option value="SQMT">Square Meters</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Link to={`/farms/${farmId}`} className="btn btn-outline">
              Cancel
            </Link>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <FiLoader className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFarm;
