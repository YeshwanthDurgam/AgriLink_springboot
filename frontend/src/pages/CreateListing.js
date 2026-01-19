import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUpload, FiX, FiPlus, FiCheck, FiDollarSign, FiPackage, FiTag, FiMapPin } from 'react-icons/fi';
import marketplaceService from '../services/marketplaceService';
import './CreateListing.css';

const CreateListing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageUrls, setImageUrls] = useState(['']);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    cropType: '',
    quantity: '',
    quantityUnit: 'KG',
    pricePerUnit: '',
    currency: 'INR',
    minimumOrder: '',
    location: '',
    organicCertified: false,
    qualityGrade: 'A',
    harvestDate: '',
    expiryDate: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await marketplaceService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      setCategories([
        { id: '1', name: 'Vegetables' },
        { id: '2', name: 'Fruits' },
        { id: '3', name: 'Grains' },
        { id: '4', name: 'Dairy' },
        { id: '5', name: 'Organic' }
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const addImageUrl = () => {
    if (imageUrls.length < 5) {
      setImageUrls([...imageUrls, '']);
    }
  };

  const removeImageUrl = (index) => {
    if (imageUrls.length > 1) {
      const newUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newUrls);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Product name is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) {
      newErrors.pricePerUnit = 'Valid price is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    // Validate at least one image URL
    const validImages = imageUrls.filter(url => url.trim());
    if (validImages.length === 0) {
      newErrors.images = 'At least one product image URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const validImageUrls = imageUrls.filter(url => url.trim());
      
      const listingData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        minimumOrder: formData.minimumOrder ? parseFloat(formData.minimumOrder) : 1,
        imageUrls: validImageUrls
      };

      const result = await marketplaceService.createListing(listingData);
      
      // Publish the listing immediately
      if (result && result.id) {
        try {
          await marketplaceService.publishListing(result.id);
          toast.success('Product created and published successfully!');
        } catch (publishErr) {
          toast.success('Product created! You can publish it from your products page.');
        }
      } else {
        toast.success('Product created successfully!');
      }
      
      navigate('/farmer/dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(error.response?.data?.message || 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quantityUnits = ['KG', 'LB', 'GRAM', 'LITER', 'DOZEN', 'PIECE', 'BOX', 'BUNCH'];
  const qualityGrades = ['A+', 'A', 'B', 'Premium', 'Standard'];

  return (
    <div className="create-listing-page">
      <div className="create-listing-container">
        <div className="page-header">
          <h1><FiPlus /> Add New Product</h1>
          <p>Create a new listing to sell your farm products</p>
        </div>

        <form onSubmit={handleSubmit} className="listing-form">
          {/* Basic Information */}
          <section className="form-section">
            <h2><FiTag /> Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="title">Product Name *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Fresh Organic Tomatoes"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="categoryId">Category *</label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className={errors.categoryId ? 'error' : ''}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="cropType">Crop/Product Type</label>
                <input
                  type="text"
                  id="cropType"
                  name="cropType"
                  value={formData.cropType}
                  onChange={handleChange}
                  placeholder="e.g., Tomato, Rice, Milk"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product in detail - quality, origin, growing methods, etc."
                rows={4}
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>
          </section>

          {/* Pricing & Quantity */}
          <section className="form-section">
            <h2><FiDollarSign /> Pricing & Quantity</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Available Quantity *</label>
                <div className="input-with-addon">
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="100"
                    min="0"
                    step="0.01"
                    className={errors.quantity ? 'error' : ''}
                  />
                  <select
                    name="quantityUnit"
                    value={formData.quantityUnit}
                    onChange={handleChange}
                  >
                    {quantityUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="pricePerUnit">Price per Unit *</label>
                <div className="input-with-addon">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    id="pricePerUnit"
                    name="pricePerUnit"
                    value={formData.pricePerUnit}
                    onChange={handleChange}
                    placeholder="5.00"
                    min="0"
                    step="0.01"
                    className={errors.pricePerUnit ? 'error' : ''}
                  />
                </div>
                {errors.pricePerUnit && <span className="error-message">{errors.pricePerUnit}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minimumOrder">Minimum Order</label>
                <input
                  type="number"
                  id="minimumOrder"
                  name="minimumOrder"
                  value={formData.minimumOrder}
                  onChange={handleChange}
                  placeholder="1"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="qualityGrade">Quality Grade</label>
                <select
                  id="qualityGrade"
                  name="qualityGrade"
                  value={formData.qualityGrade}
                  onChange={handleChange}
                >
                  {qualityGrades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Product Details */}
          <section className="form-section">
            <h2><FiPackage /> Product Details</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="harvestDate">Harvest Date</label>
                <input
                  type="date"
                  id="harvestDate"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="expiryDate">Best Before / Expiry</label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="organicCertified"
                  checked={formData.organicCertified}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                <span>Organic Certified</span>
              </label>
              <p className="hint-text">Check if your product has organic certification</p>
            </div>
          </section>

          {/* Location */}
          <section className="form-section">
            <h2><FiMapPin /> Location</h2>
            
            <div className="form-group">
              <label htmlFor="location">Farm/Product Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Green Valley Farm, California"
              />
            </div>
          </section>

          {/* Product Images */}
          <section className="form-section">
            <h2><FiUpload /> Product Images</h2>
            <p className="section-hint">Add image URLs for your product (Unsplash, Imgur, or direct links)</p>
            
            {imageUrls.map((url, index) => (
              <div key={index} className="image-url-row">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className={index === 0 && errors.images ? 'error' : ''}
                />
                {url && (
                  <div className="image-preview">
                    <img src={url} alt={`Preview ${index + 1}`} onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
                {imageUrls.length > 1 && (
                  <button type="button" className="remove-btn" onClick={() => removeImageUrl(index)}>
                    <FiX />
                  </button>
                )}
              </div>
            ))}
            {errors.images && <span className="error-message">{errors.images}</span>}
            
            {imageUrls.length < 5 && (
              <button type="button" className="add-image-btn" onClick={addImageUrl}>
                <FiPlus /> Add Another Image
              </button>
            )}
          </section>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/farmer/dashboard')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : <><FiCheck /> Create Product</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
