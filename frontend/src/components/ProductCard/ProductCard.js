import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
// Tree-shakeable individual icon imports (reduces bundle by ~700KB)
import { FiHeart } from '@react-icons/all-files/fi/FiHeart';
import { FiShoppingCart } from '@react-icons/all-files/fi/FiShoppingCart';
import { FiStar } from '@react-icons/all-files/fi/FiStar';
import { FiTruck } from '@react-icons/all-files/fi/FiTruck';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiEye } from '@react-icons/all-files/fi/FiEye';
import { FiShare2 } from '@react-icons/all-files/fi/FiShare2';
import { FiZap } from '@react-icons/all-files/fi/FiZap';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { FiShield } from '@react-icons/all-files/fi/FiShield';
import { IoLeafOutline } from '@react-icons/all-files/io5/IoLeafOutline';
import { IoFlash } from '@react-icons/all-files/io5/IoFlash';
import { BsLightningFill } from '@react-icons/all-files/bs/BsLightningFill';
import { BsStarFill } from '@react-icons/all-files/bs/BsStarFill';
import { MdVerifiedUser } from '@react-icons/all-files/md/MdVerifiedUser';
import { MdLocalOffer } from '@react-icons/all-files/md/MdLocalOffer';
import './ProductCard.css';

const ProductCard = ({ 
  listing, 
  viewMode = 'grid', 
  isWishlisted = false,
  wishlistLoading = false,
  cartLoading = false,
  onToggleWishlist,
  onAddToCart,
  onQuickView
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get product image
  const getImageUrl = () => {
    if (listing.imageUrl) return listing.imageUrl;
    if (listing.images && listing.images.length > 0) {
      return listing.images[0]?.imageUrl || listing.images[0];
    }
    return null;
  };

  // Calculate discount percentage - only if actual originalPrice exists
  const calculateDiscount = () => {
    if (listing.originalPrice && listing.originalPrice > getPrice()) {
      return Math.round((1 - getPrice() / listing.originalPrice) * 100);
    }
    // Return discount from listing if available
    if (listing.discount && listing.discount > 0) {
      return listing.discount;
    }
    // No fake discounts
    return 0;
  };

  // Get price with fallback
  const getPrice = () => parseFloat(listing.pricePerUnit) || parseFloat(listing.price) || 0;

  // Get original price (for discount display)
  const getOriginalPrice = () => {
    if (listing.originalPrice && listing.originalPrice > getPrice()) return listing.originalPrice;
    // No fake original prices - only show if there's actual discount
    return null;
  };

  // Get unit with fallback
  const getUnit = () => listing.unit || listing.quantityUnit || 'kg';

  // Get rating - return actual rating or null (no fake 4.2)
  const getRating = () => {
    const rating = parseFloat(listing.rating) || parseFloat(listing.averageRating);
    return rating > 0 ? rating : null;
  };

  // Get review count - return actual count only
  const getReviewCount = () => listing.reviewCount || 0;

  // Get seller name
  const getSellerName = () => {
    if (listing.sellerName) return listing.sellerName;
    if (listing.farmerName) return listing.farmerName;
    return 'AgriLink';
  };

  // Check if sold by AgriLink
  const isSoldByAgriLink = () => {
    return (!listing.sellerName && !listing.farmerName) || 
           listing.sellerEmail === 'products@agrilink.com' ||
           getSellerName() === 'AgriLink';
  };

  // Check stock status
  const getStockStatus = () => {
    if (listing.quantity <= 0) return 'out-of-stock';
    if (listing.quantity <= 5) return 'low-stock';
    if (listing.quantity <= 10) return 'limited';
    return 'in-stock';
  };

  // Format price for Indian currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Handle wishlist click - memoized to prevent re-renders
  const handleWishlistClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(e, listing);
    }
  }, [onToggleWishlist, listing]);

  // Handle add to cart - memoized
  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(e, listing);
    }
  }, [onAddToCart, listing]);

  // Handle quick view - memoized
  const handleQuickView = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(listing);
    }
  }, [onQuickView, listing]);

  const imageUrl = getImageUrl();
  const price = getPrice();
  const originalPrice = getOriginalPrice();
  const discount = calculateDiscount();
  const unit = getUnit();
  const rating = getRating();
  const reviewCount = getReviewCount();
  const sellerName = getSellerName();
  const stockStatus = getStockStatus();

  return (
    <Link
      to={`/marketplace/${listing.id}`}
      className={`product-card-v2 ${viewMode} ${stockStatus}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="pc-image-container">
        {/* Loading skeleton */}
        {!imageLoaded && imageUrl && (
          <div className="pc-image-skeleton">
            <div className="skeleton-shimmer"></div>
          </div>
        )}
        
        {/* Product Image - explicit dimensions prevent layout shift */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            width={300}
            height={300}
            loading="lazy"
            decoding="async"
            className={`pc-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.style.display = 'none';
              setImageLoaded(true);
            }}
          />
        ) : (
          <div className="pc-no-image">
            <FiShoppingCart className="no-image-icon" />
            <span>No Image</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="pc-badges-top">
          {discount > 0 && (
            <span className="pc-badge discount">
              <BsLightningFill /> {discount}% OFF
            </span>
          )}
          {(listing.organicCertified || listing.isOrganic) && (
            <span className="pc-badge organic">
              <IoLeafOutline /> Organic
            </span>
          )}
        </div>

        {/* Bottom Badges */}
        <div className="pc-badges-bottom">
          {stockStatus === 'low-stock' && (
            <span className="pc-badge low-stock">
              <FiZap /> Only {listing.quantity} left!
            </span>
          )}
          {stockStatus === 'limited' && (
            <span className="pc-badge limited">
              <FiClock /> Limited Stock
            </span>
          )}
          {stockStatus === 'out-of-stock' && (
            <span className="pc-badge out-of-stock">
              Out of Stock
            </span>
          )}
          {listing.qualityGrade === 'A+' && (
            <span className="pc-badge premium">
              <BsStarFill /> Premium
            </span>
          )}
        </div>

        {/* Hover Actions */}
        <div className={`pc-hover-actions ${isHovered ? 'visible' : ''}`}>
          <button
            className={`pc-action-btn wishlist ${isWishlisted ? 'active' : ''}`}
            onClick={handleWishlistClick}
            disabled={wishlistLoading}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <FiHeart />
          </button>
          <button
            className="pc-action-btn quick-view"
            onClick={handleQuickView}
            title="Quick View"
          >
            <FiEye />
          </button>
          <button
            className="pc-action-btn share"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.share?.({
                title: listing.title,
                url: window.location.origin + '/marketplace/' + listing.id
              });
            }}
            title="Share"
          >
            <FiShare2 />
          </button>
        </div>

        {/* Floating Wishlist (always visible on mobile) */}
        <button
          className={`pc-wishlist-float ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          disabled={wishlistLoading}
        >
          <FiHeart />
        </button>
      </div>

      {/* Content Section */}
      <div className="pc-content">
        {/* Category */}
        {listing.categoryName && (
          <span className="pc-category">{listing.categoryName}</span>
        )}

        {/* Title */}
        <h3 className="pc-title">{listing.title}</h3>

        {/* Rating - Only show if product has reviews */}
        {rating && reviewCount > 0 ? (
          <div className="pc-rating">
            <div className="pc-rating-badge">
              <span className="rating-value">{rating.toFixed(1)}</span>
              <FiStar className="rating-star" />
            </div>
            <span className="pc-rating-divider">|</span>
            <span className="pc-review-count">{reviewCount.toLocaleString()} reviews</span>
          </div>
        ) : (
          <div className="pc-rating pc-new-product">
            <span className="pc-new-badge">New Arrival</span>
          </div>
        )}

        {/* Price Section */}
        <div className="pc-price-section">
          <div className="pc-price-main">
            <span className="pc-price-current">{formatPrice(price)}</span>
            <span className="pc-price-unit">/{unit}</span>
          </div>
          {originalPrice && discount > 0 && (
            <div className="pc-price-discount">
              <span className="pc-price-original">{formatPrice(originalPrice)}</span>
              <span className="pc-price-save">Save {formatPrice(originalPrice - price)}</span>
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="pc-delivery">
          <FiTruck className="delivery-icon" />
          <span>FREE Delivery</span>
          <span className="delivery-highlight">Tomorrow</span>
        </div>

        {/* Seller Info */}
        <div className="pc-seller">
          {isSoldByAgriLink() ? (
            <>
              <MdVerifiedUser className="verified-icon agrilink" />
              <span className="seller-name">Sold by <strong>AgriLink</strong></span>
              <span className="seller-badge agrilink">Trusted</span>
            </>
          ) : (
            <>
              <FiCheck className="verified-icon" />
              <span className="seller-name">By {sellerName}</span>
              <span className="seller-badge verified">Verified Farmer</span>
            </>
          )}
        </div>

        {/* Additional Info - List View */}
        {viewMode === 'list' && (
          <div className="pc-description">
            <p>{listing.description?.substring(0, 150)}...</p>
            <div className="pc-specs">
              {listing.location && (
                <span className="spec-item">📍 {listing.location}</span>
              )}
              {listing.harvestDate && (
                <span className="spec-item">📅 Harvested: {new Date(listing.harvestDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="pc-trust-badges">
          <span className="trust-badge">
            <FiShield /> Quality Assured
          </span>
          <span className="trust-badge">
            <MdLocalOffer /> Best Price
          </span>
        </div>
      </div>

      {/* Add to Cart Section */}
      <div className="pc-cart-section">
        <button
          className={`pc-add-to-cart ${stockStatus === 'out-of-stock' ? 'disabled' : ''}`}
          onClick={handleAddToCart}
          disabled={cartLoading || stockStatus === 'out-of-stock'}
        >
          {cartLoading ? (
            <span className="btn-loading-spinner"></span>
          ) : stockStatus === 'out-of-stock' ? (
            <>
              <FiShoppingCart /> Out of Stock
            </>
          ) : (
            <>
              <FiShoppingCart /> Add to Cart
            </>
          )}
        </button>

        {/* Buy Now - only in list view */}
        {viewMode === 'list' && stockStatus !== 'out-of-stock' && (
          <button
            className="pc-buy-now"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart(e);
              // Navigate to checkout could be added here
            }}
          >
            <IoFlash /> Buy Now
          </button>
        )}
      </div>
    </Link>
  );
};

// Custom comparison function for memo - only re-render when relevant props change
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.isWishlisted === nextProps.isWishlisted &&
    prevProps.wishlistLoading === nextProps.wishlistLoading &&
    prevProps.cartLoading === nextProps.cartLoading
  );
};

// Memoize with custom comparison to prevent unnecessary re-renders
export default memo(ProductCard, arePropsEqual);
