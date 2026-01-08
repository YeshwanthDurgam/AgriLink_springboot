import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import marketplaceService from '../services/marketplaceService';
import cartService from '../services/cartService';
import wishlistService from '../services/wishlistService';
import reviewService from '../services/reviewService';
import messagingService from '../services/messagingService';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import './ListingDetail.css';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [listingRating, setListingRating] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchListing();
    checkWishlist();
    fetchReviews();
    checkCanReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getListingById(id);
      setListing(data);
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    if (!user) return;
    try {
      const inWishlist = await wishlistService.isInWishlist(id);
      setIsInWishlist(inWishlist);
    } catch (err) {
      console.error('Error checking wishlist:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await reviewService.getListingReviews(id);
      setReviews(data.content || data || []);
      
      // Also fetch rating summary
      const ratingData = await reviewService.getListingRating(id);
      setListingRating(ratingData);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const checkCanReview = async () => {
    if (!user) return;
    try {
      const result = await reviewService.canReview(id);
      setCanReview(result);
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      await reviewService.createReview({
        ...reviewData,
        listingId: id
      });
      setShowReviewForm(false);
      fetchReviews();
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
      setError('Failed to contact seller');
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/marketplace/listing/${id}` } });
      return;
    }

    setActionLoading('cart');
    try {
      await cartService.addToCart(listing.id, listing.sellerId, quantity, listing.pricePerUnit);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add to cart');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/marketplace/listing/${id}` } });
      return;
    }

    setActionLoading('buy');
    try {
      await cartService.addToCart(listing.id, listing.sellerId, quantity, listing.pricePerUnit);
      navigate('/checkout');
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to proceed to checkout');
      setActionLoading(null);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/marketplace/listing/${id}` } });
      return;
    }

    setActionLoading('wishlist');
    try {
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(id);
        setIsInWishlist(false);
      } else {
        await wishlistService.addToWishlist(id);
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      setError('Failed to update wishlist');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= (listing?.quantity || 1)) {
      setQuantity(newQty);
    }
  };

  if (loading) {
    return (
      <div className="listing-detail-container">
        <div className="loading">Loading listing details...</div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="listing-detail-container">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={() => navigate('/marketplace')} className="btn btn-primary">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="listing-detail-container">
        <div className="not-found">
          <h2>Listing Not Found</h2>
          <p>The listing you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/marketplace')} className="btn btn-primary">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const images = listing.images?.length > 0 
    ? listing.images 
    : [{ imageUrl: null }];

  return (
    <div className="listing-detail-container">
      <nav className="breadcrumb">
        <Link to="/marketplace">Marketplace</Link>
        <span>/</span>
        {listing.category && (
          <>
            <Link to={`/marketplace?category=${listing.category.id}`}>{listing.category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="current">{listing.title}</span>
      </nav>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {addedToCart && (
        <div className="success-message">
          <span>✓ Added to cart!</span>
          <Link to="/cart">View Cart</Link>
        </div>
      )}

      <div className="listing-detail-content">
        {/* Image Gallery */}
        <div className="listing-gallery">
          <div className="main-image">
            {images[selectedImage]?.imageUrl ? (
              <img src={images[selectedImage].imageUrl} alt={listing.title} />
            ) : (
              <div className="placeholder-image">🌾</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="image-thumbnails">
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

        {/* Listing Info */}
        <div className="listing-info">
          <div className="listing-header">
            <h1>{listing.title}</h1>
            <button
              onClick={handleToggleWishlist}
              disabled={actionLoading === 'wishlist'}
              className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isInWishlist ? '❤️' : '🤍'}
            </button>
          </div>

          {listing.category && (
            <span className="listing-category">{listing.category.name}</span>
          )}

          <div className="listing-price">
            <span className="price">${listing.pricePerUnit?.toFixed(2)}</span>
            <span className="unit">per {listing.quantityUnit || 'unit'}</span>
          </div>

          <div className={`stock-status ${listing.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {listing.quantity > 0 
              ? `${listing.quantity} ${listing.quantityUnit || 'units'} available`
              : 'Out of Stock'}
          </div>

          <div className="listing-description">
            <h3>Description</h3>
            <p>{listing.description || 'No description available.'}</p>
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
                <span>{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)} 
                  disabled={quantity >= listing.quantity}
                >
                  +
                </button>
              </div>
              <span className="subtotal">
                Subtotal: ${(quantity * listing.pricePerUnit).toFixed(2)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="listing-actions">
            <button
              onClick={handleAddToCart}
              disabled={actionLoading || listing.quantity === 0}
              className="btn btn-secondary btn-lg"
            >
              {actionLoading === 'cart' ? 'Adding...' : '🛒 Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={actionLoading || listing.quantity === 0}
              className="btn btn-primary btn-lg"
            >
              {actionLoading === 'buy' ? 'Processing...' : 'Buy Now'}
            </button>
          </div>

          {/* Seller Info */}
          <div className="seller-info">
            <h3>Seller Information</h3>
            <div className="seller-details">
              <div className="seller-avatar">👨‍🌾</div>
              <div className="seller-text">
                <span className="seller-label">Sold by</span>
                <span className="seller-id">Farm #{listing.farmId?.slice(0, 8) || 'N/A'}</span>
              </div>
              <button 
                className="btn btn-outline btn-sm contact-seller-btn"
                onClick={handleContactSeller}
              >
                💬 Contact Seller
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="product-details">
            <h3>Product Details</h3>
            <dl>
              <dt>Status</dt>
              <dd>{listing.status || 'Available'}</dd>
              <dt>Listed On</dt>
              <dd>{new Date(listing.createdAt).toLocaleDateString()}</dd>
              {listing.farmId && (
                <>
                  <dt>Farm ID</dt>
                  <dd>{listing.farmId.slice(0, 8)}...</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Customer Reviews</h2>
          {canReview && !showReviewForm && (
            <button 
              className="btn btn-primary"
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
      </div>
    </div>
  );
};

export default ListingDetail;
