import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import cartService from '../services/cartService';
import EmptyState from '../components/EmptyState';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartService.getCart();
      setCart(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (listingId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(prev => ({ ...prev, [listingId]: true }));
    try {
      const updatedCart = await cartService.updateCartItem(listingId, newQuantity);
      setCart(updatedCart);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
    } finally {
      setUpdating(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const handleRemoveItem = async (listingId) => {
    setUpdating(prev => ({ ...prev, [listingId]: true }));
    try {
      const updatedCart = await cartService.removeFromCart(listingId);
      setCart(updatedCart);
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    
    try {
      await cartService.clearCart();
      setCart({ items: [], totalAmount: 0, totalItems: 0 });
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="cart-container">
        <div className="loading">Loading cart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchCart} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        {!isEmpty && (
          <button onClick={handleClearCart} className="btn btn-danger btn-sm">
            Clear Cart
          </button>
        )}
      </div>

      {isEmpty ? (
        <EmptyState 
          type="cart"
          actionText="Browse Marketplace"
          actionLink="/marketplace"
        />
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {items.map(item => (
              <div key={item.listingId} className={`cart-item ${updating[item.listingId] ? 'updating' : ''}`}>
                <div className="item-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.listingTitle} />
                  ) : (
                    <div className="placeholder-image">🌾</div>
                  )}
                </div>
                
                <div className="item-details">
                  <Link to={`/marketplace/listing/${item.listingId}`} className="item-title">
                    {item.listingTitle || 'Product'}
                  </Link>
                  <div className="item-price">₹{item.unitPrice?.toFixed(2)} per unit</div>
                </div>

                <div className="item-quantity">
                  <button 
                    onClick={() => handleUpdateQuantity(item.listingId, item.quantity - 1)}
                    disabled={item.quantity <= 1 || updating[item.listingId]}
                    className="qty-btn"
                  >
                    −
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button 
                    onClick={() => handleUpdateQuantity(item.listingId, item.quantity + 1)}
                    disabled={updating[item.listingId]}
                    className="qty-btn"
                  >
                    +
                  </button>
                </div>

                <div className="item-subtotal">
                  ₹{item.subtotal?.toFixed(2) || (item.quantity * item.unitPrice).toFixed(2)}
                </div>

                <button 
                  onClick={() => handleRemoveItem(item.listingId)}
                  disabled={updating[item.listingId]}
                  className="btn-remove"
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Items ({cart.totalItems})</span>
              <span>₹{cart.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">Calculated at checkout</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Subtotal</span>
              <span>₹{cart.totalAmount?.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} className="btn btn-primary btn-checkout">
              Proceed to Checkout
            </button>
            <Link to="/marketplace" className="continue-shopping">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
