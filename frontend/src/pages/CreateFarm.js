import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import FarmService from '../services/farmService';
import './CreateFarm.css';

const CreateFarm = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    size: '',
    description: '',
    farmType: 'CROP',
    soilType: '',
    waterSource: '',
  });

  const farmTypes = [
    { value: 'CROP', label: 'Crop Farming' },
    { value: 'LIVESTOCK', label: 'Livestock' },
    { value: 'MIXED', label: 'Mixed Farming' },
    { value: 'ORGANIC', label: 'Organic' },
    { value: 'DAIRY', label: 'Dairy' },
    { value: 'POULTRY', label: 'Poultry' },
  ];

  const soilTypes = [
    { value: '', label: 'Select soil type' },
    { value: 'CLAY', label: 'Clay' },
    { value: 'SANDY', label: 'Sandy' },
    { value: 'LOAMY', label: 'Loamy' },
    { value: 'SILT', label: 'Silt' },
    { value: 'PEAT', label: 'Peat' },
    { value: 'CHALKY', label: 'Chalky' },
  ];

  const waterSources = [
    { value: '', label: 'Select water source' },
    { value: 'WELL', label: 'Well' },
    { value: 'RIVER', label: 'River' },
    { value: 'CANAL', label: 'Canal' },
    { value: 'RAINWATER', label: 'Rainwater' },
    { value: 'BOREWELL', label: 'Borewell' },
    { value: 'MUNICIPAL', label: 'Municipal Supply' },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Farm name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Farm name must be at least 3 characters';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.size && (isNaN(formData.size) || parseFloat(formData.size) <= 0)) {
      newErrors.size = 'Size must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const farmData = {
        name: formData.name,
        description: formData.description || '',
        location: formData.location,
        totalArea: formData.size ? parseFloat(formData.size) : null,
        areaUnit: 'ACRE'
      };
      
      const response = await FarmService.createFarm(farmData);
      
      if (response.success) {
        toast.success('Farm created successfully!');
        navigate(`/farms/${response.data.id}`);
      } else {
        toast.error(response.message || 'Failed to create farm');
      }
    } catch (error) {
      console.error('Error creating farm:', error);
      if (error.response?.data?.validationErrors) {
        setErrors(error.response.data.validationErrors);
      }
      toast.error(error.response?.data?.message || 'Failed to create farm. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="create-farm-page">
        {/* Back Button */}
        <Link to="/farms" className="back-link">
          <FiArrowLeft />
          Back to Farms
        </Link>

        <div className="form-container">
          <div className="form-header">
            <h1>Add New Farm</h1>
            <p>Enter the details of your farm to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="create-form">
            {/* Basic Info */}
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-group">
                <label htmlFor="name">Farm Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter farm name"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter location (city, state)"
                    className={errors.location ? 'error' : ''}
                  />
                  {errors.location && <span className="error-message">{errors.location}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="size">Size (acres)</label>
                  <input
                    type="number"
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    placeholder="Farm size in acres"
                    step="0.1"
                    min="0"
                    className={errors.size ? 'error' : ''}
                  />
                  {errors.size && <span className="error-message">{errors.size}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="farmType">Farm Type</label>
                <select
                  id="farmType"
                  name="farmType"
                  value={formData.farmType}
                  onChange={handleChange}
                >
                  {farmTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your farm (optional)"
                  rows="4"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="form-section">
              <h2>Additional Details</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="soilType">Soil Type</label>
                  <select
                    id="soilType"
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                  >
                    {soilTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="waterSource">Water Source</label>
                  <select
                    id="waterSource"
                    name="waterSource"
                    value={formData.waterSource}
                    onChange={handleChange}
                  >
                    {waterSources.map(source => (
                      <option key={source.value} value={source.value}>{source.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <Link to="/farms" className="btn btn-outline">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <FiSave />
                {submitting ? 'Creating...' : 'Create Farm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateFarm;
