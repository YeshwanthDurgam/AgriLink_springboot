import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar, FiHeart, FiMessageSquare, FiFilter, FiChevronDown, FiUsers, FiPackage, FiAward, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Farmers.css';

const Farmers = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [followedFarmers, setFollowedFarmers] = useState([]);

  const locations = ['All Locations', 'Maharashtra', 'Punjab', 'Karnataka', 'Gujarat', 'Rajasthan', 'Tamil Nadu'];
  const categories = ['All Categories', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Organic', 'Spices'];

  useEffect(() => {
    fetchFarmers();
  }, [sortBy, filterLocation, filterCategory]);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      // Fetch real farmers data from marketplace service sellers endpoint
      const response = await api.get('/marketplace-service/api/v1/listings/sellers');

      if (response?.data?.data && Array.isArray(response.data.data)) {
        setFarmers(response.data.data);
      } else if (response?.data && Array.isArray(response.data)) {
        setFarmers(response.data);
      } else {
        console.warn('No farmers data returned from API');
        setFarmers([]);
      }
    } catch (err) {
      console.error('Error fetching farmers:', err);
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (farmerId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (followedFarmers.includes(farmerId)) {
        setFollowedFarmers(prev => prev.filter(id => id !== farmerId));
        await api.delete(`/user-service/api/v1/farmers/${farmerId}/follow`).catch(() => {});
      } else {
        setFollowedFarmers(prev => [...prev, farmerId]);
        await api.post(`/user-service/api/v1/farmers/${farmerId}/follow`).catch(() => {});
      }
    } catch (err) {
      console.error('Error following farmer:', err);
    }
  };

  const handleMessage = (farmerId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/messages?farmer=${farmerId}`);
  };

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         farmer.farmName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="farmers-page">
      {/* Hero Section */}
      <section className="farmers-hero">
        <div className="hero-content">
          <h1>Meet Our Farmers</h1>
          <p>Connect directly with local farmers and support sustainable agriculture</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <FiUsers />
              <span>2,500+ Farmers</span>
            </div>
            <div className="hero-stat">
              <FiPackage />
              <span>15,000+ Products</span>
            </div>
            <div className="hero-stat">
              <FiAward />
              <span>98% Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="farmers-filters">
        <div className="filters-container">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search farmers by name or farm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-select">
              <FiMapPin />
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <FiChevronDown />
            </div>

            <div className="filter-select">
              <FiFilter />
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <FiChevronDown />
            </div>

            <div className="filter-select">
              <FiStar />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="rating">Top Rated</option>
                <option value="followers">Most Followed</option>
                <option value="products">Most Products</option>
                <option value="newest">Newest</option>
              </select>
              <FiChevronDown />
            </div>
          </div>
        </div>
      </section>

      {/* Farmers Grid */}
      <section className="farmers-grid-section">
        <div className="section-container">
          {loading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="farmer-card-skeleton">
                  <div className="skeleton-cover"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="farmers-grid">
              {filteredFarmers.map((farmer) => (
                <FarmerCard
                  key={farmer.id}
                  farmer={farmer}
                  isFollowed={followedFarmers.includes(farmer.id)}
                  onFollow={handleFollow}
                  onMessage={handleMessage}
                />
              ))}
            </div>
          )}

          {!loading && filteredFarmers.length === 0 && (
            <div className="no-results">
              <img src="https://illustrations.popsy.co/gray/search-results.svg" alt="No results" />
              <h3>No farmers found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="farmers-cta">
        <div className="cta-content">
          <h2>Are You a Farmer?</h2>
          <p>Join AgriLink and start selling directly to consumers. Zero commission, full control over your products.</p>
          <Link to="/register?role=FARMER" className="cta-button">
            Register as a Farmer
          </Link>
        </div>
      </section>
    </div>
  );
};

// Farmer Card Component
const FarmerCard = ({ farmer, isFollowed, onFollow, onMessage }) => {
  const navigate = useNavigate();

  return (
    <div className="farmer-card">
      <div className="farmer-cover" style={{ backgroundImage: `url(${farmer.coverImage})` }}>
        <button 
          className={`follow-btn ${isFollowed ? 'followed' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onFollow(farmer.id);
          }}
        >
          <FiHeart />
          {isFollowed ? 'Following' : 'Follow'}
        </button>
      </div>

      <div className="farmer-content">
        <div className="farmer-avatar">
          <img src={farmer.avatar} alt={farmer.name} />
          {farmer.verified && (
            <span className="verified-badge" title="Verified Farmer">
              <FiCheck />
            </span>
          )}
        </div>

        <div className="farmer-info">
          <h3 className="farmer-name">
            {farmer.name}
          </h3>
          <p className="farm-name">{farmer.farmName}</p>
          
          <div className="farmer-location">
            <FiMapPin />
            <span>{farmer.location}</span>
          </div>

          <div className="farmer-stats">
            <div className="stat">
              <FiStar className="star" />
              <span>{farmer.rating}</span>
              <span className="count">({farmer.reviewCount})</span>
            </div>
            <div className="stat">
              <FiUsers />
              <span>{farmer.followers}</span>
            </div>
            <div className="stat">
              <FiPackage />
              <span>{farmer.products}</span>
            </div>
          </div>

          <div className="farmer-specialties">
            {farmer.specialties.map((spec, i) => (
              <span key={i} className="specialty-tag">{spec}</span>
            ))}
          </div>

          <p className="farmer-description">{farmer.description}</p>

          <div className="farmer-actions">
            <Link to={`/marketplace?farmer=${farmer.id}`} className="view-products-btn">
              View Products
            </Link>
            <button className="message-btn" onClick={() => onMessage(farmer.id)}>
              <FiMessageSquare />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Farmers;
