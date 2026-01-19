import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import marketplaceService from '../services/marketplaceService';
import './CreateListing.css'; // Reuse same styles

const EditListing = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageUrls, setImageUrls] = useState(['']);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    quantity: '',
    unit: 'kg',
    isOrganic: false,
    harvestDate: '',
    expiryDate: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch categories and listing in parallel
      const [categoriesData, listingData] = await Promise.all([
        marketplaceService.getCategories(),
        marketplaceService.getListingById(id)
      ]);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.content || []);
      
      // Populate form with existing data
      const listing = listingData;
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        categoryId: listing.categoryId || listing.category?.id || '',
        price: listing.price?.toString() || '',
        quantity: listing.quantity?.toString() || '',
        unit: listing.unit || 'kg',
        isOrganic: listing.isOrganic || listing.organic || false,
        harvestDate: listing.harvestDate ? listing.harvestDate.split('T')[0] : '',
        expiryDate: listing.expiryDate ? listing.expiryDate.split('T')[0] : ''
      });
      
      // Handle images
      const images = listing.images || (listing.imageUrl ? [listing.imageUrl] : ['']);
      setImageUrls(images.length > 0 ? images : ['']);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load product details');
      navigate('/farmer/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when field is updated
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
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Product title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setSaving(true);
      
      // Filter out empty image URLs
      const validImages = imageUrls.filter(url => url.trim() !== '');
      
      const listingData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        categoryId: formData.categoryId,
        images: validImages,
        imageUrl: validImages[0] || null
      };

      await marketplaceService.updateListing(id, listingData);
      toast.success('Product updated successfully!');
      navigate('/farmer/products');
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="create-listing">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-listing">
      <div className="create-listing-container">
        <div className="page-header">
          <h1>Edit Product</h1>
          <p>Update your product listing details</p>
        </div>

        <form onSubmit={handleSubmit} className="listing-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="title">Product Title *</label>
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
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product in detail..."
                rows="4"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>
          </div>

          {/* Pricing & Quantity */}
          <div className="form-section">
            <h2>Pricing & Quantity</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price (₹) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  className={errors.quantity ? 'error' : ''}
                />
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="unit">Unit</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="piece">Piece</option>
                  <option value="dozen">Dozen</option>
                  <option value="bunch">Bunch</option>
                  <option value="liter">Liter</option>
                  <option value="quintal">Quintal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h2>Product Images</h2>
            <p className="section-description">Add image URLs for your product (max 5)</p>
            
            <div className="image-urls-container">
              {imageUrls.map((url, index) => (
                <div key={index} className="image-url-row">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="image-url-input"
                  />
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="remove-url-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {imageUrls.length < 5 && (
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="add-url-btn"
                >
                  + Add Another Image
                </button>
              )}
            </div>

            {/* Image Preview */}
            {imageUrls.some(url => url.trim()) && (
              <div className="image-preview-grid">
                {imageUrls.filter(url => url.trim()).map((url, index) => (
                  <div key={index} className="image-preview">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`}
                      onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL'}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="form-section">
            <h2>Additional Details</h2>
            
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
                <label htmlFor="expiryDate">Expiry Date</label>
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
                  name="isOrganic"
                  checked={formData.isOrganic}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                This is an organic product
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/farmer/products')}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-submit"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListing;
