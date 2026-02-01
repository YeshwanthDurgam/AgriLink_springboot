import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import guestService from '../services/guestService';
import cartService from '../services/cartService';
import wishlistService from '../services/wishlistService';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state - handle both string and object formats
  const getRedirectPath = () => {
    const fromState = location.state?.from;
    if (typeof fromState === 'string') {
      return fromState;
    } else if (fromState?.pathname) {
      return fromState.pathname;
    }
    return null;
  };

  const from = getRedirectPath();

  useEffect(() => {
    if (isAuthenticated && !submitting) {
      // If already authenticated, redirect
      navigate(from || '/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, from, submitting]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Login successful! Welcome back.');
      
      // Sync guest cart to server if there's guest data
      if (guestService.hasGuestData()) {
        await syncGuestDataToServer();
      }
      
      // Determine redirect: use passed 'from' location, or role-based dashboard
      const redirectTo = from || result.redirectTo || '/dashboard';
      navigate(redirectTo, { replace: true });
    } else {
      toast.error(result.message || 'Login failed. Please try again.');
    }
    
    setSubmitting(false);
  };

  // Sync guest cart and wishlist to server after login
  const syncGuestDataToServer = async () => {
    try {
      const guestData = guestService.getDataToSync();
      
      // Sync cart items
      if (guestData.cart.items.length > 0) {
        for (const item of guestData.cart.items) {
          try {
            await cartService.addToCart({
              listingId: item.listingId,
              sellerId: item.sellerId,
              quantity: item.quantity,
              unitPrice: item.price,
              listingTitle: item.productName,
              listingImageUrl: item.imageUrl,
              unit: item.unit,
              availableQuantity: item.availableQuantity
            });
          } catch (err) {
            console.warn('Could not sync cart item:', item.productName, err);
          }
        }
        toast.success(`${guestData.cart.items.length} item(s) from your guest cart have been added`);
      }
      
      // Sync wishlist items
      if (guestData.wishlist.length > 0) {
        for (const item of guestData.wishlist) {
          try {
            await wishlistService.addToWishlist(item.listingId);
          } catch (err) {
            console.warn('Could not sync wishlist item:', item.productName, err);
          }
        }
        toast.success(`${guestData.wishlist.length} item(s) from your guest wishlist have been added`);
      }
      
      // Clear guest data after successful sync
      guestService.clearAllGuestData();
    } catch (err) {
      console.error('Error syncing guest data:', err);
      // Don't block login if sync fails, but notify user
      toast.warning('Some items from your guest cart could not be synced');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue to AgriLink</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? 'error' : ''}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`has-toggle ${errors.password ? 'error' : ''}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="checkbox-wrapper">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>

        <div className="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{flex: 1, padding: '8px'}}
              onClick={() => setFormData({email: 'farmer1@agrilink.com', password: 'Farmer@123'})}
            >
              Farmer Login
            </button>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{flex: 1, padding: '8px'}}
              onClick={() => setFormData({email: 'customer@agrilink.com', password: 'Customer@123'})}
            >
              Customer Login
            </button>
          </div>
        </div>
      </div>

      <div className="auth-banner">
        <div className="banner-content">
          <div className="logo-area">
            <div className="logo-icon">🌾</div>
            <h2>AgriLink</h2>
            <h3>Farm Fresh • Direct Sales</h3>
          </div>
          <p className="tagline">
            Join thousands of farmers and buyers on India's most trusted
            agricultural marketplace. Fresh produce, fair prices, direct connections.
          </p>
          <ul className="banner-features">
            <li>
              <span className="feature-icon">🚜</span>
              <span>Direct farm-to-market sales</span>
            </li>
            <li>
              <span className="feature-icon">📡</span>
              <span>Real-time IoT crop monitoring</span>
            </li>
            <li>
              <span className="feature-icon">🔒</span>
              <span>Secure payment gateway</span>
            </li>
            <li>
              <span className="feature-icon">🚚</span>
              <span>Nationwide express delivery</span>
            </li>
          </ul>
        </div>
        <div className="banner-stats">
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Farmers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">50K+</span>
            <span className="stat-label">Customers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">₹5Cr+</span>
            <span className="stat-label">Trade Value</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
