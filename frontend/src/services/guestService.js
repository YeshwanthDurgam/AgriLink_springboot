/**
 * Guest Service - Handles cart and wishlist for non-authenticated users
 * Data is stored in localStorage and synced to server on login
 */

const GUEST_CART_KEY = 'agrilink_guest_cart';
const GUEST_WISHLIST_KEY = 'agrilink_guest_wishlist';

const guestService = {
  // ============= CART OPERATIONS =============
  
  /**
   * Get guest cart from localStorage
   */
  getGuestCart: () => {
    try {
      const cart = localStorage.getItem(GUEST_CART_KEY);
      if (cart) {
        return JSON.parse(cart);
      }
      return { items: [], totalAmount: 0, totalItems: 0 };
    } catch (error) {
      console.error('Error reading guest cart:', error);
      return { items: [], totalAmount: 0, totalItems: 0 };
    }
  },

  /**
   * Save guest cart to localStorage
   */
  saveGuestCart: (cart) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
      // Dispatch custom event so Navbar can update
      window.dispatchEvent(new CustomEvent('guestCartUpdated', { detail: cart }));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  },

  /**
   * Add item to guest cart
   */
  addToGuestCart: (listing, quantity = 1) => {
    const cart = guestService.getGuestCart();
    const existingIndex = cart.items.findIndex(item => item.listingId === listing.id);
    
    if (existingIndex >= 0) {
      // Update quantity if item exists
      cart.items[existingIndex].quantity += quantity;
      cart.items[existingIndex].subtotal = 
        cart.items[existingIndex].quantity * cart.items[existingIndex].price;
    } else {
      // Add new item
      cart.items.push({
        listingId: listing.id,
        productName: listing.title || listing.productName,
        price: listing.price,
        quantity: quantity,
        subtotal: listing.price * quantity,
        unit: listing.unit || 'kg',
        imageUrl: listing.images?.[0]?.imageUrl || listing.imageUrl || null,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        availableQuantity: listing.quantity || listing.availableQuantity || 100
      });
    }
    
    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    guestService.saveGuestCart(cart);
    return cart;
  },

  /**
   * Update item quantity in guest cart
   */
  updateGuestCartItem: (listingId, quantity) => {
    const cart = guestService.getGuestCart();
    const itemIndex = cart.items.findIndex(item => item.listingId === listingId);
    
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].subtotal = quantity * cart.items[itemIndex].price;
      }
      
      // Recalculate totals
      cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      cart.totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      
      guestService.saveGuestCart(cart);
    }
    
    return cart;
  },

  /**
   * Remove item from guest cart
   */
  removeFromGuestCart: (listingId) => {
    const cart = guestService.getGuestCart();
    cart.items = cart.items.filter(item => item.listingId !== listingId);
    
    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    guestService.saveGuestCart(cart);
    return cart;
  },

  /**
   * Clear guest cart
   */
  clearGuestCart: () => {
    const emptyCart = { items: [], totalAmount: 0, totalItems: 0 };
    guestService.saveGuestCart(emptyCart);
    return emptyCart;
  },

  /**
   * Get guest cart item count
   */
  getGuestCartCount: () => {
    const cart = guestService.getGuestCart();
    return cart.totalItems || 0;
  },

  // ============= WISHLIST OPERATIONS =============

  /**
   * Get guest wishlist from localStorage
   */
  getGuestWishlist: () => {
    try {
      const wishlist = localStorage.getItem(GUEST_WISHLIST_KEY);
      if (wishlist) {
        return JSON.parse(wishlist);
      }
      return [];
    } catch (error) {
      console.error('Error reading guest wishlist:', error);
      return [];
    }
  },

  /**
   * Save guest wishlist to localStorage
   */
  saveGuestWishlist: (wishlist) => {
    try {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('guestWishlistUpdated', { detail: wishlist }));
    } catch (error) {
      console.error('Error saving guest wishlist:', error);
    }
  },

  /**
   * Add item to guest wishlist
   */
  addToGuestWishlist: (listing) => {
    const wishlist = guestService.getGuestWishlist();
    
    // Check if already in wishlist
    if (!wishlist.some(item => item.listingId === listing.id)) {
      wishlist.push({
        listingId: listing.id,
        productName: listing.title || listing.productName,
        price: listing.price,
        unit: listing.unit || 'kg',
        imageUrl: listing.images?.[0]?.imageUrl || listing.imageUrl || null,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        addedAt: new Date().toISOString()
      });
      
      guestService.saveGuestWishlist(wishlist);
    }
    
    return wishlist;
  },

  /**
   * Remove item from guest wishlist
   */
  removeFromGuestWishlist: (listingId) => {
    let wishlist = guestService.getGuestWishlist();
    wishlist = wishlist.filter(item => item.listingId !== listingId);
    guestService.saveGuestWishlist(wishlist);
    return wishlist;
  },

  /**
   * Check if item is in guest wishlist
   */
  isInGuestWishlist: (listingId) => {
    const wishlist = guestService.getGuestWishlist();
    return wishlist.some(item => item.listingId === listingId);
  },

  /**
   * Get guest wishlist count
   */
  getGuestWishlistCount: () => {
    const wishlist = guestService.getGuestWishlist();
    return wishlist.length;
  },

  /**
   * Toggle wishlist item
   */
  toggleGuestWishlist: (listing) => {
    if (guestService.isInGuestWishlist(listing.id)) {
      guestService.removeFromGuestWishlist(listing.id);
      return false;
    } else {
      guestService.addToGuestWishlist(listing);
      return true;
    }
  },

  // ============= SYNC OPERATIONS =============

  /**
   * Get data to sync when user logs in
   */
  getDataToSync: () => {
    return {
      cart: guestService.getGuestCart(),
      wishlist: guestService.getGuestWishlist()
    };
  },

  /**
   * Clear all guest data after successful sync
   */
  clearAllGuestData: () => {
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.removeItem(GUEST_WISHLIST_KEY);
  },

  /**
   * Check if there's guest data to sync
   */
  hasGuestData: () => {
    const cart = guestService.getGuestCart();
    const wishlist = guestService.getGuestWishlist();
    return cart.items.length > 0 || wishlist.length > 0;
  }
};

export default guestService;
