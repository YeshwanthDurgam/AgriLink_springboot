import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiChevronLeft, FiChevronRight, FiStar, FiShoppingCart, FiHeart, 
  FiPackage, FiTruck, FiShield, FiCheckCircle, FiClock,
  FiZap, FiMapPin, FiArrowRight
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { marketplaceApi } from '../services/api';
import guestService from '../services/guestService';
import { toast } from 'react-toastify';
import SearchBar from '../components/SearchBar';
import './Home.css';

// ============= CONSTANTS =============
const BANNER_SLIDES = [
  {
    id: 1,
    title: "Fresh From Farm To Your Doorstep",
    subtitle: "Connect directly with local farmers. Get the freshest produce at the best prices.",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200",
    buttonText: "Shop Now",
    buttonLink: "/marketplace",
    bgColor: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
  },
  {
    id: 2,
    title: "Organic Vegetables at 20% Off",
    subtitle: "Fresh, chemical-free vegetables sourced directly from organic farms.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200",
    buttonText: "Shop Organic",
    buttonLink: "/marketplace?organic=true",
    bgColor: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
  },
  {
    id: 3,
    title: "Support Local Farmers",
    subtitle: "Every purchase helps a farmer. Join 10,000+ conscious consumers.",
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=1200",
    buttonText: "Meet Farmers",
    buttonLink: "/farmers",
    bgColor: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)"
  },
  {
    id: 4,
    title: "Free Delivery on Orders Above ₹500",
    subtitle: "Fast and reliable delivery to your doorstep within 24 hours.",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200",
    buttonText: "Order Now",
    buttonLink: "/marketplace",
    bgColor: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
  }
];

const CATEGORY_IMAGES = {
  'Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300',
  'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300',
  'Grains': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300',
  'Dairy': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300',
  'Spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300',
  'Pulses': 'https://images.unsplash.com/photo-1515543904506-2ef97737f375?w=300',
  'Organic': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300',
  'Seeds': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=300',
  'Nuts': 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=300',
  'Herbs': 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=300'
};

const RECENTLY_VIEWED_KEY = 'agrilink_recently_viewed';

// ============= MAIN COMPONENT =============
const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Banner carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const bannerIntervalRef = useRef(null);
  
  // Deal timer state
  const [dealTimer, setDealTimer] = useState({ hours: 5, minutes: 45, seconds: 30 });

  // ============= EFFECTS =============
  
  // Auto-slide banner
  useEffect(() => {
    bannerIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);
    
    return () => clearInterval(bannerIntervalRef.current);
  }, []);

  // Deal countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDealTimer(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 5, minutes: 45, seconds: 30 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Load recently viewed from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing recently viewed:', e);
      }
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============= DATA FETCHING =============
  
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, topRes, recentRes, farmersRes] = await Promise.all([
        marketplaceApi.get('/categories').catch(() => null),
        marketplaceApi.get('/listings/top?limit=12').catch(() => null),
        marketplaceApi.get('/listings/recent?limit=12').catch(() => null),
        marketplaceApi.get('/listings/sellers').catch(() => null)
      ]);

      // Process categories
      if (categoriesRes?.data?.data) {
        const cats = categoriesRes.data.data.map(cat => ({
          ...cat,
          image: CATEGORY_IMAGES[cat.name] || CATEGORY_IMAGES['Vegetables']
        }));
        setCategories(cats);
        
        // Fetch products for first 3 categories
        if (cats.length > 0) {
          fetchCategoryProducts(cats.slice(0, 3));
        }
      }

      // Process top products
      if (topRes?.data?.data) {
        setTopProducts(formatProducts(topRes.data.data));
      }

      // Process recent products
      if (recentRes?.data?.data) {
        setRecentProducts(formatProducts(recentRes.data.data));
      }

      // Process farmers
      if (farmersRes?.data?.data) {
        setFarmers(farmersRes.data.data.slice(0, 8));
      }

    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryProducts = async (cats) => {
    for (const cat of cats) {
      try {
        const res = await marketplaceApi.get(`/listings/category/${cat.id}?size=8`);
        if (res?.data?.data?.content) {
          setCategoryProducts(prev => ({
            ...prev,
            [cat.id]: formatProducts(res.data.data.content)
          }));
        }
      } catch (err) {
        console.error(`Error fetching products for category ${cat.name}:`, err);
      }
    }
  };

  const formatProducts = (listings) => {
    return listings.map(listing => ({
      id: listing.id,
      title: listing.title,
      price: parseFloat(listing.price) || 0,
      originalPrice: parseFloat(listing.originalPrice) || Math.round(parseFloat(listing.price) * 1.2),
      unit: listing.unit || listing.quantityUnit || 'kg',
      imageUrl: listing.imageUrl || listing.images?.[0]?.imageUrl || 'https://via.placeholder.com/300',
      images: listing.images,
      sellerName: listing.sellerName || 'Local Farmer',
      sellerId: listing.sellerId,
      rating: listing.averageRating || listing.rating || 4.5,
      reviewCount: listing.reviewCount || 0,
      location: listing.location || 'India',
      discount: listing.originalPrice 
        ? Math.round((1 - parseFloat(listing.price) / parseFloat(listing.originalPrice)) * 100)
        : Math.floor(Math.random() * 25) + 5,
      quantity: listing.quantity,
      quantityUnit: listing.quantityUnit || listing.unit
    }));
  };

  // ============= HANDLERS =============
  
  const handleBannerNav = (direction) => {
    clearInterval(bannerIntervalRef.current);
    if (direction === 'next') {
      setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length);
    } else {
      setCurrentSlide(prev => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
    }
    bannerIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);
  };

  const handleDotClick = (index) => {
    clearInterval(bannerIntervalRef.current);
    setCurrentSlide(index);
    bannerIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    const cartItem = {
      listingId: product.id,
      sellerId: product.sellerId,
      quantity: 1,
      unitPrice: product.price,
      listingTitle: product.title,
      listingImageUrl: product.imageUrl,
      unit: product.unit,
      availableQuantity: product.quantity || 100
    };
    
    if (!isAuthenticated) {
      guestService.addToGuestCart(cartItem);
      toast.success('Added to cart!');
      return;
    }
    
    try {
      const cartService = (await import('../services/cartService')).default;
      await cartService.addToCart(cartItem);
      toast.success('Added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add to cart');
    }
  };

  const handleAddToWishlist = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      const wishlistItem = {
        id: product.id,
        listingId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        unit: product.unit,
        sellerId: product.sellerId
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
      toast.error('Failed to add to wishlist');
    }
  };

  const handleProductClick = (product) => {
    // Save to recently viewed
    const viewed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    const filtered = viewed.filter(p => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, 10);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    setRecentlyViewed(updated);
    
    navigate(`/marketplace/${product.id}`);
  };

  // ============= RENDER =============
  
  const currentBanner = BANNER_SLIDES[currentSlide];
  const dealsProducts = topProducts.filter(p => p.discount > 10).slice(0, 6);
  const dealOfTheDay = topProducts.find(p => p.discount > 15) || topProducts[0];

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Loading fresh products...</p>
      </div>
    );
  }

  return (
    <div className="home-page-v2">
      {/* ============= HERO BANNER CAROUSEL ============= */}
      <section className="hero-banner-section" style={{ background: currentBanner?.bgColor }}>
        <div className="banner-container">
          <button className="banner-nav-btn prev" onClick={() => handleBannerNav('prev')}>
            <FiChevronLeft />
          </button>
          
          <div className="banner-content-wrapper">
            <div className="banner-slides">
              {BANNER_SLIDES.map((slide, index) => (
                <div 
                  key={slide.id} 
                  className={`banner-slide ${index === currentSlide ? 'active' : ''}`}
                >
                  <div className="banner-text">
                    <h1>{slide.title}</h1>
                    <p>{slide.subtitle}</p>
                    <Link to={slide.buttonLink} className="banner-cta-btn">
                      {slide.buttonText} <FiArrowRight />
                    </Link>
                  </div>
                  <div className="banner-image">
                    <img src={slide.image} alt={slide.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button className="banner-nav-btn next" onClick={() => handleBannerNav('next')}>
            <FiChevronRight />
          </button>
          
          <div className="banner-dots">
            {BANNER_SLIDES.map((_, index) => (
              <button 
                key={index} 
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>
        </div>
        
        {/* Search Bar Overlay */}
        <div className="banner-search-wrapper">
          <SearchBar 
            placeholder="Search for fresh vegetables, fruits, dairy..."
            showTrending={true}
            className="banner-search"
          />
        </div>
      </section>

      {/* ============= CATEGORY STRIP ============= */}
      <section className="category-strip-section">
        <div className="section-container">
          <div className="category-strip">
            {categories.map(category => (
              <Link 
                key={category.id} 
                to={`/marketplace?categoryId=${category.id}`}
                className="category-strip-item"
              >
                <div className="category-strip-image">
                  <img src={category.image} alt={category.name} />
                </div>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============= FLASH DEALS SECTION ============= */}
      {dealsProducts.length > 0 && (
        <section className="flash-deals-section">
          <div className="section-container">
            <div className="deals-layout">
              {/* Flash Deals */}
              <div className="flash-deals-box">
                <div className="deals-header">
                  <div className="deals-title">
                    <FiZap className="flash-icon" />
                    <h2>Flash Deals</h2>
                  </div>
                  <div className="deals-timer">
                    <FiClock />
                    <span>
                      {String(dealTimer.hours).padStart(2, '0')}:
                      {String(dealTimer.minutes).padStart(2, '0')}:
                      {String(dealTimer.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <div className="flash-deals-grid">
                  {dealsProducts.slice(0, 4).map(product => (
                    <DealCard 
                      key={product.id} 
                      product={product}
                      onAddToCart={handleAddToCart}
                      onClick={() => handleProductClick(product)}
                    />
                  ))}
                </div>
                <Link to="/deals" className="view-all-deals">
                  View All Deals <FiArrowRight />
                </Link>
              </div>
              
              {/* Deal of the Day */}
              {dealOfTheDay && (
                <div className="deal-of-day-box">
                  <div className="dotd-badge">🎯 Deal of the Day</div>
                  <div className="dotd-image" onClick={() => handleProductClick(dealOfTheDay)}>
                    <img src={dealOfTheDay.imageUrl} alt={dealOfTheDay.title} />
                    <span className="dotd-discount">-{dealOfTheDay.discount}%</span>
                  </div>
                  <div className="dotd-info">
                    <h3>{dealOfTheDay.title}</h3>
                    <div className="dotd-price">
                      <span className="dotd-current">₹{dealOfTheDay.price}</span>
                      <span className="dotd-original">₹{dealOfTheDay.originalPrice}</span>
                    </div>
                    <button 
                      className="dotd-add-btn"
                      onClick={(e) => handleAddToCart(e, dealOfTheDay)}
                    >
                      <FiShoppingCart /> Add to Cart
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============= TRENDING PRODUCTS ============= */}
      {topProducts.length > 0 && (
        <ProductCarousel 
          title="🔥 Trending Now"
          subtitle="Most popular products this week"
          products={topProducts}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          onProductClick={handleProductClick}
          viewAllLink="/marketplace?sort=popular"
        />
      )}

      {/* ============= SHOP BY CATEGORY GRID ============= */}
      <section className="category-grid-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <Link to="/marketplace" className="view-all-link">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="category-grid">
            {categories.slice(0, 8).map(category => (
              <Link 
                key={category.id}
                to={`/marketplace?categoryId=${category.id}`}
                className="category-grid-card"
              >
                <div className="category-grid-image">
                  <img src={category.image} alt={category.name} />
                </div>
                <h3>{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============= CATEGORY-SPECIFIC CAROUSELS ============= */}
      {categories.slice(0, 3).map(category => (
        categoryProducts[category.id]?.length > 0 && (
          <ProductCarousel 
            key={category.id}
            title={`Fresh ${category.name}`}
            subtitle={`Discover quality ${category.name.toLowerCase()} from local farms`}
            products={categoryProducts[category.id]}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onProductClick={handleProductClick}
            viewAllLink={`/marketplace?categoryId=${category.id}`}
            bgColor={category.name === 'Vegetables' ? '#f0fff4' : category.name === 'Fruits' ? '#fef3c7' : '#fff'}
          />
        )
      ))}

      {/* ============= TRUST BADGES ============= */}
      <section className="trust-section">
        <div className="section-container">
          <div className="trust-badges-row">
            <div className="trust-badge-item">
              <FiTruck className="trust-icon" />
              <div>
                <h4>Free Delivery</h4>
                <p>On orders above ₹500</p>
              </div>
            </div>
            <div className="trust-badge-item">
              <FiShield className="trust-icon" />
              <div>
                <h4>Secure Payments</h4>
                <p>100% secure checkout</p>
              </div>
            </div>
            <div className="trust-badge-item">
              <FiCheckCircle className="trust-icon" />
              <div>
                <h4>Quality Assured</h4>
                <p>Verified farmers only</p>
              </div>
            </div>
            <div className="trust-badge-item">
              <FiPackage className="trust-icon" />
              <div>
                <h4>Easy Returns</h4>
                <p>7 days return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============= NEW ARRIVALS ============= */}
      {recentProducts.length > 0 && (
        <ProductCarousel 
          title="✨ New Arrivals"
          subtitle="Fresh listings from our farmers"
          products={recentProducts}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          onProductClick={handleProductClick}
          viewAllLink="/marketplace?sort=newest"
          bgColor="#f8fafc"
        />
      )}

      {/* ============= FEATURED FARMERS ============= */}
      {farmers.length > 0 && (
        <section className="farmers-section">
          <div className="section-container">
            <div className="section-header">
              <div>
                <h2>👨‍🌾 Meet Our Farmers</h2>
                <p className="section-subtitle">The people behind your fresh produce</p>
              </div>
              <Link to="/farmers" className="view-all-link">
                View All <FiArrowRight />
              </Link>
            </div>
            <div className="farmers-carousel">
              {farmers.map(farmer => (
                <FarmerCard key={farmer.sellerId} farmer={farmer} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============= BUDGET SECTION ============= */}
      <section className="budget-section">
        <div className="section-container">
          <div className="section-header">
            <h2>💰 Budget Friendly</h2>
          </div>
          <div className="budget-cards">
            <Link to="/marketplace?maxPrice=100" className="budget-card">
              <span className="budget-amount">Under ₹100</span>
              <span className="budget-text">Great deals on essentials</span>
            </Link>
            <Link to="/marketplace?maxPrice=250" className="budget-card">
              <span className="budget-amount">Under ₹250</span>
              <span className="budget-text">Quality at low prices</span>
            </Link>
            <Link to="/marketplace?maxPrice=500" className="budget-card">
              <span className="budget-amount">Under ₹500</span>
              <span className="budget-text">Premium selections</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============= RECENTLY VIEWED ============= */}
      {recentlyViewed.length > 0 && (
        <ProductCarousel 
          title="👁️ Recently Viewed"
          subtitle="Continue where you left off"
          products={recentlyViewed}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          onProductClick={handleProductClick}
          viewAllLink="/marketplace"
          bgColor="#fff"
        />
      )}

      {/* ============= BECOME A SELLER CTA ============= */}
      <section className="seller-cta-section">
        <div className="section-container">
          <div className="seller-cta-content">
            <div className="seller-cta-text">
              <h2>Are You a Farmer?</h2>
              <p>Join thousands of farmers selling directly to consumers. No middlemen, full control over your prices.</p>
              <ul className="seller-benefits">
                <li><FiCheckCircle /> Zero commission on sales</li>
                <li><FiCheckCircle /> Direct customer relationships</li>
                <li><FiCheckCircle /> IoT-powered farm management</li>
                <li><FiCheckCircle /> 24/7 seller support</li>
              </ul>
              <Link to="/register?role=FARMER" className="seller-cta-btn">
                Start Selling Today <FiArrowRight />
              </Link>
            </div>
            <div className="seller-cta-image">
              <img 
                src="https://images.unsplash.com/photo-1595855759920-86582396756a?w=600" 
                alt="Happy Farmer" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============= APP DOWNLOAD BANNER ============= */}
      <section className="app-download-section">
        <div className="section-container">
          <div className="app-download-content">
            <div className="app-info">
              <h3>📱 Download AgriLink App</h3>
              <p>Shop on the go with our mobile app. Get exclusive app-only deals!</p>
            </div>
            <div className="app-buttons">
              <button className="app-store-btn" onClick={() => toast.info('Coming soon to App Store!')}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" />
              </button>
              <button className="play-store-btn" onClick={() => toast.info('Coming soon to Play Store!')}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ============= SUB COMPONENTS =============

// Product Carousel Component
const ProductCarousel = ({ title, subtitle, products, onAddToCart, onAddToWishlist, onProductClick, viewAllLink, bgColor }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [products, checkScroll]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="product-carousel-section" style={{ backgroundColor: bgColor || '#fff' }}>
      <div className="section-container">
        <div className="section-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          <Link to={viewAllLink} className="view-all-link">
            View All <FiArrowRight />
          </Link>
        </div>
        
        <div className="carousel-wrapper">
          {canScrollLeft && (
            <button className="carousel-nav-btn left" onClick={() => scroll('left')}>
              <FiChevronLeft />
            </button>
          )}
          
          <div className="products-carousel" ref={scrollRef}>
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onAddToCart={onAddToCart}
                onAddToWishlist={onAddToWishlist}
                onClick={() => onProductClick(product)}
              />
            ))}
          </div>
          
          {canScrollRight && (
            <button className="carousel-nav-btn right" onClick={() => scroll('right')}>
              <FiChevronRight />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart, onAddToWishlist, onClick }) => {
  return (
    <div className="product-card-v2" onClick={onClick}>
      {product.discount > 0 && (
        <span className="product-discount-badge">-{product.discount}%</span>
      )}
      <button 
        className="product-wishlist-btn"
        onClick={(e) => onAddToWishlist(e, product)}
      >
        <FiHeart />
      </button>
      
      <div className="product-image-v2">
        <img src={product.imageUrl} alt={product.title} loading="lazy" />
      </div>
      
      <div className="product-info-v2">
        <span className="product-seller">{product.sellerName}</span>
        <h3 className="product-title-v2">{product.title}</h3>
        
        <div className="product-rating-v2">
          <FiStar className="star-filled" />
          <span>{product.rating?.toFixed(1) || '4.5'}</span>
          <span className="review-count">({product.reviewCount || 0})</span>
        </div>
        
        <div className="product-price-v2">
          <span className="current-price">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="original-price">₹{product.originalPrice}</span>
          )}
          <span className="price-unit">/{product.unit}</span>
        </div>
        
        <button 
          className="add-cart-btn-v2"
          onClick={(e) => onAddToCart(e, product)}
        >
          <FiShoppingCart /> Add
        </button>
      </div>
    </div>
  );
};

// Deal Card Component
const DealCard = ({ product, onAddToCart, onClick }) => {
  return (
    <div className="deal-card" onClick={onClick}>
      <div className="deal-card-image">
        <img src={product.imageUrl} alt={product.title} loading="lazy" />
        <span className="deal-discount">-{product.discount}%</span>
      </div>
      <div className="deal-card-info">
        <h4>{product.title}</h4>
        <div className="deal-price">
          <span className="deal-current">₹{product.price}</span>
          <span className="deal-original">₹{product.originalPrice}</span>
        </div>
      </div>
    </div>
  );
};

// Farmer Card Component
const FarmerCard = ({ farmer }) => {
  const navigate = useNavigate();
  
  return (
    <div className="farmer-card-v2" onClick={() => navigate(`/farmers/${farmer.sellerId}`)}>
      <div className="farmer-avatar">
        {farmer.sellerName?.charAt(0)?.toUpperCase() || 'F'}
      </div>
      <h4 className="farmer-name">{farmer.sellerName || 'Local Farmer'}</h4>
      <div className="farmer-stats">
        <span><FiPackage /> {farmer.productCount || 0} Products</span>
        <span><FiStar /> {farmer.averageRating?.toFixed(1) || '4.5'}</span>
      </div>
      {farmer.location && (
        <span className="farmer-location">
          <FiMapPin /> {farmer.location}
        </span>
      )}
    </div>
  );
};

export default Home;
