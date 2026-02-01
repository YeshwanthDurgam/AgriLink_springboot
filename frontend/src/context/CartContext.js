import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import cartService from '../services/cartService';
import guestService from '../services/guestService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [loading] = useState(false);

  // Fetch cart count
  const fetchCartCount = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const data = await cartService.getCartCount();
        setCartCount(data?.count || 0);
      } else {
        setCartCount(guestService.getGuestCartCount());
      }
    } catch (err) {
      console.error('Error fetching cart count:', err);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]); // Refetch when auth state changes via fetchCartCount dependency

  // Optimistic increment (called immediately when adding to cart)
  const incrementCartCount = useCallback((amount = 1) => {
    setCartCount(prev => prev + amount);
  }, []);

  // Optimistic decrement (called when removing from cart)
  const decrementCartCount = useCallback((amount = 1) => {
    setCartCount(prev => Math.max(0, prev - amount));
  }, []);

  // Set exact count
  const setCount = useCallback((count) => {
    setCartCount(typeof count === 'number' ? count : 0);
  }, []);

  // Listen for cart update events from other components
  useEffect(() => {
    const handleCartUpdate = (event) => {
      const newCount = event.detail?.count;
      if (typeof newCount === 'number') {
        setCartCount(newCount);
      } else {
        // Refetch if count not provided
        fetchCartCount();
      }
    };

    const handleGuestCartUpdate = (event) => {
      if (!isAuthenticated) {
        setCartCount(event.detail?.totalItems || 0);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('guestCartUpdated', handleGuestCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('guestCartUpdated', handleGuestCartUpdate);
    };
  }, [isAuthenticated, fetchCartCount]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    cartCount,
    loading,
    fetchCartCount,
    incrementCartCount,
    decrementCartCount,
    setCount
  }), [cartCount, loading, fetchCartCount, incrementCartCount, decrementCartCount, setCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
