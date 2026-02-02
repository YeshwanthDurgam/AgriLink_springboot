import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Use ref to always have access to latest setCartCount without recreating functions
  const setCartCountRef = useRef(setCartCount);
  setCartCountRef.current = setCartCount;

  // Fetch cart count from server/localStorage
  const fetchCartCount = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const data = await cartService.getCartCount();
        setCartCountRef.current(data?.count || 0);
      } else {
        setCartCountRef.current(guestService.getGuestCartCount());
      }
    } catch (err) {
      console.error('Error fetching cart count:', err);
    }
  }, [isAuthenticated]);

  // Initial fetch on mount and when auth changes
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  // Listen for guest cart updates
  useEffect(() => {
    const handleGuestCartUpdate = (event) => {
      if (!isAuthenticated) {
        setCartCountRef.current(event.detail?.totalItems || 0);
      }
    };

    window.addEventListener('guestCartUpdated', handleGuestCartUpdate);
    return () => window.removeEventListener('guestCartUpdated', handleGuestCartUpdate);
  }, [isAuthenticated]);

  // Stable function references using useCallback - these NEVER change
  const incrementCartCount = useCallback((amount = 1) => {
    setCartCountRef.current(prev => prev + amount);
  }, []);

  const decrementCartCount = useCallback((amount = 1) => {
    setCartCountRef.current(prev => Math.max(0, prev - amount));
  }, []);

  const setCount = useCallback((count) => {
    setCartCountRef.current(typeof count === 'number' ? count : 0);
  }, []);

  return (
    <CartContext.Provider value={{
      cartCount,
      fetchCartCount,
      incrementCartCount,
      decrementCartCount,
      setCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
