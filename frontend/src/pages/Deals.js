import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiStar, FiTrendingUp, FiZap, FiGift } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { marketplaceApi } from '../services/api';
import cartService from '../services/cartService';
import guestService from '../services/guestService';
import { toast } from 'react-toastify';
import './Deals.css';

const Deals = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [flashDeals, setFlashDeals] = useState([]);
  const [dailyDeals, setDailyDeals] = useState([]);
  const [weeklyOffers, setWeeklyOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 45, seconds: 30 });

  useEffect(() => {
    fetchDeals();
    
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      // Fetch real listings from marketplace and treat them as deals
      const [topRes, recentRes] = await Promise.all([
        marketplaceApi.get('/listings/top?limit=6').catch(() => null),
        marketplaceApi.get('/listings/recent?limit=6').catch(() => null)
      ]);
      
      const topListings = topRes?.data?.data || [];
      const recentListings = recentRes?.data?.data || [];
      
      if (topListings.length > 0 || recentListings.length > 0) {
        // Format listings as deals with calculated discounts
        const formatAsDeal = (listing, type, index) => ({
          id: listing.id || `${type}-${index}`,
          title: listing.title,
          originalPrice: parseFloat(listing.originalPrice) || parseFloat(listing.price) * 1.3,
          discountedPrice: parseFloat(listing.price),
          discount: listing.originalPrice 
            ? Math.round((1 - parseFloat(listing.price) / parseFloat(listing.originalPrice)) * 100)
            : Math.round(Math.random() * 20 + 10), // 10-30% fake discount for display
          unit: listing.unit || 'kg',
          imageUrl: listing.imageUrl || listing.images?.[0] || 'https://via.placeholder.com/300',
          farmerName: listing.sellerName || listing.farmerName || 'Local Farmer',
          rating: listing.rating || 4.5,
          reviewCount: listing.reviewCount || 0,
          stock: parseFloat(listing.quantity) || listing.availableQuantity || 0,
          sold: listing.soldCount || 0,
          sellerId: listing.sellerId
        });
        
        // Use top listings for flash deals (highest discount impression)
        setFlashDeals(topListings.slice(0, 6).map((l, i) => ({
          ...formatAsDeal(l, 'flash', i),
          discount: Math.min(formatAsDeal(l, 'flash', i).discount + 10, 50) // Boost discount for flash
        })));
        
        // Use recent listings for daily deals
        setDailyDeals(recentListings.slice(0, 6).map((l, i) => formatAsDeal(l, 'daily', i)));
        
        // Mix both for weekly offers
        const weeklyItems = [...topListings.slice(3), ...recentListings.slice(3)].slice(0, 6);
        setWeeklyOffers(weeklyItems.map((l, i) => formatAsDeal(l, 'weekly', i)));
      } else {
        // No listings available - show empty state
        setFlashDeals([]);
        setDailyDeals([]);
        setWeeklyOffers([]);
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      // Show empty state on error
      setFlashDeals([]);
      setDailyDeals([]);
      setWeeklyOffers([]);
    } finally {
      setLoading(false);
    }
  };

  // Note: getMockDeals removed - now using real listing data

  const handleAddToCart = async (deal) => {
    const cartItem = {
      listingId: deal.id,
      sellerId: deal.sellerId || deal.farmerId,
      quantity: 1,
      unitPrice: deal.discountedPrice || deal.price,
      listingTitle: deal.title,
      listingImageUrl: deal.image || deal.imageUrl || null,
      unit: deal.unit || 'kg',
      availableQuantity: deal.stock || null
    };
    
    if (!isAuthenticated) {
      // Guest user - use localStorage
      guestService.addToGuestCart(cartItem);
      toast.success('Added to cart!');
      return;
    }
    
    try {
      await cartService.addToCart(cartItem);
      toast.success('Added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!isAuthenticated) {
      // Guest user - use localStorage
      const wishlistItem = {
        id: product.id,
        listingId: product.id,
        title: product.title,
        price: product.discountedPrice || product.price,
        imageUrl: product.image || product.imageUrl,
        unit: product.unit || 'kg',
        sellerId: product.sellerId || product.farmerId
      };
      guestService.addToGuestWishlist(wishlistItem);
      toast.success('Added to wishlist!');
      return;
    }
    
    try {
      await marketplaceApi.post(`/wishlist/${product.id}`);
      toast.success('Added to wishlist!');
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      toast.error('Failed to add to wishlist. Please try again.');
    }
  };

  return (
    <div className="deals-page">
      {/* Header Banner */}
      <section className="deals-banner">
        <div className="banner-content">
          <div className="banner-left">
            <span className="banner-badge"><FiZap /> Flash Sale</span>
            <h1>Today's Best Deals</h1>
            <p>Fresh produce at unbeatable prices. Limited time offers!</p>
          </div>
          <div className="banner-timer">
            <span className="timer-label">Ends in</span>
            <div className="timer-boxes">
              <div className="timer-box">
                <span className="timer-value">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="timer-unit">Hours</span>
              </div>
              <span className="timer-separator">:</span>
              <div className="timer-box">
                <span className="timer-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="timer-unit">Mins</span>
              </div>
              <span className="timer-separator">:</span>
              <div className="timer-box">
                <span className="timer-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="timer-unit">Secs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Deals Section */}
      <section className="deals-section flash-section">
        <div className="section-container">
          <div className="section-header">
            <div className="header-left">
              <FiZap className="section-icon flash" />
              <div>
                <h2>Flash Deals</h2>
                <p>Up to 50% off - Limited stock!</p>
              </div>
            </div>
            <Link to="/marketplace?sort=discount" className="view-all">View All →</Link>
          </div>
          
          <div className="deals-grid">
            {loading ? (
              [...Array(6)].map((_, i) => <DealCardSkeleton key={i} />)
            ) : flashDeals.length === 0 ? (
              <div className="deals-empty-inline">
                <p>No flash deals available right now. Check back soon!</p>
              </div>
            ) : (
              flashDeals.map(deal => (
                <DealCard 
                  key={deal.id} 
                  deal={deal}
                  isFlash
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Category Deals Banner */}
      <section className="category-deals">
        <div className="section-container">
          <div className="category-grid">
            <Link to="/marketplace?category=VEGETABLES&discount=true" className="category-deal vegetables">
              <div className="deal-info">
                <span className="deal-label">Vegetables</span>
                <span className="deal-discount">Up to 40% off</span>
              </div>
              <img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200" alt="Vegetables" />
            </Link>
            <Link to="/marketplace?category=FRUITS&discount=true" className="category-deal fruits">
              <div className="deal-info">
                <span className="deal-label">Fresh Fruits</span>
                <span className="deal-discount">Up to 35% off</span>
              </div>
              <img src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200" alt="Fruits" />
            </Link>
            <Link to="/marketplace?category=DAIRY&discount=true" className="category-deal dairy">
              <div className="deal-info">
                <span className="deal-label">Dairy Products</span>
                <span className="deal-discount">Up to 25% off</span>
              </div>
              <img src="https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200" alt="Dairy" />
            </Link>
            <Link to="/marketplace?category=ORGANIC&discount=true" className="category-deal organic">
              <div className="deal-info">
                <span className="deal-label">Organic Range</span>
                <span className="deal-discount">Up to 30% off</span>
              </div>
              <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=200" alt="Organic" />
            </Link>
          </div>
        </div>
      </section>

      {/* Daily Deals Section */}
      <section className="deals-section daily-section">
        <div className="section-container">
          <div className="section-header">
            <div className="header-left">
              <FiGift className="section-icon daily" />
              <div>
                <h2>Daily Deals</h2>
                <p>Refreshed every 24 hours</p>
              </div>
            </div>
            <Link to="/marketplace?sort=daily-deal" className="view-all">View All →</Link>
          </div>
          
          <div className="deals-grid">
            {loading ? (
              [...Array(6)].map((_, i) => <DealCardSkeleton key={i} />)
            ) : dailyDeals.length === 0 ? (
              <div className="deals-empty-inline">
                <p>No daily deals available. New deals coming soon!</p>
              </div>
            ) : (
              dailyDeals.map(deal => (
                <DealCard 
                  key={deal.id} 
                  deal={deal}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Weekly Offers Section */}
      <section className="deals-section weekly-section">
        <div className="section-container">
          <div className="section-header">
            <div className="header-left">
              <FiTrendingUp className="section-icon weekly" />
              <div>
                <h2>Weekly Specials</h2>
                <p>Best prices of the week</p>
              </div>
            </div>
            <Link to="/marketplace?sort=weekly-special" className="view-all">View All →</Link>
          </div>
          
          <div className="deals-grid">
            {loading ? (
              [...Array(6)].map((_, i) => <DealCardSkeleton key={i} />)
            ) : weeklyOffers.length === 0 ? (
              <div className="deals-empty-inline">
                <p>No weekly specials available right now. Check back soon!</p>
              </div>
            ) : (
              weeklyOffers.map(deal => (
                <DealCard 
                  key={deal.id} 
                  deal={deal}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <div className="newsletter-text">
            <h2>Never Miss a Deal!</h2>
            <p>Subscribe to get daily deal alerts and exclusive offers</p>
          </div>
          <form className="newsletter-form">
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
};

// Deal Card Component
const DealCard = ({ deal, isFlash, onAddToCart, onAddToWishlist }) => {
  const navigate = useNavigate();
  const stockPercentage = Math.round((deal.sold / (deal.sold + deal.stock)) * 100);

  return (
    <div className="deal-card" onClick={() => navigate(`/marketplace/${deal.id}`)}>
      {/* Discount Badge */}
      <span className={`discount-badge ${isFlash ? 'flash' : ''}`}>
        -{deal.discount}%
      </span>
      
      {/* Wishlist Button */}
      <button 
        className="wishlist-btn"
        onClick={(e) => {
          e.stopPropagation();
          onAddToWishlist(deal);
        }}
      >
        <FiHeart />
      </button>
      
      {/* Product Image */}
      <div className="deal-image">
        <img src={deal.imageUrl} alt={deal.title} />
        {isFlash && <span className="flash-badge"><FiZap /> Flash</span>}
      </div>
      
      {/* Product Info */}
      <div className="deal-info">
        <span className="deal-farmer">{deal.farmerName}</span>
        <h3 className="deal-title">{deal.title}</h3>
        
        <div className="deal-rating">
          <FiStar className="star" />
          <span>{deal.rating}</span>
          <span className="review-count">({deal.reviewCount})</span>
        </div>
        
        <div className="deal-price">
          <span className="discounted-price">₹{deal.discountedPrice}</span>
          <span className="original-price">₹{deal.originalPrice}</span>
          <span className="unit">/{deal.unit}</span>
        </div>
        
        {/* Stock Progress */}
        <div className="stock-info">
          <div className="stock-bar">
            <div 
              className="stock-fill" 
              style={{ width: `${stockPercentage}%` }}
            ></div>
          </div>
          <span className="stock-text">{deal.sold} sold | {deal.stock} left</span>
        </div>
        
        <button 
          className="add-to-cart-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(deal);
          }}
        >
          <FiShoppingCart /> Add to Cart
        </button>
      </div>
    </div>
  );
};

// Skeleton Loading Component
const DealCardSkeleton = () => (
  <div className="deal-card-skeleton">
    <div className="skeleton-image"></div>
    <div className="skeleton-content">
      <div className="skeleton-text short"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
      <div className="skeleton-text"></div>
    </div>
  </div>
);

export default Deals;
