import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiStar, FiShoppingCart, FiHeart, FiUsers, FiPackage, FiAward, FiShield, FiTruck, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [freshVegetables, setFreshVegetables] = useState([]);
  const [organicFruits, setOrganicFruits] = useState([]);
  const [dairyProducts, setDairyProducts] = useState([]);
  const [grains, setGrains] = useState([]);
  const [statistics, setStatistics] = useState({
    totalFarmers: 0,
    totalProducts: 0,
    totalOrders: 0,
    satisfactionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [visibleStats, setVisibleStats] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    fetchHomeData();
    
    // Intersection observer for stats animation
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleStats(true);
        }
      },
      { threshold: 0.3 }
    );
    
    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const categoriesRes = await api.get('/marketplace-service/api/v1/categories').catch(() => ({ data: { data: [] } }));
      setCategories(categoriesRes.data?.data || getMockCategories());
      
      // Fetch products by category
      const [featured, vegetables, fruits, dairy, grainsData] = await Promise.all([
        api.get('/marketplace-service/api/v1/listings?size=10&sort=createdAt,desc').catch(() => ({ data: { data: { content: [] } } })),
        api.get('/marketplace-service/api/v1/listings?category=VEGETABLES&size=10').catch(() => ({ data: { data: { content: [] } } })),
        api.get('/marketplace-service/api/v1/listings?category=FRUITS&size=10').catch(() => ({ data: { data: { content: [] } } })),
        api.get('/marketplace-service/api/v1/listings?category=DAIRY&size=10').catch(() => ({ data: { data: { content: [] } } })),
        api.get('/marketplace-service/api/v1/listings?category=GRAINS&size=10').catch(() => ({ data: { data: { content: [] } } }))
      ]);
      
      setFeaturedProducts(featured.data?.data?.content || getMockProducts('Featured'));
      setFreshVegetables(vegetables.data?.data?.content || getMockProducts('Vegetables'));
      setOrganicFruits(fruits.data?.data?.content || getMockProducts('Fruits'));
      setDairyProducts(dairy.data?.data?.content || getMockProducts('Dairy'));
      setGrains(grainsData.data?.data?.content || getMockProducts('Grains'));
      
      // Fetch statistics
      const statsRes = await api.get('/farm-service/api/v1/analytics/platform-stats').catch(() => null);
      if (statsRes?.data?.data) {
        setStatistics(statsRes.data.data);
      } else {
        setStatistics({
          totalFarmers: 2547,
          totalProducts: 15890,
          totalOrders: 89234,
          satisfactionRate: 98.5,
          storageFacilities: 156,
          deliveredToday: 1247
        });
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMockCategories = () => [
    { id: 1, name: 'Vegetables', icon: '🥬', productCount: 2450 },
    { id: 2, name: 'Fruits', icon: '🍎', productCount: 1890 },
    { id: 3, name: 'Grains', icon: '🌾', productCount: 980 },
    { id: 4, name: 'Dairy', icon: '🥛', productCount: 560 },
    { id: 5, name: 'Spices', icon: '🌶️', productCount: 780 },
    { id: 6, name: 'Pulses', icon: '🫘', productCount: 420 },
    { id: 7, name: 'Organic', icon: '🌿', productCount: 1250 },
    { id: 8, name: 'Seeds', icon: '🌱', productCount: 340 }
  ];

  const getMockProducts = (category) => {
    const products = [];
    for (let i = 1; i <= 10; i++) {
      products.push({
        id: `${category}-${i}`,
        title: `${category} Product ${i}`,
        price: Math.floor(Math.random() * 500) + 50,
        originalPrice: Math.floor(Math.random() * 600) + 100,
        unit: 'kg',
        imageUrl: `https://source.unsplash.com/300x300/?${category.toLowerCase()},farm`,
        farmerName: `Farmer ${i}`,
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviewCount: Math.floor(Math.random() * 100) + 10,
        location: 'Maharashtra, India',
        discount: Math.floor(Math.random() * 30) + 5
      });
    }
    return products;
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/marketplace?category=${categoryName.toUpperCase()}`);
  };

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/order-service/api/v1/cart/items', { listingId: productId, quantity: 1 });
      // Show success toast
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const handleAddToWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/marketplace-service/api/v1/wishlist', { listingId: productId });
    } catch (err) {
      console.error('Error adding to wishlist:', err);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-slider">
          <div className="hero-slide active">
            <div className="hero-content">
              <span className="hero-badge">🌾 Farm Fresh Guarantee</span>
              <h1>Fresh From Farm<br />To Your Doorstep</h1>
              <p>Connect directly with local farmers. Get the freshest produce at the best prices with complete transparency.</p>
              <div className="hero-buttons">
                <Link to="/marketplace" className="btn-primary">Shop Now</Link>
                <Link to="/farmers" className="btn-secondary">Meet Our Farmers</Link>
              </div>
              <div className="hero-features">
                <div className="hero-feature">
                  <FiTruck />
                  <span>Free Delivery</span>
                </div>
                <div className="hero-feature">
                  <FiShield />
                  <span>Quality Assured</span>
                </div>
                <div className="hero-feature">
                  <FiCheckCircle />
                  <span>100% Organic</span>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600" alt="Fresh Farm Produce" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <Link to="/marketplace" className="view-all">View All Categories →</Link>
          </div>
          <div className="categories-grid">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className="category-card"
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="category-icon">{category.icon}</div>
                <h3>{category.name}</h3>
                <span className="product-count">{category.productCount} Products</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      <ProductCarousel 
        title="Featured Products" 
        subtitle="Handpicked fresh produce from our best farmers"
        products={featuredProducts}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
        viewAllLink="/marketplace?sort=featured"
      />

      {/* Fresh Vegetables Carousel */}
      <ProductCarousel 
        title="Fresh Vegetables" 
        subtitle="Farm-fresh vegetables picked today"
        products={freshVegetables}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
        viewAllLink="/marketplace?category=VEGETABLES"
        bgColor="#f0fff4"
      />

      {/* Statistics Section */}
      <section className="statistics-section" ref={statsRef}>
        <div className="section-container">
          <div className="stats-header">
            <h2>Trusted by Thousands</h2>
            <p>Building India's largest farmer-to-consumer marketplace</p>
          </div>
          <div className="stats-grid">
            <div className={`stat-card ${visibleStats ? 'animate' : ''}`}>
              <div className="stat-icon farmers">
                <FiUsers />
              </div>
              <div className="stat-number">
                <CountUp end={statistics.totalFarmers} visible={visibleStats} />+
              </div>
              <div className="stat-label">Farmers Onboarded</div>
            </div>
            <div className={`stat-card ${visibleStats ? 'animate' : ''}`} style={{ animationDelay: '0.1s' }}>
              <div className="stat-icon products">
                <FiPackage />
              </div>
              <div className="stat-number">
                <CountUp end={statistics.totalProducts} visible={visibleStats} />+
              </div>
              <div className="stat-label">Products Available</div>
            </div>
            <div className={`stat-card ${visibleStats ? 'animate' : ''}`} style={{ animationDelay: '0.2s' }}>
              <div className="stat-icon orders">
                <FiTruck />
              </div>
              <div className="stat-number">
                <CountUp end={statistics.totalOrders} visible={visibleStats} />+
              </div>
              <div className="stat-label">Orders Delivered</div>
            </div>
            <div className={`stat-card ${visibleStats ? 'animate' : ''}`} style={{ animationDelay: '0.3s' }}>
              <div className="stat-icon satisfaction">
                <FiAward />
              </div>
              <div className="stat-number">
                <CountUp end={statistics.satisfactionRate} visible={visibleStats} decimals={1} />%
              </div>
              <div className="stat-label">Customer Satisfaction</div>
            </div>
          </div>
          
          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="trust-badge">
              <img src="https://img.icons8.com/color/48/verified-badge.png" alt="Verified" />
              <span>Verified Farmers</span>
            </div>
            <div className="trust-badge">
              <img src="https://img.icons8.com/color/48/organic-food.png" alt="Organic" />
              <span>Organic Certified</span>
            </div>
            <div className="trust-badge">
              <img src="https://img.icons8.com/color/48/security-checked.png" alt="Secure" />
              <span>Secure Payments</span>
            </div>
            <div className="trust-badge">
              <img src="https://img.icons8.com/color/48/prize.png" alt="Award" />
              <span>Award Winning</span>
            </div>
          </div>
        </div>
      </section>

      {/* Organic Fruits Carousel */}
      <ProductCarousel 
        title="Organic Fruits" 
        subtitle="Naturally grown, chemical-free fruits"
        products={organicFruits}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
        viewAllLink="/marketplace?category=FRUITS"
      />

      {/* Dairy Products Carousel */}
      <ProductCarousel 
        title="Farm Fresh Dairy" 
        subtitle="Pure milk and dairy products from local farms"
        products={dairyProducts}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
        viewAllLink="/marketplace?category=DAIRY"
        bgColor="#fffbeb"
      />

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <div className="section-container">
          <h2>Why Choose AgriLink?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>Direct from Farmers</h3>
              <p>No middlemen. Buy directly from verified farmers and get the best prices.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Same Day Delivery</h3>
              <p>Fresh produce delivered to your doorstep within hours of harvest.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Quality Guaranteed</h3>
              <p>Every product goes through strict quality checks before delivery.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Best Prices</h3>
              <p>Fair prices for farmers, savings for you. Everyone wins!</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Payments</h3>
              <p>Multiple payment options with 100% secure transactions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📞</div>
              <h3>24/7 Support</h3>
              <p>Our team is always here to help with any questions or concerns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Grains Carousel */}
      <ProductCarousel 
        title="Premium Grains & Pulses" 
        subtitle="Freshly harvested grains from fertile farms"
        products={grains}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
        viewAllLink="/marketplace?category=GRAINS"
      />

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Are You a Farmer?</h2>
          <p>Join thousands of farmers selling directly to consumers. No commission, full control.</p>
          <Link to="/register?role=FARMER" className="cta-button">Start Selling Today →</Link>
        </div>
      </section>

      {/* Footer will be added separately */}
    </div>
  );
};

// Product Carousel Component
const ProductCarousel = ({ title, subtitle, products, onAddToCart, onAddToWishlist, viewAllLink, bgColor }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [products]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="product-carousel-section" style={{ backgroundColor: bgColor || 'white' }}>
      <div className="section-container">
        <div className="section-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          <Link to={viewAllLink} className="view-all">View All →</Link>
        </div>
        
        <div className="carousel-wrapper">
          {canScrollLeft && (
            <button className="carousel-btn left" onClick={() => scroll('left')}>
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
              />
            ))}
          </div>
          
          {canScrollRight && (
            <button className="carousel-btn right" onClick={() => scroll('right')}>
              <FiChevronRight />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart, onAddToWishlist }) => {
  const navigate = useNavigate();
  
  return (
    <div className="product-card" onClick={() => navigate(`/marketplace/${product.id}`)}>
      {product.discount > 0 && (
        <span className="discount-badge">-{product.discount}%</span>
      )}
      <button 
        className="wishlist-btn"
        onClick={(e) => onAddToWishlist(e, product.id)}
      >
        <FiHeart />
      </button>
      
      <div className="product-image">
        <img src={product.imageUrl || 'https://via.placeholder.com/200'} alt={product.title} />
      </div>
      
      <div className="product-info">
        <span className="product-farmer">{product.farmerName}</span>
        <h3 className="product-title">{product.title}</h3>
        
        <div className="product-rating">
          <FiStar className="star-icon" />
          <span>{product.rating}</span>
          <span className="review-count">({product.reviewCount})</span>
        </div>
        
        <div className="product-price">
          <span className="current-price">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="original-price">₹{product.originalPrice}</span>
          )}
          <span className="unit">/{product.unit}</span>
        </div>
        
        <button 
          className="add-to-cart-btn"
          onClick={(e) => onAddToCart(e, product.id)}
        >
          <FiShoppingCart /> Add to Cart
        </button>
      </div>
    </div>
  );
};

// Count Up Animation Component
const CountUp = ({ end, visible, decimals = 0 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!visible) return;
    
    const duration = 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setCount(end * easeOutQuart);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, visible]);
  
  return decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();
};

export default Home;
