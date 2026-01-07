import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiHome, FiMap, FiShoppingBag, FiPackage, FiCpu, FiBell } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/farms', label: 'Farms', icon: FiMap },
    { path: '/marketplace', label: 'Marketplace', icon: FiShoppingBag },
    { path: '/orders', label: 'Orders', icon: FiPackage },
    { path: '/devices', label: 'IoT Devices', icon: FiCpu },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🌾</span>
          <span className="logo-text">AgriLink</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <div className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
              >
                <link.icon className="navbar-link-icon" />
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* User Menu / Auth Buttons */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <button className="navbar-icon-btn">
                <FiBell />
                <span className="notification-badge">3</span>
              </button>

              {/* User Menu */}
              <div className="user-menu-container">
                <button 
                  className="user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="user-avatar">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="user-name">{user?.email?.split('@')[0] || 'User'}</span>
                </button>
                
                {userMenuOpen && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <div className="user-avatar large">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-info">
                        <span className="user-email">{user?.email}</span>
                        <span className="user-role">{user?.roles?.join(', ') || 'User'}</span>
                      </div>
                    </div>
                    <div className="user-menu-divider"></div>
                    <Link to="/profile" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>
                      <FiUser />
                      Profile
                    </Link>
                    <button className="user-menu-item logout" onClick={handleLogout}>
                      <FiLogOut />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {isAuthenticated ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-menu-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <link.icon />
                  {link.label}
                </Link>
              ))}
              <div className="mobile-menu-divider"></div>
              <Link to="/profile" className="mobile-menu-link" onClick={closeMobileMenu}>
                <FiUser />
                Profile
              </Link>
              <button className="mobile-menu-link logout" onClick={handleLogout}>
                <FiLogOut />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-menu-link" onClick={closeMobileMenu}>
                Login
              </Link>
              <Link to="/register" className="mobile-menu-link" onClick={closeMobileMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}

      {/* Overlay for dropdowns */}
      {(userMenuOpen || mobileMenuOpen) && (
        <div 
          className="navbar-overlay"
          onClick={() => {
            setUserMenuOpen(false);
            setMobileMenuOpen(false);
          }}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
