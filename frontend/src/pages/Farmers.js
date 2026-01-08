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
      // Try to fetch real farmers data
      const response = await api.get('/user-service/api/v1/farmers', {
        params: {
          sort: sortBy,
          location: filterLocation && filterLocation !== 'All Locations' ? filterLocation : undefined,
          category: filterCategory && filterCategory !== 'All Categories' ? filterCategory : undefined
        }
      }).catch(() => null);

      if (response?.data?.data) {
        setFarmers(response.data.data);
      } else {
        // Use mock data
        setFarmers(getMockFarmers());
      }
    } catch (err) {
      console.error('Error fetching farmers:', err);
      setFarmers(getMockFarmers());
    } finally {
      setLoading(false);
    }
  };

  const getMockFarmers = () => {
    return [
      {
        id: '1',
        name: 'Rajesh Kumar',
        farmName: 'Green Valley Farms',
        location: 'Maharashtra',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400',
        rating: 4.8,
        reviewCount: 156,
        followers: 2340,
        products: 45,
        verified: true,
        specialties: ['Organic Vegetables', 'Fruits'],
        joinedYear: 2019,
        description: 'Growing fresh organic vegetables with sustainable farming practices.'
      },
      {
        id: '2',
        name: 'Priya Sharma',
        farmName: 'Sunrise Organic Farm',
        location: 'Punjab',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        coverImage: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
        rating: 4.9,
        reviewCount: 234,
        followers: 3450,
        products: 67,
        verified: true,
        specialties: ['Grains', 'Dairy'],
        joinedYear: 2018,
        description: 'Traditional Punjab farming with modern organic techniques.'
      },
      {
        id: '3',
        name: 'Amit Patel',
        farmName: 'Fresh Fields',
        location: 'Gujarat',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        coverImage: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
        rating: 4.7,
        reviewCount: 189,
        followers: 1890,
        products: 38,
        verified: true,
        specialties: ['Spices', 'Pulses'],
        joinedYear: 2020,
        description: 'Premium quality spices directly from our family farm.'
      },
      {
        id: '4',
        name: 'Lakshmi Reddy',
        farmName: 'Golden Harvest',
        location: 'Karnataka',
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
        coverImage: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
        rating: 4.6,
        reviewCount: 145,
        followers: 1567,
        products: 52,
        verified: false,
        specialties: ['Fruits', 'Vegetables'],
        joinedYear: 2021,
        description: 'Fresh fruits and vegetables from the hills of Karnataka.'
      },
      {
        id: '5',
        name: 'Suresh Yadav',
        farmName: 'Nature\'s Best Farm',
        location: 'Rajasthan',
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
        coverImage: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400',
        rating: 4.5,
        reviewCount: 98,
        followers: 890,
        products: 28,
        verified: true,
        specialties: ['Organic', 'Grains'],
        joinedYear: 2020,
        description: 'Desert farming with water-efficient organic methods.'
      },
      {
        id: '6',
        name: 'Meena Devi',
        farmName: 'Green Roots',
        location: 'Tamil Nadu',
        avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
        coverImage: 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?w=400',
        rating: 4.8,
        reviewCount: 210,
        followers: 2100,
        products: 61,
        verified: true,
        specialties: ['Vegetables', 'Spices'],
        joinedYear: 2019,
        description: 'Traditional South Indian farming with a focus on quality.'
      }
    ];
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
