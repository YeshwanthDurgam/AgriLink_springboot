import React, { useState, useEffect } from 'react';
import marketplaceService from '../services/marketplaceService';
import './SearchFilters.css';

const SearchFilters = ({ filters, onFilterChange, onSearch, onClear }) => {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({
    category: true,
    price: true,
    quality: false,
    organic: false,
    rating: false
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await marketplaceService.getCategories();
      if (response?.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const qualityGrades = ['Premium', 'Grade A', 'Grade B', 'Standard'];

  return (
    <div className="search-filters">
      <div className="filters-header">
        <h3>Filters</h3>
        <button className="clear-btn" onClick={onClear}>Clear All</button>
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('category')}>
          <span>Category</span>
          <span className={`arrow ${expanded.category ? 'up' : 'down'}`}>▼</span>
        </div>
        {expanded.category && (
          <div className="section-content">
            <div className="category-list">
              <label className="checkbox-item">
                <input
                  type="radio"
                  name="category"
                  checked={!filters.categoryId}
                  onChange={() => handleFilterChange('categoryId', null)}
                />
                <span>All Categories</span>
              </label>
              {categories.map(cat => (
                <label key={cat.id} className="checkbox-item">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.categoryId === cat.id}
                    onChange={() => handleFilterChange('categoryId', cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('price')}>
          <span>Price Range</span>
          <span className={`arrow ${expanded.price ? 'up' : 'down'}`}>▼</span>
        </div>
        {expanded.price && (
          <div className="section-content">
            <div className="price-inputs">
              <div className="price-input">
                <label>Min</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value || null)}
                  min="0"
                />
              </div>
              <span className="price-separator">-</span>
              <div className="price-input">
                <label>Max</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value || null)}
                  min="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quality Grade Filter */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('quality')}>
          <span>Quality Grade</span>
          <span className={`arrow ${expanded.quality ? 'up' : 'down'}`}>▼</span>
        </div>
        {expanded.quality && (
          <div className="section-content">
            <div className="checkbox-list">
              {qualityGrades.map(grade => (
                <label key={grade} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.qualityGrades?.includes(grade) || false}
                    onChange={(e) => {
                      const current = filters.qualityGrades || [];
                      const updated = e.target.checked
                        ? [...current, grade]
                        : current.filter(g => g !== grade);
                      handleFilterChange('qualityGrades', updated.length ? updated : null);
                    }}
                  />
                  <span>{grade}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Organic Filter */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('organic')}>
          <span>Certifications</span>
          <span className={`arrow ${expanded.organic ? 'up' : 'down'}`}>▼</span>
        </div>
        {expanded.organic && (
          <div className="section-content">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={filters.organicOnly || false}
                onChange={(e) => handleFilterChange('organicOnly', e.target.checked || null)}
              />
              <span>🌿 Organic Certified Only</span>
            </label>
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('rating')}>
          <span>Minimum Rating</span>
          <span className={`arrow ${expanded.rating ? 'up' : 'down'}`}>▼</span>
        </div>
        {expanded.rating && (
          <div className="section-content">
            <div className="rating-options">
              {[4, 3, 2, 1].map(rating => (
                <label key={rating} className="radio-item">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === rating}
                    onChange={() => handleFilterChange('minRating', rating)}
                  />
                  <span className="star-rating">
                    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                  </span>
                  <span>& Up</span>
                </label>
              ))}
              <label className="radio-item">
                <input
                  type="radio"
                  name="rating"
                  checked={!filters.minRating}
                  onChange={() => handleFilterChange('minRating', null)}
                />
                <span>Any Rating</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Location Filter */}
      <div className="filter-section">
        <div className="section-header">
          <span>Location</span>
        </div>
        <div className="section-content">
          <input
            type="text"
            className="location-input"
            placeholder="Enter location..."
            value={filters.location || ''}
            onChange={(e) => handleFilterChange('location', e.target.value || null)}
          />
        </div>
      </div>

      {/* Additional Filters */}
      <div className="filter-section">
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={filters.hasImages || false}
            onChange={(e) => handleFilterChange('hasImages', e.target.checked || null)}
          />
          <span>📷 Has Photos</span>
        </label>
      </div>

      <button className="apply-btn" onClick={onSearch}>
        Apply Filters
      </button>
    </div>
  );
};

export default SearchFilters;
