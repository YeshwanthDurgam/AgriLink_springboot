import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';
import guestService from '../services/guestService';
import marketplaceService from '../services/marketplaceService';
import EmptyState from '../components/EmptyState';
import { 
  FiShoppingCart, FiTrash2, FiHeart, FiCheck, FiTruck, 
  FiShield, FiTag, FiChevronRight, FiMinus, FiPlus,
  FiAlertCircle, FiGift, FiClock, FiPackage
} from 'react-icons/fi';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [savedForLater, setSavedForLater] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);

  const isGuest = !user;
  const isFarmer = user?.roles?.includes('FARMER');

  // Available coupons for demo
  const AVAILABLE_COUPONS = {
    'FRESH10': { discount: 10, type: 'percentage', minOrder: 500, description: '10% off on orders above ₹500' },
    'SAVE50': { discount: 50, type: 'flat', minOrder: 300, description: '₹50 off on orders above ₹300' },
    'FIRST100': { discount: 100, type: 'flat', minOrder: 0, description: '₹100 off for first order' },
    'FARM20': { discount: 20, type: 'percentage', minOrder: 1000, description: '20% off on orders above ₹1000' }
  };

  // Block farmers from accessing cart
  useEffect(() => {
    if (isFarmer) {
      toast.error('Farmers cannot use the cart feature');
      navigate('/farmer/dashboard');
      return;
    }
  }, [isFarmer, navigate]);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (isGuest) {
        const guestCart = guestService.getGuestCart();
        setCart(guestCart);
        // Select all items by default
        const allIds = new Set(guestCart.items?.map(item => item.listingId) || []);
        setSelectedItems(allIds);
      } else {
        const data = await cartService.getCart();
        setCart(data);
        const allIds = new Set(data.items?.map(item => item.listingId) || []);
        setSelectedItems(allIds);
      }

      // Load saved for later from localStorage
      const saved = JSON.parse(localStorage.getItem('savedForLater') || '[]');
      setSavedForLater(saved);

      // Calculate delivery estimate
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3); // 3 days delivery
      const expressDate = new Date();
      expressDate.setDate(expressDate.getDate() + 1); // 1 day express
      setDeliveryEstimate({
        standard: deliveryDate,
        express: expressDate
      });

    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await marketplaceService.getListings({ limit: 6 });
        if (response?.content) {
          setRecommendations(response.content.slice(0, 6));
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      }
    };
    fetchRecommendations();
  }, []);

  useEffect(() => {
    if (!isFarmer) {
      fetchCart();
    }
  }, [isFarmer, fetchCart]);

  // Listen for guest cart updates
  useEffect(() => {
    if (isGuest) {
      const handleGuestCartUpdate = (event) => {
        setCart(event.detail);
      };
      window.addEventListener('guestCartUpdated', handleGuestCartUpdate);
      return () => window.removeEventListener('guestCartUpdated', handleGuestCartUpdate);
    }
  }, [isGuest]);

  const handleUpdateQuantity = async (listingId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(prev => ({ ...prev, [listingId]: true }));
    try {
      let updatedCart;
      if (isGuest) {
        updatedCart = guestService.updateGuestCartItem(listingId, newQuantity);
      } else {
        updatedCart = await cartService.updateCartItem(listingId, newQuantity);
      }
      setCart(updatedCart);
    } catch (err) {
      console.error('Error updating quantity:', err);
      toast.error('Failed to update quantity');
    } finally {
      setUpdating(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const handleRemoveItem = async (listingId) => {
    setUpdating(prev => ({ ...prev, [listingId]: true }));
    try {
      let updatedCart;
      if (isGuest) {
        updatedCart = guestService.removeFromGuestCart(listingId);
      } else {
        updatedCart = await cartService.removeFromCart(listingId);
      }
      setCart(updatedCart);
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });
      toast.success('Item removed from cart');
    } catch (err) {
      console.error('Error removing item:', err);
      toast.error('Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    
    try {
      if (isGuest) {
        guestService.clearGuestCart();
      } else {
        await cartService.clearCart();
      }
      setCart({ items: [], totalAmount: 0, totalItems: 0 });
      setSelectedItems(new Set());
      toast.success('Cart cleared');
    } catch (err) {
      console.error('Error clearing cart:', err);
      toast.error('Failed to clear cart');
    }
  };

  const handleSaveForLater = (item) => {
    // Add to saved for later
    const newSaved = [...savedForLater, item];
    setSavedForLater(newSaved);
    localStorage.setItem('savedForLater', JSON.stringify(newSaved));
    
    // Remove from cart
    handleRemoveItem(item.listingId);
    toast.success('Item saved for later');
  };

  const handleMoveToCart = async (item) => {
    try {
      if (isGuest) {
        guestService.addToGuestCart(item);
        setCart(guestService.getGuestCart());
      } else {
        await cartService.addToCart(item.listingId, 1);
        const updatedCart = await cartService.getCart();
        setCart(updatedCart);
      }
      
      // Remove from saved for later
      const newSaved = savedForLater.filter(i => i.listingId !== item.listingId);
      setSavedForLater(newSaved);
      localStorage.setItem('savedForLater', JSON.stringify(newSaved));
      
      toast.success('Item moved to cart');
    } catch (err) {
      console.error('Error moving to cart:', err);
      toast.error('Failed to move item to cart');
    }
  };

  const handleRemoveSaved = (listingId) => {
    const newSaved = savedForLater.filter(i => i.listingId !== listingId);
    setSavedForLater(newSaved);
    localStorage.setItem('savedForLater', JSON.stringify(newSaved));
    toast.success('Item removed');
  };

  const handleSelectItem = (listingId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const items = cart?.items || [];
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.listingId)));
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const coupon = AVAILABLE_COUPONS[couponCode.toUpperCase()];
      if (coupon) {
        if (getSelectedSubtotal() >= coupon.minOrder) {
          setAppliedCoupon({ code: couponCode.toUpperCase(), ...coupon });
          toast.success(`Coupon applied! ${coupon.description}`);
        } else {
          toast.error(`Minimum order amount is ₹${coupon.minOrder}`);
        }
      } else {
        toast.error('Invalid coupon code');
      }
      setCouponLoading(false);
    }, 500);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to checkout');
      return;
    }

    if (isGuest) {
      toast.info('Please login to proceed with checkout');
      navigate('/login', { state: { from: '/checkout', message: 'Please login to complete your purchase' } });
    } else {
      navigate('/checkout');
    }
  };

  // Calculate totals for selected items only
  const getSelectedSubtotal = () => {
    const items = cart?.items || [];
    return items
      .filter(item => selectedItems.has(item.listingId))
      .reduce((sum, item) => sum + (item.subtotal || item.quantity * (item.price || item.unitPrice)), 0);
  };

  const getSelectedItemsCount = () => {
    const items = cart?.items || [];
    return items
      .filter(item => selectedItems.has(item.listingId))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getSelectedSubtotal();
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.discount) / 100;
    }
    return appliedCoupon.discount;
  };

  const getDeliveryCharge = () => {
    const subtotal = getSelectedSubtotal();
    if (subtotal >= 500) return 0; // Free delivery above ₹500
    return 40;
  };

  const getTotalSavings = () => {
    const items = cart?.items || [];
    const savings = items
      .filter(item => selectedItems.has(item.listingId))
      .reduce((sum, item) => {
        const mrp = (item.originalPrice || item.price * 1.2) * item.quantity;
        const actual = item.subtotal || item.quantity * (item.price || item.unitPrice);
        return sum + (mrp - actual);
      }, 0);
    return savings + getCouponDiscount();
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-skeleton">
            <div className="skeleton-header">
              <div className="skeleton-title"></div>
            </div>
            <div className="cart-content">
              <div className="cart-items-section">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-item">
                    <div className="skeleton-checkbox"></div>
                    <div className="skeleton-image"></div>
                    <div className="skeleton-details">
                      <div className="skeleton-line w-80"></div>
                      <div className="skeleton-line w-50"></div>
                      <div className="skeleton-line w-30"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="skeleton-summary">
                <div className="skeleton-line w-100"></div>
                <div className="skeleton-line w-80"></div>
                <div className="skeleton-line w-60"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-error">
            <FiAlertCircle className="error-icon" />
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={fetchCart} className="btn btn-primary">
              <FiPackage /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;
  const allSelected = items.length > 0 && selectedItems.size === items.length;

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Breadcrumb */}
        <div className="cart-breadcrumb">
          <Link to="/">Home</Link>
          <FiChevronRight />
          <span>Shopping Cart</span>
        </div>

        {/* Guest Notice Banner */}
        {isGuest && (
          <div className="guest-banner">
            <div className="guest-banner-content">
              <FiAlertCircle />
              <div>
                <strong>You're shopping as a guest</strong>
                <p>Sign in to save your cart and enjoy faster checkout</p>
              </div>
            </div>
            <Link to="/login" state={{ from: '/cart' }} className="btn btn-signin">
              Sign In
            </Link>
          </div>
        )}

        {isEmpty ? (
          <div className="cart-empty-state">
            <EmptyState 
              type="cart"
              actionText="Browse Marketplace"
              actionLink="/marketplace"
            />

            {/* Show recommendations even when cart is empty */}
            {recommendations.length > 0 && (
              <div className="recommendations-section">
                <h2>Recommended for you</h2>
                <div className="recommendations-grid">
                  {recommendations.map(item => (
                    <Link to={`/marketplace/${item.id}`} key={item.id} className="recommendation-card">
                      <div className="recommendation-image">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} />
                        ) : (
                          <div className="placeholder-image">🌾</div>
                        )}
                      </div>
                      <div className="recommendation-info">
                        <h4>{item.title}</h4>
                        <div className="recommendation-price">₹{item.pricePerUnit?.toFixed(2)}/{item.unit}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Cart Header */}
            <div className="cart-header">
              <h1>
                <FiShoppingCart /> Shopping Cart
                <span className="item-count">({cart.totalItems || items.length} items)</span>
              </h1>
              <button onClick={handleClearCart} className="btn btn-ghost btn-clear">
                <FiTrash2 /> Clear Cart
              </button>
            </div>

            <div className="cart-content">
              {/* Cart Items Section */}
              <div className="cart-items-section">
                {/* Select All Bar */}
                <div className="select-all-bar">
                  <label className="checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      checked={allSelected}
                      onChange={handleSelectAll}
                    />
                    <span className="checkmark"></span>
                    <span className="select-text">
                      {allSelected ? 'Deselect all items' : `Select all items (${items.length})`}
                    </span>
                  </label>
                  <span className="price-label">Price</span>
                </div>

                {/* Cart Items */}
                <div className="cart-items">
                  {items.map(item => (
                    <div key={item.listingId} className={`cart-item ${updating[item.listingId] ? 'updating' : ''}`}>
                      <div className="item-select">
                        <label className="checkbox-wrapper">
                          <input 
                            type="checkbox"
                            checked={selectedItems.has(item.listingId)}
                            onChange={() => handleSelectItem(item.listingId)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </div>

                      <div className="item-image">
                        <Link to={`/marketplace/${item.listingId}`}>
                          {(item.imageUrl || item.listingImageUrl) ? (
                            <img src={item.imageUrl || item.listingImageUrl} alt={item.productName || item.listingTitle} />
                          ) : (
                            <div className="placeholder-image">🌾</div>
                          )}
                        </Link>
                      </div>
                      
                      <div className="item-details">
                        <Link to={`/marketplace/${item.listingId}`} className="item-title">
                          {item.productName || item.listingTitle || 'Product'}
                        </Link>
                        
                        {item.sellerName && (
                          <div className="item-seller">
                            Sold by: <span>{item.sellerName}</span>
                          </div>
                        )}

                        <div className="item-availability">
                          {(item.availableQuantity || 100) > 10 ? (
                            <span className="in-stock"><FiCheck /> In Stock</span>
                          ) : (
                            <span className="low-stock">
                              <FiAlertCircle /> Only {item.availableQuantity || 5} left
                            </span>
                          )}
                        </div>

                        <div className="item-delivery">
                          <FiTruck />
                          {deliveryEstimate && (
                            <span>
                              FREE delivery by <strong>{formatDate(deliveryEstimate.standard)}</strong>
                            </span>
                          )}
                        </div>

                        <div className="item-actions">
                          <div className="quantity-selector">
                            <button 
                              onClick={() => handleUpdateQuantity(item.listingId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updating[item.listingId]}
                              className="qty-btn"
                            >
                              <FiMinus />
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button 
                              onClick={() => handleUpdateQuantity(item.listingId, item.quantity + 1)}
                              disabled={updating[item.listingId] || item.quantity >= (item.availableQuantity || 100)}
                              className="qty-btn"
                            >
                              <FiPlus />
                            </button>
                          </div>

                          <span className="action-divider">|</span>
                          
                          <button 
                            onClick={() => handleRemoveItem(item.listingId)}
                            disabled={updating[item.listingId]}
                            className="action-btn delete"
                          >
                            <FiTrash2 /> Delete
                          </button>

                          <span className="action-divider">|</span>

                          <button 
                            onClick={() => handleSaveForLater(item)}
                            className="action-btn save"
                          >
                            <FiHeart /> Save for later
                          </button>
                        </div>
                      </div>

                      <div className="item-price-section">
                        <div className="item-price">
                          ₹{item.subtotal?.toFixed(2) || (item.quantity * (item.price || item.unitPrice)).toFixed(2)}
                        </div>
                        <div className="item-unit-price">
                          ₹{(item.price || item.unitPrice)?.toFixed(2)} / {item.unit || 'unit'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Mobile */}
                <div className="mobile-subtotal">
                  Subtotal ({getSelectedItemsCount()} items): <strong>₹{getSelectedSubtotal().toFixed(2)}</strong>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="cart-summary-section">
                <div className="cart-summary">
                  {/* Free Delivery Notice */}
                  {getSelectedSubtotal() < 500 && getSelectedSubtotal() > 0 && (
                    <div className="free-delivery-notice">
                      <FiTruck />
                      <span>
                        Add ₹{(500 - getSelectedSubtotal()).toFixed(2)} more for <strong>FREE Delivery</strong>
                      </span>
                    </div>
                  )}

                  {getSelectedSubtotal() >= 500 && (
                    <div className="free-delivery-success">
                      <FiCheck />
                      <span>Your order qualifies for <strong>FREE Delivery</strong></span>
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="summary-subtotal">
                    Subtotal ({getSelectedItemsCount()} items): 
                    <span className="subtotal-amount">₹{getSelectedSubtotal().toFixed(2)}</span>
                  </div>

                  {/* Checkout Button */}
                  <button 
                    onClick={handleCheckout} 
                    className="btn btn-checkout"
                    disabled={selectedItems.size === 0}
                  >
                    {isGuest ? 'Sign in to Checkout' : 'Proceed to Checkout'}
                  </button>

                  {/* EMI Notice */}
                  <div className="emi-notice">
                    <FiClock />
                    <span>EMI available on orders above ₹3000</span>
                  </div>
                </div>

                {/* Price Details Card */}
                <div className="price-details-card">
                  <h3>Price Details</h3>
                  
                  <div className="price-row">
                    <span>Price ({getSelectedItemsCount()} items)</span>
                    <span>₹{getSelectedSubtotal().toFixed(2)}</span>
                  </div>

                  <div className="price-row">
                    <span>Delivery Charges</span>
                    {getDeliveryCharge() === 0 ? (
                      <span className="free">FREE</span>
                    ) : (
                      <span>₹{getDeliveryCharge()}</span>
                    )}
                  </div>

                  {appliedCoupon && (
                    <div className="price-row discount">
                      <span>
                        <FiTag /> Coupon Discount ({appliedCoupon.code})
                        <button onClick={handleRemoveCoupon} className="remove-coupon">×</button>
                      </span>
                      <span>-₹{getCouponDiscount().toFixed(2)}</span>
                    </div>
                  )}

                  <div className="price-divider"></div>

                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span>₹{(getSelectedSubtotal() + getDeliveryCharge() - getCouponDiscount()).toFixed(2)}</span>
                  </div>

                  {getTotalSavings() > 0 && (
                    <div className="savings-row">
                      <FiGift />
                      You will save ₹{getTotalSavings().toFixed(2)} on this order
                    </div>
                  )}
                </div>

                {/* Coupon Section */}
                <div className="coupon-section">
                  <h3><FiTag /> Apply Coupon</h3>
                  {appliedCoupon ? (
                    <div className="applied-coupon">
                      <div className="coupon-info">
                        <span className="coupon-code">{appliedCoupon.code}</span>
                        <span className="coupon-desc">{appliedCoupon.description}</span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="btn btn-remove-coupon">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="coupon-input-group">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button 
                        onClick={handleApplyCoupon} 
                        disabled={couponLoading}
                        className="btn btn-apply"
                      >
                        {couponLoading ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  
                  {/* Available Coupons */}
                  <div className="available-coupons">
                    <span className="coupons-title">Try these coupons:</span>
                    <div className="coupon-tags">
                      {Object.keys(AVAILABLE_COUPONS).slice(0, 3).map(code => (
                        <button 
                          key={code}
                          onClick={() => setCouponCode(code)}
                          className="coupon-tag"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="trust-badges">
                  <div className="trust-badge">
                    <FiShield />
                    <span>100% Secure Payment</span>
                  </div>
                  <div className="trust-badge">
                    <FiTruck />
                    <span>Free Returns</span>
                  </div>
                  <div className="trust-badge">
                    <FiCheck />
                    <span>Quality Assured</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Saved for Later Section */}
            {savedForLater.length > 0 && (
              <div className="saved-for-later">
                <h2><FiHeart /> Saved for Later ({savedForLater.length} items)</h2>
                <div className="saved-items">
                  {savedForLater.map(item => (
                    <div key={item.listingId} className="saved-item">
                      <div className="saved-image">
                        {(item.imageUrl || item.listingImageUrl) ? (
                          <img src={item.imageUrl || item.listingImageUrl} alt={item.productName || item.listingTitle} />
                        ) : (
                          <div className="placeholder-image">🌾</div>
                        )}
                      </div>
                      <div className="saved-details">
                        <Link to={`/marketplace/${item.listingId}`} className="saved-title">
                          {item.productName || item.listingTitle || item.title || 'Product'}
                        </Link>
                        <div className="saved-price">
                          ₹{(item.pricePerUnit || item.unitPrice || item.price || 0).toFixed(2)} / {item.quantityUnit || item.unit || 'kg'}
                        </div>
                        <div className="saved-actions">
                          <button onClick={() => handleMoveToCart(item)} className="btn btn-move">
                            Move to Cart
                          </button>
                          <button onClick={() => handleRemoveSaved(item.listingId)} className="btn btn-remove-saved">
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <div className="recommendations-section">
                <h2>Customers who bought these also bought</h2>
                <div className="recommendations-grid">
                  {recommendations.map(item => (
                    <Link to={`/marketplace/${item.id}`} key={item.id} className="recommendation-card">
                      <div className="recommendation-image">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} />
                        ) : (
                          <div className="placeholder-image">🌾</div>
                        )}
                      </div>
                      <div className="recommendation-info">
                        <h4>{item.title}</h4>
                        <div className="recommendation-price">₹{item.pricePerUnit?.toFixed(2)}/{item.unit}</div>
                        {item.rating && (
                          <div className="recommendation-rating">
                            {'⭐'.repeat(Math.floor(item.rating))} ({item.reviewCount || 0})
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
