import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiStar, FiTrendingUp, FiZap, FiGift } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { marketplaceApi } from '../services/api';
import cartService from '../services/cartService';
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
      // Try to fetch real deals from marketplace
      const response = await marketplaceApi.get('/listings/deals').catch(() => null);
      
      if (response?.data?.data) {
        setFlashDeals(response.data.data.flash || []);
        setDailyDeals(response.data.data.daily || []);
        setWeeklyOffers(response.data.data.weekly || []);
      } else {
        // Use mock data
        setFlashDeals(getMockDeals('flash'));
        setDailyDeals(getMockDeals('daily'));
        setWeeklyOffers(getMockDeals('weekly'));
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      setFlashDeals(getMockDeals('flash'));
      setDailyDeals(getMockDeals('daily'));
      setWeeklyOffers(getMockDeals('weekly'));
    } finally {
      setLoading(false);
    }
  };

  const getMockDeals = (type) => {
    const baseDeals = [
      {
        id: '1',
        title: 'Fresh Organic Tomatoes',
        originalPrice: 80,
        discountedPrice: 49,
        discount: 39,
        unit: 'kg',
        imageUrl: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=300',
        farmerName: 'Green Valley Farms',
        rating: 4.8,
        reviewCount: 156,
        stock: 45,
        sold: 234
      },
      {
        id: '2',
        title: 'Premium Basmati Rice',
        originalPrice: 150,
        discountedPrice: 99,
        discount: 34,
        unit: 'kg',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=300',
        farmerName: 'Punjab Grains',
        rating: 4.9,
        reviewCount: 289,
        stock: 120,
        sold: 567
      },
      {
        id: '3',
        title: 'Organic Honey',
        originalPrice: 450,
        discountedPrice: 299,
        discount: 33,
        unit: '500g',
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300',
        farmerName: 'Mountain Bee Farm',
        rating: 4.7,
        reviewCount: 198,
        stock: 30,
        sold: 145
      },
      {
        id: '4',
        title: 'Fresh Spinach Bundle',
        originalPrice: 60,
        discountedPrice: 35,
        discount: 42,
        unit: 'bundle',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300',
        farmerName: 'Green Roots',
        rating: 4.6,
        reviewCount: 87,
        stock: 78,
        sold: 312
      },
      {
        id: '5',
        title: 'Alphonso Mangoes',
        originalPrice: 350,
        discountedPrice: 249,
        discount: 29,
        unit: 'dozen',
        imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300',
        farmerName: 'Ratnagiri Farms',
        rating: 4.9,
        reviewCount: 456,
        stock: 25,
        sold: 890
      },
      {
        id: '6',
        title: 'Farm Fresh Eggs',
        originalPrice: 120,
        discountedPrice: 89,
        discount: 26,
        unit: 'tray',
        imageUrl: 'https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?w=300',
        farmerName: 'Happy Hens Farm',
        rating: 4.8,
        reviewCount: 234,
        stock: 60,
        sold: 423
      }
    ];
    
    return baseDeals.map((deal, i) => ({
      ...deal,
      id: `${type}-${deal.id}`,
      discount: type === 'flash' ? deal.discount + 10 : deal.discount
    }));
  };

  const handleAddToCart = async (deal) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await cartService.addToCart({
        listingId: deal.id,
        sellerId: deal.sellerId || deal.farmerId,
        quantity: 1,
        unitPrice: deal.price,
        listingTitle: deal.title,
        listingImageUrl: deal.image || deal.imageUrl || null,
        unit: deal.unit || 'kg',
        availableQuantity: deal.stock || null
      });
      alert('Added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart. Please try again.');
    }
  };

  const handleAddToWishlist = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await marketplaceApi.post(`/wishlist/${productId}`);
      alert('Added to wishlist!');
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      alert('Failed to add to wishlist. Please try again.');
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
          onAddToWishlist(deal.id);
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
