import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar, FiHeart, FiMessageSquare, FiFilter, FiChevronDown, FiUsers, FiPackage, FiAward, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { authApi, userApi, marketplaceApi } from '../services/api';
import { toast } from 'react-toastify';
import './Farmers.css';

const Farmers = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showFollowingOnly = searchParams.get('following') === 'true';
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
    if (showFollowingOnly && isAuthenticated) {
      fetchFollowedFarmersOnly();
    } else {
      fetchFarmers();
    }
    if (isAuthenticated) {
      fetchFollowedFarmers();
    }
  }, [sortBy, filterLocation, filterCategory, isAuthenticated, showFollowingOnly]);

  const fetchFollowedFarmers = async () => {
    try {
      const response = await userApi.get('/farmers/followed/ids');
      const ids = response?.data?.data || [];
      setFollowedFarmers(ids);
    } catch (err) {
      console.warn('Could not fetch followed farmers:', err);
    }
  };

  // Fetch ONLY followed farmers (for /farmers?following=true)
  const fetchFollowedFarmersOnly = async () => {
    try {
      setLoading(true);
      
      // Fetch followed farmers data from user-service
      const response = await userApi.get('/farmers/followed');
      const followedData = response?.data?.data || [];
      
      if (followedData.length === 0) {
        setFarmers([]);
        setLoading(false);
        return;
      }

      // Also fetch sellers data to get aggregated stats
      let sellersMap = {};
      try {
        const sellersResponse = await marketplaceApi.get('/listings/sellers');
        const sellers = sellersResponse?.data?.data || [];
        sellers.forEach(seller => {
          sellersMap[seller.id] = seller;
        });
      } catch (err) {
        console.warn('Could not fetch seller stats:', err);
      }

      // Map the followed farmers data with seller stats
      const farmersList = followedData.map(follow => {
        const sellerStats = sellersMap[follow.farmerId] || {};
        return {
          id: follow.farmerId,
          name: sellerStats.name || follow.farmerName || 'Farmer',
          farmName: sellerStats.farmName || follow.farmName || 'Local Farm',
          location: sellerStats.location || follow.location || 'India',
          avatar: sellerStats.avatar || follow.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(follow.farmerName || 'Farmer')}&background=2d6a4f&color=fff`,
          coverImage: sellerStats.coverImage || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400',
          rating: sellerStats.rating || 0,
          reviewCount: sellerStats.reviewCount || 0,
          followers: sellerStats.followers || 0,
          products: sellerStats.products || 0,
          specialties: sellerStats.specialties || [],
          isVerified: sellerStats.verified !== false,
          joinedDate: follow.followedAt,
          description: sellerStats.description || ''
        };
      });

      setFarmers(farmersList);
      // All displayed farmers are followed when in following mode
      setFollowedFarmers(farmersList.map(f => f.id));
    } catch (err) {
      console.error('Error fetching followed farmers:', err);
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      
      // Fetch sellers from marketplace-service (has aggregated product/rating/follower data)
      const sellersResponse = await marketplaceApi.get('/listings/sellers');
      
      let farmersList = [];
      if (sellersResponse?.data?.data && Array.isArray(sellersResponse.data.data)) {
        farmersList = sellersResponse.data.data;
      } else if (Array.isArray(sellersResponse?.data)) {
        farmersList = sellersResponse.data;
      }

      // Map sellers to farmer format
      farmersList = farmersList.map(seller => ({
        id: seller.id,
        name: seller.name || 'Farmer',
        farmName: seller.farmName || 'Local Farm',
        email: seller.email,
        location: seller.location || 'India',
        avatar: seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'Farmer')}&background=2d6a4f&color=fff`,
        coverImage: seller.coverImage || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400',
        rating: seller.rating || 0,
        reviewCount: seller.reviewCount || 0,
        followers: seller.followers || 0,
        products: seller.products || 0,
        specialties: seller.specialties || [],
        isVerified: seller.verified !== false,
        joinedDate: seller.joinedYear ? `${seller.joinedYear}` : null,
        description: seller.description || ''
      }));

      setFarmers(farmersList);
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
    
    // Farmers cannot follow other farmers
    if (user?.roles?.includes('FARMER')) {
      toast.warning('Farmers cannot follow other farmers');
      return;
    }
    
    try {
      if (followedFarmers.includes(farmerId)) {
        await userApi.delete(`/farmers/${farmerId}/follow`);
        setFollowedFarmers(prev => prev.filter(id => id !== farmerId));
        toast.success('Unfollowed farmer');
      } else {
        await userApi.post(`/farmers/${farmerId}/follow`);
        setFollowedFarmers(prev => [...prev, farmerId]);
        toast.success('Now following farmer!');
      }
    } catch (err) {
      console.error('Error following farmer:', err);
      toast.error(err.response?.data?.message || 'Failed to update follow status');
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
          <h1>{showFollowingOnly ? 'Farmers You Follow' : 'Meet Our Farmers'}</h1>
          <p>{showFollowingOnly ? 'Your favorite farmers and their products' : 'Connect directly with local farmers and support sustainable agriculture'}</p>
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
              <span>{farmer.rating > 0 ? farmer.rating.toFixed(1) : 'Not rated'}</span>
              {farmer.reviewCount > 0 && <span className="count">({farmer.reviewCount})</span>}
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
            <Link to={`/farmers/${farmer.id}`} className="view-products-btn">
              View Profile
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
