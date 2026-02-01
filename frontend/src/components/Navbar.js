import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiMenu, FiX, FiUser, FiLogOut, FiSearch, FiShoppingCart, FiHeart, 
  FiMessageSquare, FiBell, FiChevronDown, FiShoppingBag, 
  FiUsers, FiPackage, FiBarChart2, FiMap, FiMapPin,
  FiHome, FiPercent, FiShield, FiHelpCircle, FiDollarSign,
  FiChevronRight, FiTruck, FiClock
} from 'react-icons/fi';
import cartService from '../services/cartService';
import wishlistService from '../services/wishlistService';
import guestService from '../services/guestService';
import messagingService from '../services/messagingService';
import notificationService from '../services/notificationService';
import { marketplaceApi } from '../services/api';
import NotificationCenter from './NotificationCenter';
import './Navbar.css';

// Category Icons mapping
const CATEGORY_ICONS = {
  'Vegetables': '🥬',
  'Fruits': '🍎',
  'Grains': '🌾',
  'Dairy': '🥛',
  'Spices': '🌶️',
  'Pulses': '🫘',
  'Organic': '🌿',
  'Seeds': '🌱',
  'Nuts': '🥜',
  'Herbs': '🌿'
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // UI State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  // Data State
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Location State
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    return localStorage.getItem('deliveryLocation') || 'Select Location';
  });
  const [pincode, setPincode] = useState(() => {
    return localStorage.getItem('deliveryPincode') || '';
  });

  // Refs
  const userMenuRef = useRef(null);
  const categoriesRef = useRef(null);
  const locationRef = useRef(null);
  const searchRef = useRef(null);

  // Get user role
  const getUserRole = () => {
    if (!user?.roles) return null;
    if (user.roles.includes('ADMIN')) return 'ADMIN';
    if (user.roles.includes('MANAGER')) return 'MANAGER';
    if (user.roles.includes('FARMER')) return 'FARMER';
    return 'CUSTOMER';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const userRole = getUserRole();
  const displayName = getUserDisplayName();

  // ============= DATA FETCHING =============
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await marketplaceApi.get('/categories');
        if (response?.data?.data) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Fetch counts for authenticated users
  const fetchCounts = useCallback(async () => {
    try {
      const [cartData, wishlistData, unreadData, notifData] = await Promise.all([
        cartService.getCartCount().catch(() => ({ count: 0 })),
        wishlistService.getWishlistCount().catch(() => 0),
        messagingService.getUnreadCount().catch(() => 0),
        notificationService.getUnreadCount().catch(() => ({ count: 0 }))
      ]);
      setCartCount(cartData?.count || 0);
      setWishlistCount(typeof wishlistData === 'number' ? wishlistData : (wishlistData?.count || 0));
      setUnreadMessages(typeof unreadData === 'number' ? unreadData : (unreadData?.count || 0));
      const notifCount = notifData?.data?.count || notifData?.count || notifData?.data || (typeof notifData === 'number' ? notifData : 0);
      setNotificationCount(notifCount);
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  }, []);

  // Fetch guest counts from localStorage
  const fetchGuestCounts = useCallback(() => {
    setCartCount(guestService.getGuestCartCount());
    setWishlistCount(guestService.getGuestWishlistCount());
  }, []);

  // Fetch counts on mount and location change
  useEffect(() => {
    if (isAuthenticated) {
      fetchCounts();
    } else {
      fetchGuestCounts();
    }
  }, [isAuthenticated, location.pathname, fetchCounts, fetchGuestCounts]);

  // Listen for guest cart/wishlist updates
  useEffect(() => {
    if (!isAuthenticated) {
      const handleGuestCartUpdate = (event) => {
        setCartCount(event.detail?.totalItems || 0);
      };
      const handleGuestWishlistUpdate = (event) => {
        setWishlistCount(event.detail?.length || 0);
      };
      
      window.addEventListener('guestCartUpdated', handleGuestCartUpdate);
      window.addEventListener('guestWishlistUpdated', handleGuestWishlistUpdate);
      
      return () => {
        window.removeEventListener('guestCartUpdated', handleGuestCartUpdate);
        window.removeEventListener('guestWishlistUpdated', handleGuestWishlistUpdate);
      };
    }
  }, [isAuthenticated]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setCategoriesOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setLocationMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============= HANDLERS =============

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Save to recent searches
      const newSearches = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 5);
      setRecentSearches(newSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
      
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchFocused(false);
    }
  };

  const handleSearchSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    navigate(`/marketplace?search=${encodeURIComponent(suggestion)}`);
    setSearchFocused(false);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/marketplace?categoryId=${categoryId}`);
    setCategoriesOpen(false);
  };

  const handleLocationSave = () => {
    if (pincode.length === 6) {
      // Simple location lookup (in real app, use API)
      const locationMap = {
        '400001': 'Mumbai, MH',
        '110001': 'New Delhi, DL',
        '560001': 'Bangalore, KA',
        '600001': 'Chennai, TN',
        '700001': 'Kolkata, WB',
        '500001': 'Hyderabad, TS',
        '380001': 'Ahmedabad, GJ',
        '411001': 'Pune, MH'
      };
      const location = locationMap[pincode] || `PIN: ${pincode}`;
      setDeliveryLocation(location);
      localStorage.setItem('deliveryLocation', location);
      localStorage.setItem('deliveryPincode', pincode);
      setLocationMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Dynamic dashboard link based on role
  const getDashboardLink = () => {
    switch(userRole) {
      case 'ADMIN': return '/admin/dashboard';
      case 'MANAGER': return '/manager/dashboard';
      case 'FARMER': return '/farmer/dashboard';
      default: return '/buyer/dashboard';
    }
  };

  // Popular searches for suggestions
  const popularSearches = ['Fresh Vegetables', 'Organic Fruits', 'Farm Fresh Milk', 'Rice', 'Tomatoes', 'Potatoes'];

  return (
    <>
      <nav className="navbar">
        {/* Top Bar - Announcement */}
        <div className="navbar-topbar">
          <div className="topbar-content">
            <span>🎉 Free delivery on orders over ₹500 | Use code: FRESH20 for 20% off</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="navbar-main">
          <div className="navbar-container">
            {/* Left: Logo + Location */}
            <div className="navbar-left">
              <Link to="/" className="navbar-logo">
                <span className="logo-icon">🌾</span>
                <span className="logo-text">AgriLink</span>
              </Link>

              {/* Delivery Location - Amazon Style */}
              <div className="location-selector" ref={locationRef}>
                <button 
                  className="location-btn"
                  onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                >
                  <FiMapPin className="location-icon" />
                  <div className="location-text">
                    <span className="location-label">Deliver to</span>
                    <span className="location-value">{deliveryLocation}</span>
                  </div>
                </button>

                {locationMenuOpen && (
                  <div className="location-dropdown">
                    <h4>Choose your location</h4>
                    <p>Delivery options and speeds may vary based on location</p>
                    
                    {isAuthenticated && (
                      <Link to="/profile" className="location-option" onClick={() => setLocationMenuOpen(false)}>
                        <FiUser />
                        <span>Use saved address</span>
                      </Link>
                    )}
                    
                    <div className="location-pincode">
                      <input
                        type="text"
                        placeholder="Enter 6-digit pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                      <button onClick={handleLocationSave} disabled={pincode.length !== 6}>
                        Apply
                      </button>
                    </div>
                    
                    {!isAuthenticated && (
                      <Link to="/login" className="location-signin" onClick={() => setLocationMenuOpen(false)}>
                        Sign in to see your addresses
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Search Bar - Amazon Style */}
            <div className="navbar-search" ref={searchRef}>
              <form className="search-form" onSubmit={handleSearch}>
                {/* Category Selector in Search */}
                <div className="search-category-select" ref={categoriesRef}>
                  <button 
                    type="button"
                    className="category-select-btn"
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                  >
                    <span>All</span>
                    <FiChevronDown />
                  </button>
                  
                  {categoriesOpen && (
                    <div className="category-mega-menu">
                      <div className="mega-menu-header">
                        <h3>Shop by Category</h3>
                      </div>
                      <div className="mega-menu-grid">
                        {categories.map(category => (
                          <button
                            key={category.id}
                            className="mega-menu-item"
                            onClick={() => handleCategoryClick(category.id)}
                          >
                            <span className="category-emoji">
                              {CATEGORY_ICONS[category.name] || '📦'}
                            </span>
                            <span>{category.name}</span>
                          </button>
                        ))}
                      </div>
                      <Link 
                        to="/marketplace" 
                        className="mega-menu-all"
                        onClick={() => setCategoriesOpen(false)}
                      >
                        View All Products <FiChevronRight />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className="search-input-container">
                  <input
                    type="text"
                    placeholder="Search for vegetables, fruits, farmers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    className="search-input"
                  />
                  <button type="submit" className="search-submit-btn">
                    <FiSearch />
                  </button>
                </div>

                {/* Search Suggestions Dropdown */}
                {searchFocused && (
                  <div className="search-suggestions">
                    {recentSearches.length > 0 && (
                      <div className="suggestions-section">
                        <h5><FiClock /> Recent Searches</h5>
                        {recentSearches.map((search, idx) => (
                          <button 
                            key={idx}
                            className="suggestion-item"
                            onClick={() => handleSearchSuggestionClick(search)}
                          >
                            <FiClock className="suggestion-icon" />
                            {search}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="suggestions-section">
                      <h5>🔥 Popular Searches</h5>
                      {popularSearches.map((search, idx) => (
                        <button 
                          key={idx}
                          className="suggestion-item"
                          onClick={() => handleSearchSuggestionClick(search)}
                        >
                          <FiSearch className="suggestion-icon" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right: Account, Orders, Cart */}
            <div className="navbar-right">
              {/* Account & Lists - Amazon Style */}
              {isAuthenticated ? (
                <div className="user-menu-container" ref={userMenuRef}>
                  <button 
                    className="account-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="account-text">
                      <span className="account-greeting">Hello, {displayName}</span>
                      <span className="account-title">Account & Lists <FiChevronDown /></span>
                    </div>
                  </button>
                  
                  {userMenuOpen && (
                    <div className="account-dropdown">
                      <div className="dropdown-header">
                        <div className="user-avatar large">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                          <span className="user-name">{displayName}</span>
                          <span className={`user-role-badge ${userRole?.toLowerCase()}`}>
                            {userRole || 'Customer'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="dropdown-columns">
                        <div className="dropdown-column">
                          <h4>Your Account</h4>
                          <Link to="/profile" onClick={() => setUserMenuOpen(false)}>
                            <FiUser /> Account Settings
                          </Link>
                          <Link to={getDashboardLink()} onClick={() => setUserMenuOpen(false)}>
                            <FiHome /> Dashboard
                          </Link>
                          {userRole !== 'FARMER' && (
                            <Link to="/orders" onClick={() => setUserMenuOpen(false)}>
                              <FiPackage /> Your Orders
                            </Link>
                          )}
                          {userRole !== 'FARMER' && (
                            <Link to="/wishlist" onClick={() => setUserMenuOpen(false)}>
                              <FiHeart /> Your Wishlist
                            </Link>
                          )}
                        </div>
                        
                        <div className="dropdown-column">
                          <h4>{userRole === 'FARMER' ? 'Farmer Tools' : 'Quick Links'}</h4>
                          {userRole === 'FARMER' ? (
                            <>
                              <Link to="/farmer/products" onClick={() => setUserMenuOpen(false)}>
                                <FiShoppingBag /> My Products
                              </Link>
                              <Link to="/farmer/orders" onClick={() => setUserMenuOpen(false)}>
                                <FiDollarSign /> My Sales
                              </Link>
                              <Link to="/farms" onClick={() => setUserMenuOpen(false)}>
                                <FiMap /> My Farms
                              </Link>
                              <Link to="/analytics" onClick={() => setUserMenuOpen(false)}>
                                <FiBarChart2 /> Analytics
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link to="/deals" onClick={() => setUserMenuOpen(false)}>
                                <FiPercent /> Today's Deals
                              </Link>
                              <Link to="/farmers" onClick={() => setUserMenuOpen(false)}>
                                <FiUsers /> Browse Farmers
                              </Link>
                              <Link to="/messages" onClick={() => setUserMenuOpen(false)}>
                                <FiMessageSquare /> Messages
                              </Link>
                              <Link to="/help" onClick={() => setUserMenuOpen(false)}>
                                <FiHelpCircle /> Help Center
                              </Link>
                            </>
                          )}
                        </div>
                      </div>

                      {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                        <>
                          <div className="dropdown-divider"></div>
                          <div className="dropdown-admin">
                            <Link to={userRole === 'ADMIN' ? '/admin/dashboard' : '/manager/dashboard'} onClick={() => setUserMenuOpen(false)}>
                              <FiShield /> {userRole === 'ADMIN' ? 'Admin Panel' : 'Manager Panel'}
                            </Link>
                          </div>
                        </>
                      )}
                      
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-logout" onClick={handleLogout}>
                        <FiLogOut /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="account-btn guest">
                  <div className="account-text">
                    <span className="account-greeting">Hello, Sign in</span>
                    <span className="account-title">Account & Lists <FiChevronDown /></span>
                  </div>
                </Link>
              )}

              {/* Returns & Orders - Amazon Style */}
              {isAuthenticated && userRole !== 'FARMER' && (
                <Link to="/orders" className="orders-btn">
                  <span className="orders-label">Returns</span>
                  <span className="orders-title">& Orders</span>
                </Link>
              )}

              {/* Messages - Only for authenticated */}
              {isAuthenticated && (
                <Link to="/messages" className="navbar-icon-btn messages-btn" title="Messages">
                  <FiMessageSquare />
                  {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
                </Link>
              )}

              {/* Notifications - Only for authenticated */}
              {isAuthenticated && (
                <button 
                  className="navbar-icon-btn"
                  onClick={() => setShowNotifications(true)}
                  title="Notifications"
                >
                  <FiBell />
                  {notificationCount > 0 && (
                    <span className="badge">{notificationCount > 9 ? '9+' : notificationCount}</span>
                  )}
                </button>
              )}

              {/* Wishlist */}
              {(!isAuthenticated || userRole !== 'FARMER') && (
                <Link to="/wishlist" className="navbar-icon-btn" title="Wishlist">
                  <FiHeart />
                  {wishlistCount > 0 && <span className="badge wishlist">{wishlistCount}</span>}
                </Link>
              )}

              {/* Cart - Amazon Style */}
              {(!isAuthenticated || userRole !== 'FARMER') && (
                <Link to="/cart" className="cart-btn">
                  <div className="cart-icon-wrapper">
                    <FiShoppingCart className="cart-icon" />
                    <span className="cart-count">{cartCount}</span>
                  </div>
                  <span className="cart-text">Cart</span>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Bar */}
        <div className="navbar-secondary">
          <div className="secondary-container">
            {/* All Categories Button */}
            <button 
              className="all-categories-btn"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              <FiMenu />
              <span>All Categories</span>
            </button>

            {/* Quick Links */}
            <div className="secondary-links">
              <Link to="/deals" className="secondary-link highlight">
                <FiPercent /> Today's Deals
              </Link>
              <Link to="/marketplace?organic=true" className="secondary-link">
                🌿 Organic
              </Link>
              <Link to="/farmers" className="secondary-link">
                👨‍🌾 Our Farmers
              </Link>
              <Link to="/marketplace?sort=newest" className="secondary-link">
                ✨ New Arrivals
              </Link>
              {isAuthenticated && userRole === 'FARMER' && (
                <Link to="/marketplace/create" className="secondary-link sell">
                  + Sell Products
                </Link>
              )}
              {!isAuthenticated && (
                <Link to="/register?role=FARMER" className="secondary-link sell">
                  Become a Seller
                </Link>
              )}
            </div>

            {/* Delivery Promise */}
            <div className="delivery-promise">
              <FiTruck />
              <span>Free delivery on ₹500+</span>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {/* Mobile Search */}
          <form className="mobile-search" onSubmit={handleSearch}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Mobile Location */}
          <div className="mobile-location">
            <FiMapPin />
            <span>Deliver to: {deliveryLocation}</span>
          </div>

          <div className="mobile-nav-links">
            <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiHome /> Home
            </Link>
            <Link to="/marketplace" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiShoppingBag /> Shop All
            </Link>
            <Link to="/deals" className="mobile-nav-link highlight" onClick={closeMobileMenu}>
              <FiPercent /> Today's Deals
            </Link>
            <Link to="/farmers" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiUsers /> Farmers
            </Link>
          </div>

          {/* Mobile Categories */}
          <div className="mobile-categories">
            <h4>Categories</h4>
            <div className="mobile-category-grid">
              {categories.slice(0, 8).map(category => (
                <Link 
                  key={category.id}
                  to={`/marketplace?categoryId=${category.id}`}
                  className="mobile-category-item"
                  onClick={closeMobileMenu}
                >
                  <span className="category-emoji">{CATEGORY_ICONS[category.name] || '📦'}</span>
                  <span>{category.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Cart & Wishlist for all users in mobile */}
          <div className="mobile-cart-wishlist">
            <Link to="/wishlist" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiHeart /> Wishlist
              {wishlistCount > 0 && <span className="mobile-badge">{wishlistCount}</span>}
            </Link>
            <Link to="/cart" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiShoppingCart /> Cart
              {cartCount > 0 && <span className="mobile-badge">{cartCount}</span>}
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="mobile-user-section">
              <div className="mobile-user-info">
                <div className="user-avatar">{displayName.charAt(0).toUpperCase()}</div>
                <div>
                  <span className="user-name">{displayName}</span>
                  <span className="user-role">{userRole}</span>
                </div>
              </div>
              
              <div className="mobile-user-links">
                <Link to={getDashboardLink()} onClick={closeMobileMenu}>
                  <FiHome /> Dashboard
                </Link>
                {userRole !== 'FARMER' && (
                  <Link to="/orders" onClick={closeMobileMenu}>
                    <FiPackage /> Your Orders
                  </Link>
                )}
                {userRole === 'FARMER' && (
                  <>
                    <Link to="/farmer/products" onClick={closeMobileMenu}>
                      <FiShoppingBag /> My Products
                    </Link>
                    <Link to="/farmer/orders" onClick={closeMobileMenu}>
                      <FiDollarSign /> My Sales
                    </Link>
                  </>
                )}
                <Link to="/profile" onClick={closeMobileMenu}>
                  <FiUser /> Account Settings
                </Link>
                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <Link to={userRole === 'ADMIN' ? '/admin/dashboard' : '/manager/dashboard'} onClick={closeMobileMenu}>
                    <FiShield /> {userRole} Panel
                  </Link>
                )}
                <button onClick={handleLogout}>
                  <FiLogOut /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-auth">
              <Link to="/login" className="mobile-login" onClick={closeMobileMenu}>
                Sign In
              </Link>
              <Link to="/register" className="mobile-register" onClick={closeMobileMenu}>
                Create Account
              </Link>
            </div>
          )}
        </div>

        {/* Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-overlay" onClick={closeMobileMenu}></div>
        )}
      </nav>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          fetchCounts();
        }} 
      />
    </>
  );
};

export default Navbar;
