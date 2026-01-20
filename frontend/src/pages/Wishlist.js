import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import wishlistService from '../services/wishlistService';
import cartService from '../services/cartService';
import './Wishlist.css';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await wishlistService.getAllWishlistItems();
      setItems(Array.isArray(data) ? data : []);
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
  };

  const handleRemoveFromWishlist = async (listingId) => {
    setActionLoading(prev => ({ ...prev, [listingId]: 'removing' }));
    try {
      await wishlistService.removeFromWishlist(listingId);
      setItems(prev => prev.filter(item => item.listingId !== listingId));
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError('Failed to remove item from wishlist');
    } finally {
      setActionLoading(prev => ({ ...prev, [listingId]: null }));
    }
  };

  const handleMoveToCart = async (item) => {
    setActionLoading(prev => ({ ...prev, [item.listingId]: 'moving' }));
    try {
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
    } catch (err) {
      console.error('Error moving to cart:', err);
      setError('Failed to move item to cart');
    } finally {
      setActionLoading(prev => ({ ...prev, [item.listingId]: null }));
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Are you sure you want to clear your wishlist?')) return;
    
    try {
      await wishlistService.clearWishlist();
      setItems([]);
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      setError('Failed to clear wishlist');
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
        <h1>My Wishlist</h1>
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
        <div className="wishlist-empty">
          <div className="empty-icon">💚</div>
          <h2>Your wishlist is empty</h2>
          <p>Save items you love by clicking the heart icon on any product.</p>
          <Link to="/marketplace" className="btn btn-primary">
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map(item => (
            <div key={item.id} className={`wishlist-card ${actionLoading[item.listingId] ? 'loading' : ''}`}>
              <Link to={`/marketplace/listing/${item.listingId}`} className="card-image">
                {item.listingImageUrl ? (
                  <img src={item.listingImageUrl} alt={item.listingTitle} />
                ) : (
                  <div className="placeholder-image">🌾</div>
                )}
              </Link>
              
              <div className="card-content">
                <Link to={`/marketplace/listing/${item.listingId}`} className="card-title">
                  {item.listingTitle}
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
