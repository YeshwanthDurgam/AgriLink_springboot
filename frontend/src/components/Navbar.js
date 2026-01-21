import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiMenu, FiX, FiUser, FiLogOut, FiSearch, FiShoppingCart, FiHeart, 
  FiMessageSquare, FiBell, FiChevronDown, FiShoppingBag, 
  FiUsers, FiPackage, FiBarChart2, FiMap, FiCpu,
  FiHome, FiPercent, FiShield, FiHelpCircle
} from 'react-icons/fi';
import cartService from '../services/cartService';
import wishlistService from '../services/wishlistService';
import messagingService from '../services/messagingService';
import notificationService from '../services/notificationService';
import NotificationCenter from './NotificationCenter';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);

  // Get user role
  const getUserRole = () => {
    if (!user?.roles) return null;
    if (user.roles.includes('ADMIN')) return 'ADMIN';
    if (user.roles.includes('FARMER')) return 'FARMER';
    return 'BUYER';
  };

  const userRole = getUserRole();

  // Fetch counts
  useEffect(() => {
    if (isAuthenticated) {
      fetchCounts();
    }
  }, [isAuthenticated, location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCounts = async () => {
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
      // Handle multiple response formats for notification count
      const notifCount = notifData?.data?.count || notifData?.count || notifData?.data || (typeof notifData === 'number' ? notifData : 0);
      setNotificationCount(notifCount);
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
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
      case 'FARMER': return '/farmer/dashboard';
      default: return '/buyer/dashboard';
    }
  };

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
            {/* Left: Logo */}
            <Link to="/" className="navbar-logo">
              <span className="logo-icon">🌾</span>
              <span className="logo-text">AgriLink</span>
            </Link>

            {/* Center: Navigation */}
            <div className="navbar-center">
              <Link to="/marketplace" className="nav-link">
                <FiShoppingBag className="nav-icon" />
                Marketplace
              </Link>

              <Link to="/farmers" className="nav-link">
                <FiUsers className="nav-icon" />
                Farmers
              </Link>

              <Link to="/deals" className="nav-link highlight">
                <FiPercent className="nav-icon" />
                Today's Deals
              </Link>
            </div>

            {/* Right: Search + Account */}
            <div className="navbar-right">
              {/* Search Bar */}
              <form className="search-form" onSubmit={handleSearch}>
                <div className="search-input-wrapper">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search products, farmers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </form>

              {isAuthenticated ? (
                <>
                  {/* Wishlist */}
                  <Link to="/wishlist" className="navbar-icon-btn" title="Wishlist">
                    <FiHeart />
                    {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
                  </Link>

                  {/* Cart */}
                  <Link to="/cart" className="navbar-icon-btn" title="Cart">
                    <FiShoppingCart />
                    {cartCount > 0 && <span className="badge">{cartCount}</span>}
                  </Link>

                  {/* Messages */}
                  <Link to="/messages" className="navbar-icon-btn" title="Messages">
                    <FiMessageSquare />
                    {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
                  </Link>

                  {/* Notifications */}
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

                  {/* User Menu */}
                  <div className="user-menu-container" ref={userMenuRef}>
                    <button 
                      className="user-menu-btn"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    >
                      <div className="user-avatar">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-btn-text">
                        <span className="user-greeting">Hello,</span>
                        <span className="user-name">{user?.email?.split('@')[0] || 'User'}</span>
                      </div>
                      <FiChevronDown className={`chevron ${userMenuOpen ? 'rotated' : ''}`} />
                    </button>
                    
                    {userMenuOpen && (
                      <div className="user-dropdown-menu">
                        <div className="user-dropdown-header">
                          <div className="user-avatar large">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="user-info">
                            <span className="user-email">{user?.email}</span>
                            <span className={`user-role ${userRole?.toLowerCase()}`}>
                              {userRole || 'User'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="dropdown-divider"></div>
                        
                        <Link to={getDashboardLink()} className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FiHome />
                          My Dashboard
                        </Link>
                        
                        <Link to="/orders" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FiPackage />
                          My Orders
                        </Link>
                        
                        <Link to="/wishlist" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FiHeart />
                          Wishlist
                        </Link>

                        {userRole === 'FARMER' && (
                          <>
                            <div className="dropdown-divider"></div>
                            <Link to="/farms" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                              <FiMap />
                              My Farms
                            </Link>
                            <Link to="/devices" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                              <FiCpu />
                              IoT Devices
                            </Link>
                            <Link to="/analytics" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                              <FiBarChart2 />
                              Analytics
                            </Link>
                          </>
                        )}

                        {userRole === 'ADMIN' && (
                          <>
                            <div className="dropdown-divider"></div>
                            <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                              <FiShield />
                              Admin Panel
                            </Link>
                            <Link to="/admin/users" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                              <FiUsers />
                              Manage Users
                            </Link>
                          </>
                        )}

                        <div className="dropdown-divider"></div>
                        
                        <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FiUser />
                          Account Settings
                        </Link>
                        
                        <Link to="/help" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FiHelpCircle />
                          Help & Support
                        </Link>
                        
                        <div className="dropdown-divider"></div>
                        
                        <button className="dropdown-item logout" onClick={handleLogout}>
                          <FiLogOut />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn-login">Login</Link>
                  <Link to="/register" className="btn-register">Sign Up</Link>
                </div>
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

          <div className="mobile-nav-links">
            <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiHome /> Home
            </Link>
            <Link to="/marketplace" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiShoppingBag /> Marketplace
            </Link>
            <Link to="/farmers" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiUsers /> Farmers
            </Link>
            <Link to="/deals" className="mobile-nav-link highlight" onClick={closeMobileMenu}>
              <FiPercent /> Today's Deals
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="mobile-user-section">
              <div className="mobile-user-info">
                <div className="user-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
                <div>
                  <span className="user-name">{user?.email?.split('@')[0]}</span>
                  <span className="user-role">{userRole}</span>
                </div>
              </div>
              
              <div className="mobile-user-links">
                <Link to={getDashboardLink()} onClick={closeMobileMenu}>
                  <FiHome /> Dashboard
                </Link>
                <Link to="/orders" onClick={closeMobileMenu}>
                  <FiPackage /> Orders
                </Link>
                <Link to="/profile" onClick={closeMobileMenu}>
                  <FiUser /> Profile
                </Link>
                <button onClick={handleLogout}>
                  <FiLogOut /> Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-auth">
              <Link to="/login" className="mobile-login" onClick={closeMobileMenu}>
                Login
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
