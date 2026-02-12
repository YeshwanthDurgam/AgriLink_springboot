import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
// Tree-shakeable individual icon imports
import { FiMapPin } from '@react-icons/all-files/fi/FiMapPin';
import { FiStar } from '@react-icons/all-files/fi/FiStar';
import { FiUsers } from '@react-icons/all-files/fi/FiUsers';
import { FiPackage } from '@react-icons/all-files/fi/FiPackage';
import { FiMail } from '@react-icons/all-files/fi/FiMail';
import { FiPhone } from '@react-icons/all-files/fi/FiPhone';
import { FiCalendar } from '@react-icons/all-files/fi/FiCalendar';
import { FiHeart } from '@react-icons/all-files/fi/FiHeart';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiArrowLeft } from '@react-icons/all-files/fi/FiArrowLeft';
import { FiShoppingCart } from '@react-icons/all-files/fi/FiShoppingCart';
import { FaTractor } from '@react-icons/all-files/fa/FaTractor';
import { useAuth } from '../context/AuthContext';
import { authApi, userApi, marketplaceApi, farmApi } from '../services/api';
import guestService from '../services/guestService';
import { toast } from 'react-toastify';
import './FarmerProfile.css';

const FarmerProfile = () => {
  const { farmerId } = useParams();
  const { isAuthenticated, user } = useAuth();
  
  const [farmer, setFarmer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [farms, setFarms] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if current user is a farmer (farmers cannot follow)
  const isCurrentUserFarmer = user?.roles?.includes('FARMER');
  const isOwnProfile = user?.id === farmerId;

  // Fetch farmer details
  const fetchFarmerDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[FarmerProfile] Fetching details for farmerId:', farmerId);

      // Primary: Fetch approved farmer profile from user-service
      // The farmerId is the userId from the approved farmers list
      let farmerProfileData = null;
      
      try {
        const approvedResponse = await userApi.get('/profiles/farmer/approved');
        const approvedFarmers = approvedResponse?.data?.data || [];
        console.log('[FarmerProfile] Approved farmers:', approvedFarmers.length);
        
        // Find farmer by userId (which is what Farmers.js passes as id)
        farmerProfileData = approvedFarmers.find(f => f.userId === farmerId);
        console.log('[FarmerProfile] Found farmer profile:', farmerProfileData);
      } catch (err) {
        console.warn('[FarmerProfile] Could not fetch approved farmers:', err);
      }

      // If found in approved farmers, use that data
      if (farmerProfileData) {
        // Set farmer data (basic info)
        setFarmer({
          id: farmerProfileData.userId,
          email: farmerProfileData.username || '',
          enabled: true,
          createdAt: farmerProfileData.createdAt
        });

        // Set profile data (detailed info)
        setProfile({
          firstName: farmerProfileData.name || 'Farmer',
          lastName: '',
          farmName: farmerProfileData.farmName,
          city: farmerProfileData.city,
          state: farmerProfileData.state,
          country: farmerProfileData.country,
          bio: farmerProfileData.farmBio,
          profilePictureUrl: farmerProfileData.profilePhoto,
          farmPhoto: farmerProfileData.farmPhoto,
          cropTypes: farmerProfileData.cropTypes
        });
      } else {
        // Fallback: Try to fetch from auth service
        try {
          const authResponse = await authApi.get('/auth/farmers');
          const farmers = authResponse?.data?.data || authResponse?.data || [];
          const authFarmerData = farmers.find(f => f.id === farmerId);
          
          if (authFarmerData) {
            setFarmer(authFarmerData);
            setProfile({
              firstName: authFarmerData.name || authFarmerData.email?.split('@')[0] || 'Farmer',
              lastName: '',
              city: '',
              state: '',
              bio: ''
            });
          } else {
            console.error('[FarmerProfile] Farmer not found in any source');
            setError('Farmer not found');
            return;
          }
        } catch (authErr) {
          console.error('[FarmerProfile] Auth fallback failed:', authErr);
          setError('Farmer not found');
          return;
        }
      }

      // Fetch seller stats from marketplace-service (has aggregated rating/reviews)
      try {
        const sellersResponse = await marketplaceApi.get('/listings/sellers');
        const sellers = sellersResponse?.data?.data || [];
        const sellerData = sellers.find(s => s.id === farmerId);
        if (sellerData) {
          setSellerStats(sellerData);
          // Use follower count from seller stats if available
          if (sellerData.followers !== undefined) {
            setFollowerCount(sellerData.followers);
          }
        }
      } catch (err) {
        console.warn('Could not fetch seller stats:', err);
      }

      // Fetch follower count from user-service (fallback/more accurate)
      try {
        const countResponse = await userApi.get(`/farmers/${farmerId}/followers/count`);
        setFollowerCount(countResponse?.data?.data || 0);
      } catch (err) {
        console.warn('Could not fetch follower count:', err);
      }

    } catch (err) {
      console.error('Error fetching farmer details:', err);
      setError('Failed to load farmer details');
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  // Fetch farmer's farms (PUBLIC endpoint)
  const fetchFarmerFarms = useCallback(async () => {
    try {
      setFarmsLoading(true);
      const response = await farmApi.get(`/farms/farmer/${farmerId}`);
      const farmsData = response?.data?.data || [];
      setFarms(farmsData);
    } catch (err) {
      console.error('Error fetching farmer farms:', err);
      setFarms([]);
    } finally {
      setFarmsLoading(false);
    }
  }, [farmerId]);

  // Fetch farmer's products
  const fetchFarmerProducts = useCallback(async () => {
    try {
      setProductsLoading(true);

      // Use the sellerId parameter to filter products by this farmer
      const response = await marketplaceApi.get('/listings/search', {
        params: {
          sellerId: farmerId,
          size: 50
        }
      });

      const data = response?.data?.data;
      let productsList = [];

      if (data?.content && Array.isArray(data.content)) {
        productsList = data.content;
      } else if (Array.isArray(data)) {
        productsList = data;
      }

      setProducts(productsList);
    } catch (err) {
      console.error('Error fetching farmer products:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [farmerId]);

  // Check if user is following this farmer
  const checkFollowStatus = useCallback(async () => {
    if (!isAuthenticated || isCurrentUserFarmer || isOwnProfile) return;

    try {
      const response = await userApi.get(`/farmers/${farmerId}/following`);
      setIsFollowing(response?.data?.data || false);
    } catch (err) {
      console.warn('Could not check follow status:', err);
    }
  }, [farmerId, isAuthenticated, isCurrentUserFarmer, isOwnProfile]);

  useEffect(() => {
    fetchFarmerDetails();
    fetchFarmerFarms();
    fetchFarmerProducts();
  }, [fetchFarmerDetails, fetchFarmerFarms, fetchFarmerProducts]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to follow farmers');
      return;
    }

    if (isCurrentUserFarmer) {
      toast.warning('Farmers cannot follow other farmers');
      return;
    }

    if (isOwnProfile) {
      toast.warning('You cannot follow yourself');
      return;
    }

    try {
      setFollowLoading(true);

      if (isFollowing) {
        await userApi.delete(`/farmers/${farmerId}/follow`);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast.success('Unfollowed farmer');
      } else {
        await userApi.post(`/farmers/${farmerId}/follow`);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success('Now following farmer!');
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      toast.error(err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    const cartItem = {
      listingId: product.id,
      sellerId: farmerId,
      quantity: 1,
      unitPrice: product.price,
      listingTitle: product.title,
      listingImageUrl: product.images?.[0] || product.imageUrl || null,
      unit: product.unit || 'kg',
      availableQuantity: product.quantity || null
    };
    
    if (!isAuthenticated) {
      // Guest user - use localStorage
      guestService.addToGuestCart(cartItem);
      toast.success('Added to cart!');
      return;
    }

    try {
      await marketplaceApi.post('/cart/items', {
        listingId: product.id,
        quantity: 1,
        name: product.title,
        price: product.price,
        imageUrl: product.images?.[0] || product.imageUrl
      });
      toast.success('Added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="farmer-profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading farmer profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="farmer-profile-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/farmers" className="back-btn">
            <FiArrowLeft /> Back to Farmers
          </Link>
        </div>
      </div>
    );
  }

  const farmerName = profile?.firstName && profile?.lastName 
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : profile?.firstName || farmer?.email?.split('@')[0] || 'Farmer';

  const farmName = profile?.farmName || profile?.businessName || `${farmerName}'s Farm`;
  const location = profile?.city && profile?.state 
    ? `${profile.city}, ${profile.state}` 
    : profile?.city || profile?.state || 'India';
  const joinDate = farmer?.createdAt 
    ? new Date(farmer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Member';

  return (
    <div className="farmer-profile-page">
      {/* Back Navigation */}
      <div className="back-navigation">
        <Link to="/farmers" className="back-link">
          <FiArrowLeft /> Back to Farmers
        </Link>
      </div>

      {/* Farmer Details Section */}
      <section className="farmer-details-section">
        <div className="farmer-cover-image">
          <img 
            src={profile?.farmPhoto || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200"} 
            alt="Farm cover" 
          />
        </div>

        <div className="farmer-info-container">
          <div className="farmer-avatar-large">
            <img 
              src={profile?.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(farmerName)}&background=2d6a4f&color=fff&size=150`}
              alt={farmerName}
            />
            {(farmer?.enabled !== false) && (
              <span className="verified-badge-large" title="Verified Farmer">
                <FiCheck />
              </span>
            )}
          </div>

          <div className="farmer-info-content">
            <div className="farmer-header">
              <div className="farmer-name-section">
                <h1 className="farmer-name">{farmerName}</h1>
                <p className="farm-name">{farmName}</p>
              </div>

              {!isOwnProfile && !isCurrentUserFarmer && (
                <button 
                  className={`follow-button ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  <FiHeart />
                  {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            <div className="farmer-meta">
              <div className="meta-item">
                <FiMapPin />
                <span>{location}</span>
              </div>
              <div className="meta-item">
                <FiCalendar />
                <span>Joined {joinDate}</span>
              </div>
              {farmer?.email && (
                <div className="meta-item">
                  <FiMail />
                  <span>{farmer.email}</span>
                </div>
              )}
              {farmer?.phone && (
                <div className="meta-item">
                  <FiPhone />
                  <span>{farmer.phone}</span>
                </div>
              )}
            </div>

            <div className="farmer-stats-row">
              <div className="stat-item">
                <FiUsers />
                <span className="stat-value">{followerCount}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item">
                <FiPackage />
                <span className="stat-value">{products.length}</span>
                <span className="stat-label">Products</span>
              </div>
              <div className="stat-item">
                <FiStar />
                <span className="stat-value">{sellerStats?.rating?.toFixed(1) || '—'}</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>

            {profile?.bio && (
              <div className="farmer-bio">
                <h3>About</h3>
                <p>{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Farmer's Farms Section */}
      <section className="farmer-farms-section">
        <div className="section-header">
          <h2><FaTractor /> Farms by {farmerName}</h2>
          <span className="farm-count">{farms.length} {farms.length === 1 ? 'farm' : 'farms'}</span>
        </div>

        {farmsLoading ? (
          <div className="farms-loading">
            <div className="loading-grid">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="farm-card-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : farms.length === 0 ? (
          <div className="no-farms">
            <FaTractor size={48} />
            <h3>No Farms Listed</h3>
            <p>This farmer hasn't registered any farms yet.</p>
          </div>
        ) : (
          <div className="farms-grid">
            {farms.map(farm => (
              <div key={farm.id} className="public-farm-card">
                <div className="farm-card-image">
                  🏡
                </div>
                <div className="farm-card-content">
                  <h3 className="farm-name">{farm.name}</h3>
                  {farm.location && (
                    <div className="farm-location">
                      <FiMapPin />
                      <span>{farm.location}</span>
                    </div>
                  )}
                  {farm.description && (
                    <p className="farm-description">{farm.description}</p>
                  )}
                  {farm.totalArea > 0 && (
                    <div className="farm-size">
                      <span>{farm.totalArea} {farm.areaUnit?.toLowerCase() || 'hectares'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Farmer's Products Section */}
      <section className="farmer-products-section">
        <div className="section-header">
          <h2>Products by {farmerName}</h2>
          <span className="product-count">{products.length} products</span>
        </div>

        {productsLoading ? (
          <div className="products-loading">
            <div className="loading-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="product-card-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <FiPackage size={48} />
            <h3>No Products Yet</h3>
            <p>This farmer hasn't listed any products yet. Check back later!</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <Link to={`/marketplace/${product.id}`} className="product-image-link">
                  <img 
                    src={product.images?.[0]?.imageUrl || product.imageUrl || 'https://via.placeholder.com/300x200?text=Product'}
                    alt={product.title}
                    className="product-image"
                  />
                  {product.organicCertified && (
                    <span className="organic-badge">Organic</span>
                  )}
                </Link>

                <div className="product-content">
                  <Link to={`/marketplace/${product.id}`} className="product-title-link">
                    <h3 className="product-title">{product.title}</h3>
                  </Link>

                  <p className="product-category">{product.categoryName || product.cropType || 'Agriculture'}</p>

                  <div className="product-price-row">
                    <span className="product-price">₹{(product.pricePerUnit || product.price || 0).toLocaleString()}</span>
                    <span className="product-unit">/ {product.quantityUnit || product.unit || 'kg'}</span>
                  </div>

                  <div className="product-meta">
                    {product.averageRating > 0 && (
                      <div className="product-rating">
                        <FiStar className="star-icon" />
                        <span>{product.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                    <span className="product-quantity">
                      {product.quantity} {product.quantityUnit || product.unit || 'kg'} available
                    </span>
                  </div>

                  <div className="product-actions">
                    <Link to={`/marketplace/${product.id}`} className="view-btn">
                      View Details
                    </Link>
                    <button 
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                    >
                      <FiShoppingCart />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default FarmerProfile;
