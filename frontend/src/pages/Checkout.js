import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cartService from '../services/cartService';
import addressService from '../services/addressService';
import orderService from '../services/orderService';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'USA',
    postalCode: '',
    deliveryInstructions: '',
    isDefault: false
  });

  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cartData, addressData] = await Promise.all([
        cartService.getCart(),
        addressService.getAddresses()
      ]);
      
      setCart(cartData);
      setAddresses(addressData);
      
      // Select default address
      const defaultAddr = addressData.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      } else if (addressData.length > 0) {
        setSelectedAddress(addressData[0].id);
      }
      
      // If no addresses and cart has items, show address form
      if (addressData.length === 0 && cartData?.items?.length > 0) {
        setShowAddressForm(true);
      }
    } catch (err) {
      console.error('Error fetching checkout data:', err);
      setError('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const saved = await addressService.createAddress(newAddress);
      setAddresses(prev => [...prev, saved]);
      setSelectedAddress(saved.id);
      setShowAddressForm(false);
      setNewAddress({
        fullName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'USA',
        postalCode: '',
        deliveryInstructions: '',
        isDefault: false
      });
    } catch (err) {
      console.error('Error saving address:', err);
      setError('Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select or add a delivery address');
      return;
    }

    if (!cart?.items?.length) {
      setError('Your cart is empty');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const address = addresses.find(a => a.id === selectedAddress);
      
      // Group items by seller for multi-order support
      const sellerGroups = cart.items.reduce((groups, item) => {
        const sellerId = item.sellerId;
        if (!groups[sellerId]) {
          groups[sellerId] = [];
        }
        groups[sellerId].push(item);
        return groups;
      }, {});

      // Create order(s) for each seller
      const orderPromises = Object.entries(sellerGroups).map(([sellerId, items]) => {
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        
        return orderService.createOrder({
          sellerId,
          listingId: items[0].listingId, // Primary listing
          items: items.map(item => ({
            listingId: item.listingId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          totalAmount,
          shippingAddress: address.addressLine1 + (address.addressLine2 ? ', ' + address.addressLine2 : ''),
          shippingCity: address.city,
          shippingState: address.state,
          shippingPostalCode: address.postalCode,
          shippingCountry: address.country,
          shippingPhone: address.phoneNumber,
          notes
        });
      });

      const orders = await Promise.all(orderPromises);
      
      // Clear cart after successful order
      await cartService.clearCart();
      
      // Redirect to order confirmation
      if (orders.length === 1) {
        navigate(`/orders/${orders[0].id}`, { state: { newOrder: true } });
      } else {
        navigate('/orders', { state: { newOrders: orders.length } });
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="loading">Loading checkout...</div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checking out.</p>
          <button onClick={() => navigate('/marketplace')} className="btn btn-primary">
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      <div className="checkout-content">
        <div className="checkout-main">
          {/* Shipping Address Section */}
          <section className="checkout-section">
            <h2>Shipping Address</h2>
            
            {addresses.length > 0 && !showAddressForm && (
              <div className="address-list">
                {addresses.map(address => (
                  <label key={address.id} className={`address-card ${selectedAddress === address.id ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddress === address.id}
                      onChange={() => setSelectedAddress(address.id)}
                    />
                    <div className="address-details">
                      <div className="address-name">
                        {address.fullName}
                        {address.isDefault && <span className="default-badge">Default</span>}
                      </div>
                      <div className="address-line">{address.addressLine1}</div>
                      {address.addressLine2 && <div className="address-line">{address.addressLine2}</div>}
                      <div className="address-line">
                        {address.city}, {address.state} {address.postalCode}
                      </div>
                      <div className="address-line">{address.country}</div>
                      <div className="address-phone">{address.phoneNumber}</div>
                    </div>
                  </label>
                ))}
                <button 
                  onClick={() => setShowAddressForm(true)} 
                  className="btn btn-outline add-address-btn"
                >
                  + Add New Address
                </button>
              </div>
            )}

            {showAddressForm && (
              <form onSubmit={handleSaveAddress} className="address-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={newAddress.fullName}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={newAddress.phoneNumber}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={newAddress.addressLine1}
                    onChange={handleAddressChange}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={newAddress.addressLine2}
                    onChange={handleAddressChange}
                    placeholder="Apartment, suite, unit, etc. (optional)"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={newAddress.city}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      name="state"
                      value={newAddress.state}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Postal Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={newAddress.postalCode}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={newAddress.country}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Delivery Instructions</label>
                  <textarea
                    name="deliveryInstructions"
                    value={newAddress.deliveryInstructions}
                    onChange={handleAddressChange}
                    placeholder="Any special instructions for delivery"
                    rows="2"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={newAddress.isDefault}
                      onChange={handleAddressChange}
                    />
                    Set as default address
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => setShowAddressForm(false)} 
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>

          {/* Order Notes Section */}
          <section className="checkout-section">
            <h2>Order Notes (Optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or special instructions for your order..."
              rows="3"
              className="order-notes"
            />
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <div className="checkout-sidebar">
          <div className="order-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-items">
              {cart.items.map(item => (
                <div key={item.id} className="summary-item">
                  <div className="item-info">
                    <span className="item-name">{item.listingTitle || 'Product'}</span>
                    <span className="item-qty">× {item.quantity}</span>
                  </div>
                  <span className="item-price">₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cart.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free">Free</span>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <span>Calculated later</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total">
              <span>Total</span>
              <span>₹{cart.totalAmount?.toFixed(2)}</span>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={submitting || !selectedAddress}
              className="btn btn-primary btn-place-order"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>

            <p className="terms-note">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
