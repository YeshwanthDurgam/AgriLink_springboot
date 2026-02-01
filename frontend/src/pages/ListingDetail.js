import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
// Tree-shakeable individual icon imports
import { FiHeart } from '@react-icons/all-files/fi/FiHeart';
import { FiShoppingCart } from '@react-icons/all-files/fi/FiShoppingCart';
import { FiShare2 } from '@react-icons/all-files/fi/FiShare2';
import { FiTruck } from '@react-icons/all-files/fi/FiTruck';
import { FiShield } from '@react-icons/all-files/fi/FiShield';
import { FiRefreshCw } from '@react-icons/all-files/fi/FiRefreshCw';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiChevronLeft } from '@react-icons/all-files/fi/FiChevronLeft';
import { FiChevronRight } from '@react-icons/all-files/fi/FiChevronRight';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiZoomIn } from '@react-icons/all-files/fi/FiZoomIn';
import { FiStar } from '@react-icons/all-files/fi/FiStar';
import { FiMapPin } from '@react-icons/all-files/fi/FiMapPin';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { FiAward } from '@react-icons/all-files/fi/FiAward';
import { FiPackage } from '@react-icons/all-files/fi/FiPackage';
import { FiMessageCircle } from '@react-icons/all-files/fi/FiMessageCircle';
import { FiThumbsUp } from '@react-icons/all-files/fi/FiThumbsUp';
import marketplaceService from '../services/marketplaceService';
import cartService from '../services/cartService';
import wishlistService from '../services/wishlistService';
import guestService from '../services/guestService';
import reviewService from '../services/reviewService';
import messagingService from '../services/messagingService';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import ChatWidget from '../components/ChatWidget';
import './ListingDetail.css';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incrementCartCount, fetchCartCount } = useCart();
  
  // Core state
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Gallery state
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  
  // Cart/Wishlist state
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [listingRating, setListingRating] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  // Delivery location
  const [deliveryPincode, setDeliveryPincode] = useState(
    localStorage.getItem('deliveryPincode') || ''
  );
  const [deliveryAvailable, setDeliveryAvailable] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchListing();
    checkWishlist();
    fetchReviews();
    checkCanReview();
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getListingById(id);
      setListing(data);
      fetchRelatedProducts(data.categoryId);
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (categoryId) => {
    try {
      const response = await marketplaceService.getListings({ 
        categoryId, 
        size: 6,
        excludeId: id 
      });
      const products = response.content || response || [];
      setRelatedProducts(products.filter(p => p.id !== id).slice(0, 4));
    } catch (err) {
      console.error('Error fetching related products:', err);
    }
  };

  const checkWishlist = async () => {
    try {
      if (!user) {
        const inWishlist = guestService.isInGuestWishlist(id);
        setIsInWishlist(inWishlist);
      } else {
        const inWishlist = await wishlistService.isInWishlist(id);
        setIsInWishlist(inWishlist);
      }
    } catch (err) {
      console.error('Error checking wishlist:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await reviewService.getListingReviews(id);
      let reviewsArray = [];
      if (Array.isArray(data)) {
        reviewsArray = data;
      } else if (data?.content && Array.isArray(data.content)) {
        reviewsArray = data.content;
      } else if (data?.data && Array.isArray(data.data)) {
        reviewsArray = data.data;
      } else if (data?.data?.content && Array.isArray(data.data.content)) {
        reviewsArray = data.data.content;
      }
      setReviews(reviewsArray);
      
      const ratingData = await reviewService.getListingRating(id);
      setListingRating(ratingData?.data || ratingData || null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    }
  };

  const isCustomer = () => {
    if (!user || !user.roles) return false;
    return !user.roles.includes('FARMER') && !user.roles.includes('ADMIN');
  };

  const checkCanReview = async () => {
    if (!user) {
      setCanReview(false);
      return;
    }
    if (!isCustomer()) {
      setCanReview(false);
      return;
    }
    try {
      const result = await reviewService.canReview(id);
      if (typeof result === 'boolean') {
        setCanReview(result);
      } else if (result?.success && result?.data !== undefined) {
        setCanReview(result.data === true);
      } else if (result?.data !== undefined) {
        setCanReview(result.data === true);
      } else {
        setCanReview(!!result);
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
      setCanReview(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      await reviewService.createReview(id, reviewData);
      setShowReviewForm(false);
      fetchReviews();
      fetchListing();
      setCanReview(false);
    } catch (err) {
      throw err;
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      await reviewService.markHelpful(reviewId);
      fetchReviews();
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/marketplace/listing/${id}` } });
      return;
    }
    try {
      const conversation = await messagingService.sendMessage({
        recipientId: listing.sellerId,
        content: `Hi! I'm interested in your listing: ${listing.title}`,
        listingId: listing.id,
        listingTitle: listing.title
      });
      navigate(`/messages/${conversation.conversationId || conversation.id}`);
    } catch (err) {
      console.error('Error starting conversation:', err);
      toast.error('Failed to contact seller');
    }
  };

  const handleAddToCart = async () => {
    if (user?.roles?.includes('FARMER')) {
      toast.error('Farmers cannot place orders. Please use a customer account.');
      return;
    }

    // OPTIMISTIC UI: Update cart count immediately (no API wait)
    incrementCartCount(quantity);
    setAddedToCart(true);
    toast.success('Added to cart!');

    setActionLoading('cart');
    try {
      const price = listing.pricePerUnit || listing.price;
      const imageUrl = listing.images?.[0]?.imageUrl || listing.imageUrl || null;
      
      if (!user) {
        guestService.addToGuestCart({
          id: listing.id,
          title: listing.title,
          price: price,
          unit: listing.quantityUnit || listing.unit || 'kg',
          imageUrl: imageUrl,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName,
          quantity: listing.quantity,
          availableQuantity: listing.quantity ? parseInt(listing.quantity) : 100
        }, quantity);
      } else {
        await cartService.addToCart({
          listingId: listing.id,
          sellerId: listing.sellerId,
          quantity: quantity,
          unitPrice: price,
          listingTitle: listing.title,
          listingImageUrl: imageUrl,
          unit: listing.quantityUnit || listing.unit || 'kg',
          availableQuantity: listing.quantity ? parseInt(listing.quantity) : null
        });
        // Sync cart count with server after successful API call
        fetchCartCount();
      }
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add to cart. Please try again.');
      setAddedToCart(false);
      // Revert optimistic update on error
      fetchCartCount();
    } finally {
      setActionLoading(null);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.info('Please login to complete your purchase');
      navigate('/login', { state: { from: `/marketplace/listing/${id}`, action: 'buyNow' } });
      return;
    }

    if (user?.roles?.includes('FARMER')) {
      toast.error('Farmers cannot place orders. Please use a customer account.');
      return;
    }

    setActionLoading('buy');
    try {
      const price = listing.pricePerUnit || listing.price;
      const imageUrl = listing.images?.[0]?.imageUrl || listing.imageUrl || null;
      await cartService.addToCart({
        listingId: listing.id,
        sellerId: listing.sellerId,
        quantity: quantity,
        unitPrice: price,
        listingTitle: listing.title,
        listingImageUrl: imageUrl,
        unit: listing.quantityUnit || listing.unit || 'kg',
        availableQuantity: listing.quantity ? parseInt(listing.quantity) : null
      });
      navigate('/checkout');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to proceed to checkout');
      setActionLoading(null);
    }
  };

  const handleToggleWishlist = async () => {
    if (user?.roles?.includes('FARMER')) {
      toast.error('Farmers cannot use the wishlist feature');
      return;
    }

    setActionLoading('wishlist');
    try {
      if (!user) {
        const price = listing.pricePerUnit || listing.price;
        const imageUrl = listing.images?.[0]?.imageUrl || listing.imageUrl || null;
        const isNowInWishlist = guestService.toggleGuestWishlist({
          id: listing.id,
          title: listing.title,
          price: price,
          unit: listing.quantityUnit || listing.unit || 'kg',
          imageUrl: imageUrl,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName
        });
        setIsInWishlist(isNowInWishlist);
        toast.success(isNowInWishlist ? 'Added to wishlist!' : 'Removed from wishlist');
      } else {
        if (isInWishlist) {
          await wishlistService.removeFromWishlist(id);
          setIsInWishlist(false);
          toast.success('Removed from wishlist');
        } else {
          await wishlistService.addToWishlist(id);
          setIsInWishlist(true);
          toast.success('Added to wishlist!');
        }
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      toast.error('Failed to update wishlist');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= (listing?.quantity || 100)) {
      setQuantity(newQty);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out ${listing.title} on AgriLink!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleImageNavigation = (direction) => {
    const images = listing?.images || [];
    if (direction === 'prev') {
      setSelectedImage(prev => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setSelectedImage(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const handleImageZoom = (e) => {
    if (!imageZoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const checkDelivery = () => {
    if (!deliveryPincode || deliveryPincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    localStorage.setItem('deliveryPincode', deliveryPincode);
    // Simulate delivery check
    setDeliveryAvailable({
      available: true,
      estimatedDays: Math.floor(Math.random() * 3) + 2,
      freeDelivery: listing.pricePerUnit * quantity >= 500
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalf = (rating % 1) >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FiStar key={i} className="star filled" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<FiStar key={i} className="star half" />);
      } else {
        stars.push(<FiStar key={i} className="star" />);
      }
    }
    return stars;
  };

  // Loading state
  if (loading) {
    return (
      <div className="listing-detail-page">
        <div className="listing-detail-loading">
          <div className="loading-skeleton">
            <div className="skeleton-gallery">
              <div className="skeleton-main-image"></div>
              <div className="skeleton-thumbnails">
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-thumb"></div>)}
              </div>
            </div>
            <div className="skeleton-info">
              <div className="skeleton-line wide"></div>
              <div className="skeleton-line medium"></div>
              <div className="skeleton-line short"></div>
              <div className="skeleton-box"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !listing) {
    return (
      <div className="listing-detail-page">
        <div className="listing-detail-error">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/marketplace')} className="btn-primary">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!listing) {
    return (
      <div className="listing-detail-page">
        <div className="listing-detail-error">
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/marketplace')} className="btn-primary">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const images = listing.images?.length > 0 ? listing.images : [{ imageUrl: null }];
  const price = listing.pricePerUnit || listing.price || 0;
  const originalPrice = listing.originalPrice || null;
  const discount = originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
  const avgRating = listingRating?.averageRating || listing.averageRating || null;
  const totalReviews = listingRating?.totalReviews || listing.reviewCount || reviews.length || 0;
  const hasRating = avgRating !== null && totalReviews > 0;

  return (
    <div className="listing-detail-page">
      {/* Breadcrumb */}
      <nav className="listing-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/marketplace">Marketplace</Link>
        {listing.categoryName && (
          <>
            <span>/</span>
            <Link to={`/marketplace?categoryId=${listing.categoryId}`}>{listing.categoryName}</Link>
          </>
        )}
        <span>/</span>
        <span className="current">{listing.title}</span>
      </nav>

      {/* Added to cart notification */}
      {addedToCart && (
        <div className="cart-notification">
          <FiCheck className="notification-icon" />
          <span>Added to cart!</span>
          <Link to="/cart" className="view-cart-link">View Cart</Link>
        </div>
      )}

      <div className="listing-detail-content">
        {/* Left: Image Gallery */}
        <div className="listing-gallery">
          <div 
            className={`main-image-container ${imageZoom ? 'zooming' : ''}`}
            onMouseEnter={() => setImageZoom(true)}
            onMouseLeave={() => setImageZoom(false)}
            onMouseMove={handleImageZoom}
            onClick={() => setShowLightbox(true)}
          >
            {images[selectedImage]?.imageUrl ? (
              <>
                <img 
                  src={images[selectedImage].imageUrl} 
                  alt={listing.title}
                  className="main-image"
                />
                {imageZoom && (
                  <div 
                    className="zoom-lens"
                    style={{
                      backgroundImage: `url(${images[selectedImage].imageUrl})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`
                    }}
                  />
                )}
              </>
            ) : (
              <div className="placeholder-image">🌾</div>
            )}
            
            <button className="zoom-hint">
              <FiZoomIn /> Click to zoom
            </button>
            
            {/* Image navigation */}
            {images.length > 1 && (
              <>
                <button 
                  className="image-nav prev"
                  onClick={(e) => { e.stopPropagation(); handleImageNavigation('prev'); }}
                >
                  <FiChevronLeft />
                </button>
                <button 
                  className="image-nav next"
                  onClick={(e) => { e.stopPropagation(); handleImageNavigation('next'); }}
                >
                  <FiChevronRight />
                </button>
              </>
            )}
            
            {/* Badges */}
            <div className="image-badges">
              {listing.isOrganic && (
                <span className="badge organic">🌱 Organic</span>
              )}
              {discount > 5 && (
                <span className="badge discount">-{discount}%</span>
              )}
            </div>
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="thumbnail-strip">
              {images.map((img, index) => (
                <button
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  {img.imageUrl ? (
                    <img src={img.imageUrl} alt={`${listing.title} ${index + 1}`} />
                  ) : (
                    <div className="placeholder-thumb">🌾</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Middle: Product Info */}
        <div className="listing-info">
          {/* Category */}
          {listing.categoryName && (
            <Link 
              to={`/marketplace?categoryId=${listing.categoryId}`}
              className="product-category-link"
            >
              {listing.categoryName}
            </Link>
          )}
          
          {/* Title */}
          <h1 className="product-title">{listing.title}</h1>
          
          {/* Rating - only show if product has reviews */}
          {hasRating ? (
            <div className="product-rating-summary">
              <div className="stars">{renderStars(avgRating)}</div>
              <span className="rating-value">{avgRating.toFixed(1)}</span>
              <Link to="#reviews" className="rating-count">
                {totalReviews} {totalReviews === 1 ? 'rating' : 'ratings'}
              </Link>
            </div>
          ) : (
            <div className="product-new-badge">
              <span className="new-arrival-badge">✨ New Arrival</span>
              <span className="be-first">Be the first to review this product</span>
            </div>
          )}
          
          {/* Price Section */}
          <div className="product-price-section">
            {discount > 5 && (
              <div className="price-discount-row">
                <span className="discount-badge">-{discount}%</span>
                <span className="limited-deal">Limited time deal</span>
              </div>
            )}
            <div className="price-row">
              <span className="currency">₹</span>
              <span className="price-value">{price.toFixed(0)}</span>
              <span className="price-unit">/{listing.quantityUnit || 'kg'}</span>
            </div>
            {discount > 5 && (
              <div className="mrp-row">
                M.R.P.: <span className="original-price">₹{originalPrice.toFixed(0)}</span>
              </div>
            )}
            <p className="price-inclusive">Inclusive of all taxes</p>
          </div>
          
          {/* Quick Features */}
          <div className="product-highlights">
            <div className="highlight-item">
              <FiTruck className="highlight-icon" />
              <span>Free Delivery on orders over ₹500</span>
            </div>
            <div className="highlight-item">
              <FiShield className="highlight-icon" />
              <span>100% Fresh Guarantee</span>
            </div>
            <div className="highlight-item">
              <FiRefreshCw className="highlight-icon" />
              <span>Easy Returns within 24 hours</span>
            </div>
            {listing.isOrganic && (
              <div className="highlight-item organic">
                <FiAward className="highlight-icon" />
                <span>Certified Organic Product</span>
              </div>
            )}
          </div>
          
          {/* Product Description Tabs */}
          <div className="product-tabs">
            <div className="tabs-header">
              <button 
                className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                About this item
              </button>
              <button 
                className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Product Details
              </button>
            </div>
            
            <div className="tabs-content">
              {activeTab === 'description' && (
                <div className="tab-panel">
                  <p className="product-description">
                    {listing.description || 'Fresh, high-quality produce directly from local farms. Sourced and delivered with care to ensure maximum freshness.'}
                  </p>
                  <ul className="feature-list">
                    <li><FiCheck /> Freshly harvested from local farms</li>
                    <li><FiCheck /> Chemical-free and naturally grown</li>
                    <li><FiCheck /> Quality checked before dispatch</li>
                    <li><FiCheck /> Packed hygienically for safe delivery</li>
                  </ul>
                </div>
              )}
              
              {activeTab === 'details' && (
                <div className="tab-panel">
                  <dl className="details-list">
                    <div className="detail-row">
                      <dt>Category</dt>
                      <dd>{listing.categoryName || 'General'}</dd>
                    </div>
                    <div className="detail-row">
                      <dt>Unit</dt>
                      <dd>{listing.quantityUnit || 'kg'}</dd>
                    </div>
                    <div className="detail-row">
                      <dt>Status</dt>
                      <dd>{listing.status || 'Available'}</dd>
                    </div>
                    <div className="detail-row">
                      <dt>Listed On</dt>
                      <dd>{new Date(listing.createdAt).toLocaleDateString()}</dd>
                    </div>
                    {listing.isOrganic && (
                      <div className="detail-row">
                        <dt>Certification</dt>
                        <dd>Organic Certified</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Buy Box */}
        <div className="listing-buy-box">
          <div className="buy-box-price">
            <span className="currency">₹</span>
            <span className="amount">{(price * quantity).toFixed(0)}</span>
          </div>
          
          {/* Delivery Check */}
          <div className="delivery-check">
            <div className="delivery-input">
              <FiMapPin className="pin-icon" />
              <input
                type="text"
                placeholder="Enter pincode"
                value={deliveryPincode}
                onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <button onClick={checkDelivery}>Check</button>
            </div>
            
            {deliveryAvailable && (
              <div className="delivery-info">
                <FiTruck className="delivery-icon success" />
                <div className="delivery-details">
                  <span className="delivery-date">
                    {deliveryAvailable.freeDelivery ? 'FREE Delivery' : 'Delivery'} by{' '}
                    <strong>
                      {new Date(Date.now() + deliveryAvailable.estimatedDays * 24 * 60 * 60 * 1000)
                        .toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </strong>
                  </span>
                  {!deliveryAvailable.freeDelivery && (
                    <span className="delivery-fee">₹40 delivery fee</span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Stock Status */}
          <div className={`stock-status ${listing.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {listing.quantity > 0 ? (
              listing.quantity <= 10 ? (
                <span className="low-stock">Only {listing.quantity} left in stock - order soon</span>
              ) : (
                <span className="available">In Stock</span>
              )
            ) : (
              <span className="unavailable">Currently Unavailable</span>
            )}
          </div>
          
          {/* Quantity Selector */}
          {listing.quantity > 0 && (
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-controls">
                <button 
                  onClick={() => handleQuantityChange(-1)} 
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)} 
                  disabled={quantity >= listing.quantity}
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="buy-box-actions">
            <button
              onClick={handleAddToCart}
              disabled={actionLoading || listing.quantity === 0}
              className="btn-add-to-cart"
            >
              {actionLoading === 'cart' ? (
                <span className="btn-loading"></span>
              ) : (
                <>
                  <FiShoppingCart /> Add to Cart
                </>
              )}
            </button>
            
            <button
              onClick={handleBuyNow}
              disabled={actionLoading || listing.quantity === 0}
              className="btn-buy-now"
            >
              {actionLoading === 'buy' ? (
                <span className="btn-loading"></span>
              ) : (
                'Buy Now'
              )}
            </button>
          </div>
          
          {/* Secondary Actions */}
          <div className="buy-box-secondary">
            <button 
              onClick={handleToggleWishlist}
              disabled={actionLoading === 'wishlist'}
              className={`btn-wishlist ${isInWishlist ? 'active' : ''}`}
            >
              <FiHeart /> {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </button>
            
            <button onClick={handleShare} className="btn-share">
              <FiShare2 /> Share
            </button>
          </div>
          
          {/* Secure Transaction */}
          <div className="secure-transaction">
            <FiShield className="shield-icon" />
            <span>Secure transaction</span>
          </div>
          
          {/* Seller Info */}
          <div className="buy-box-seller">
            <div className="seller-row">
              <span className="label">Sold by</span>
              <Link 
                to={listing.sellerId ? `/farmers/${listing.sellerId}` : '#'}
                className="seller-name"
              >
                {listing.sellerName || listing.farmerName || 'AgriLink Farmer'}
              </Link>
            </div>
            <button 
              className="contact-seller-btn"
              onClick={handleContactSeller}
            >
              <FiMessageCircle /> Contact Seller
            </button>
          </div>
          
          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="trust-item">
              <FiPackage />
              <span>Quality Packaging</span>
            </div>
            <div className="trust-item">
              <FiRefreshCw />
              <span>Easy Returns</span>
            </div>
            <div className="trust-item">
              <FiShield />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="related-products">
          <h2>Customers who viewed this also viewed</h2>
          <div className="related-grid">
            {relatedProducts.map(product => (
              <Link 
                to={`/marketplace/${product.id}`} 
                key={product.id}
                className="related-card"
              >
                <div className="related-image">
                  {product.imageUrl || product.images?.[0]?.imageUrl ? (
                    <img 
                      src={product.imageUrl || product.images?.[0]?.imageUrl} 
                      alt={product.title} 
                    />
                  ) : (
                    <div className="placeholder">🌾</div>
                  )}
                </div>
                <div className="related-info">
                  <h4>{product.title}</h4>
                  {(product.averageRating || product.rating) && (product.reviewCount || product.totalReviews) > 0 ? (
                    <div className="related-rating">
                      <FiStar className="star filled" />
                      <span>{(product.averageRating || product.rating).toFixed(1)}</span>
                      <span className="review-count">({product.reviewCount || product.totalReviews})</span>
                    </div>
                  ) : (
                    <div className="related-new">
                      <span className="new-badge">New</span>
                    </div>
                  )}
                  <div className="related-price">
                    ₹{product.pricePerUnit || product.price}
                    <span>/{product.quantityUnit || 'kg'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="reviews-section" id="reviews">
        <div className="reviews-header">
          <h2>Customer Reviews</h2>
          {hasRating ? (
            <div className="reviews-summary">
              <div className="rating-big">
                <span className="rating-number">{avgRating.toFixed(1)}</span>
                <div className="rating-stars">{renderStars(avgRating)}</div>
                <span className="rating-total">{totalReviews} {totalReviews === 1 ? 'rating' : 'ratings'}</span>
              </div>
            </div>
          ) : (
            <div className="no-reviews-yet">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
          
          {user && !isCustomer() && (
            <p className="review-info-text">Only customers can write reviews</p>
          )}
          
          {canReview && !showReviewForm && (
            <button 
              className="btn-write-review"
              onClick={() => setShowReviewForm(true)}
            >
              Write a Review
            </button>
          )}
        </div>

        {showReviewForm && (
          <ReviewForm 
            onSubmit={handleReviewSubmit}
            onCancel={() => setShowReviewForm(false)}
          />
        )}

        <ReviewList 
          reviews={reviews}
          ratingData={listingRating}
          onHelpful={handleHelpful}
          currentUserId={user?.id}
        />
      </section>

      {/* Lightbox */}
      {showLightbox && (
        <div className="lightbox" onClick={() => setShowLightbox(false)}>
          <button className="lightbox-close" onClick={() => setShowLightbox(false)}>
            <FiX />
          </button>
          <button 
            className="lightbox-nav prev"
            onClick={(e) => { e.stopPropagation(); handleImageNavigation('prev'); }}
          >
            <FiChevronLeft />
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {images[selectedImage]?.imageUrl ? (
              <img src={images[selectedImage].imageUrl} alt={listing.title} />
            ) : (
              <div className="placeholder-image large">🌾</div>
            )}
          </div>
          <button 
            className="lightbox-nav next"
            onClick={(e) => { e.stopPropagation(); handleImageNavigation('next'); }}
          >
            <FiChevronRight />
          </button>
          <div className="lightbox-counter">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {listing && listing.sellerId && user?.id !== listing.sellerId && (
        <ChatWidget 
          sellerId={listing.sellerId}
          sellerName={listing.sellerName || 'Seller'}
          listingId={listing.id}
          listingTitle={listing.title}
        />
      )}
    </div>
  );
};

export default ListingDetail;
