import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import wishlistService from '../services/wishlistService';
import cartService from '../services/cartService';
import guestService from '../services/guestService';
import EmptyState from '../components/EmptyState';
import './Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const isGuest = !user;
  const isFarmer = user?.roles?.includes('FARMER');

  // Block farmers from accessing wishlist
  useEffect(() => {
    if (isFarmer) {
      toast.error('Farmers cannot use the wishlist feature');
      navigate('/farmer/dashboard');
      return;
    }
  }, [isFarmer, navigate]);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (isGuest) {
        // Use guest wishlist from localStorage
        const guestWishlist = guestService.getGuestWishlist();
        setItems(guestWishlist);
      } else {
        const data = await wishlistService.getAllWishlistItems();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      // Don't show error for empty wishlist (404 or empty response)
      if (err.response?.status === 404 || err.response?.status === 204) {
        setItems([]);
      } else {
        setError('Failed to load wishlist. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    if (!isFarmer) {
      fetchWishlist();
    }
  }, [isFarmer, fetchWishlist]);

  // Listen for guest wishlist updates
  useEffect(() => {
    if (isGuest) {
      const handleGuestWishlistUpdate = (event) => {
        setItems(event.detail);
      };
      window.addEventListener('guestWishlistUpdated', handleGuestWishlistUpdate);
      return () => window.removeEventListener('guestWishlistUpdated', handleGuestWishlistUpdate);
    }
  }, [isGuest]);

  const handleRemoveFromWishlist = async (listingId) => {
    setActionLoading(prev => ({ ...prev, [listingId]: 'removing' }));
    try {
      if (isGuest) {
        guestService.removeFromGuestWishlist(listingId);
        setItems(prev => prev.filter(item => item.listingId !== listingId));
      } else {
        await wishlistService.removeFromWishlist(listingId);
        setItems(prev => prev.filter(item => item.listingId !== listingId));
      }
      toast.success('Removed from wishlist');
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Failed to remove item from wishlist');
    } finally {
      setActionLoading(prev => ({ ...prev, [listingId]: null }));
    }
  };

  const handleMoveToCart = async (item) => {
    setActionLoading(prev => ({ ...prev, [item.listingId]: 'moving' }));
    try {
      if (isGuest) {
        // Add to guest cart
        guestService.addToGuestCart({
          id: item.listingId,
          title: item.productName || item.listingTitle,
          price: item.price,
          unit: item.unit,
          imageUrl: item.imageUrl || item.listingImageUrl,
          sellerId: item.sellerId,
          sellerName: item.sellerName
        });
        // Remove from guest wishlist
        guestService.removeFromGuestWishlist(item.listingId);
        setItems(prev => prev.filter(i => i.listingId !== item.listingId));
      } else {
        // Add to cart with all required fields
        await cartService.addToCart({
          listingId: item.listingId,
          sellerId: item.sellerId,
          quantity: 1,
          unitPrice: item.price,
          listingTitle: item.listingTitle,
          listingImageUrl: item.listingImageUrl || null,
          unit: item.unit || 'kg',
          availableQuantity: item.availableQuantity || null
        });
        // Remove from wishlist
        await wishlistService.removeFromWishlist(item.listingId);
        setItems(prev => prev.filter(i => i.listingId !== item.listingId));
      }
      toast.success('Moved to cart');
    } catch (err) {
      console.error('Error moving to cart:', err);
      toast.error('Failed to move item to cart');
    } finally {
      setActionLoading(prev => ({ ...prev, [item.listingId]: null }));
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Are you sure you want to clear your wishlist?')) return;
    
    try {
      if (isGuest) {
        guestService.saveGuestWishlist([]);
      } else {
        await wishlistService.clearWishlist();
      }
      setItems([]);
      toast.success('Wishlist cleared');
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      toast.error('Failed to clear wishlist');
    }
  };

  if (loading) {
    return (
      <div className="wishlist-container">
        <div className="loading">Loading wishlist...</div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1>❤️ My Wishlist</h1>
        {isGuest && (
          <div className="guest-notice">
            <span className="guest-badge">👤 Guest Mode</span>
            <Link to="/login" state={{ from: '/wishlist' }} className="login-link">Login to save your wishlist</Link>
          </div>
        )}
        {items.length > 0 && (
          <button onClick={handleClearWishlist} className="btn btn-outline">
            Clear All
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState 
          type="wishlist"
          actionText="Explore Marketplace"
          actionLink="/marketplace"
        />
      ) : (
        <div className="wishlist-grid">
          {items.map(item => (
            <div key={item.id || item.listingId} className={`wishlist-card ${actionLoading[item.listingId] ? 'loading' : ''}`}>
              <Link to={`/marketplace/listing/${item.listingId}`} className="card-image">
                {(item.imageUrl || item.listingImageUrl) ? (
                  <img src={item.imageUrl || item.listingImageUrl} alt={item.productName || item.listingTitle} />
                ) : (
                  <div className="placeholder-image">🌾</div>
                )}
              </Link>
              
              <div className="card-content">
                <Link to={`/marketplace/listing/${item.listingId}`} className="card-title">
                  {item.productName || item.listingTitle}
                </Link>
                
                {item.categoryName && (
                  <span className="card-category">{item.categoryName}</span>
                )}
                
                <div className="card-price">
                  <span className="price">${item.price?.toFixed(2)}</span>
                  <span className="unit">per {item.unit || 'unit'}</span>
                </div>

                {item.availableQuantity !== undefined && (
                  <div className={`stock-status ${item.availableQuantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {item.availableQuantity > 0 
                      ? `${item.availableQuantity} available` 
                      : 'Out of stock'}
                  </div>
                )}

                <div className="card-actions">
                  <button 
                    onClick={() => handleMoveToCart(item)}
                    disabled={actionLoading[item.listingId] || item.availableQuantity === 0}
                    className="btn btn-primary btn-sm"
                  >
                    {actionLoading[item.listingId] === 'moving' ? 'Moving...' : '🛒 Add to Cart'}
                  </button>
                  <button 
                    onClick={() => handleRemoveFromWishlist(item.listingId)}
                    disabled={actionLoading[item.listingId]}
                    className="btn btn-outline btn-sm"
                  >
                    {actionLoading[item.listingId] === 'removing' ? 'Removing...' : '✕ Remove'}
                  </button>
                </div>

                <div className="added-date">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
