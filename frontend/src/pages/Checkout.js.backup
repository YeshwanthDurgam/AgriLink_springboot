import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMapPin, FiCreditCard, FiShield, FiTruck, FiCheck, FiPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';
import addressService from '../services/addressService';
import checkoutService from '../services/checkoutService';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [summary, setSummary] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState('address'); // 'address' | 'payment' | 'processing'
  const [error, setError] = useState('');

  // Check if user is farmer - farmers cannot place orders
  useEffect(() => {
    if (user?.roles?.includes('FARMER')) {
      toast.error('Farmers cannot place orders. Please use a customer account.');
      navigate('/farmer/dashboard');
    }
  }, [user, navigate]);
  
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    deliveryInstructions: '',
    isDefault: false
  });

  const [notes, setNotes] = useState('');

  // Load Razorpay script
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  useEffect(() => {
    fetchData();
    loadRazorpayScript();
  }, [loadRazorpayScript]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cartData, addressData, summaryData] = await Promise.all([
        cartService.getCart(),
        addressService.getAddresses(),
        checkoutService.getCheckoutSummary().catch(() => null)
      ]);
      
      setCart(cartData);
      setAddresses(addressData || []);
      setSummary(summaryData);
      
      // Select default address
      const defaultAddr = addressData?.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      } else if (addressData?.length > 0) {
        setSelectedAddress(addressData[0].id);
      }
      
      // If no addresses and cart has items, show address form
      if ((!addressData || addressData.length === 0) && cartData?.items?.length > 0) {
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
        country: 'India',
        postalCode: '',
        deliveryInstructions: '',
        isDefault: false
      });
      toast.success('Address saved successfully!');
    } catch (err) {
      console.error('Error saving address:', err);
      toast.error('Failed to save address');
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    const address = addresses.find(a => a.id === selectedAddress);
    if (!address) {
      toast.error('Selected address not found');
      return;
    }

    setSubmitting(true);
    setPaymentStep('processing');
    setError('');

    try {
      // Initialize checkout with Razorpay
      const checkoutData = {
        addressId: selectedAddress,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode,
        phoneNumber: address.phoneNumber,
        fullName: address.fullName,
        notes
      };

      const checkoutResponse = await checkoutService.initializeCheckout(checkoutData);
      
      // Open Razorpay payment modal
      await openRazorpayPayment(checkoutResponse, address);

    } catch (err) {
      console.error('Error initializing checkout:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
      setPaymentStep('address');
      toast.error('Failed to initialize payment');
    } finally {
      setSubmitting(false);
    }
  };

  const openRazorpayPayment = async (checkoutResponse, address) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error('Failed to load payment gateway. Please refresh and try again.');
      setPaymentStep('address');
      return;
    }

    const options = {
      key: checkoutResponse.razorpayKeyId,
      amount: checkoutResponse.razorpayAmount, // Amount in paise
      currency: checkoutResponse.currency,
      name: 'AgriLink',
      description: `Order #${checkoutResponse.orderNumber}`,
      order_id: checkoutResponse.razorpayOrderId,
      handler: async function (response) {
        // Payment successful - verify on backend
        await handlePaymentSuccess(response, checkoutResponse);
      },
      prefill: {
        name: checkoutResponse.customerName || address.fullName,
        email: checkoutResponse.customerEmail || '',
        contact: checkoutResponse.customerPhone || address.phoneNumber
      },
      notes: {
        order_id: checkoutResponse.orderId,
        order_number: checkoutResponse.orderNumber
      },
      theme: {
        color: '#22c55e' // AgriLink green
      },
      modal: {
        ondismiss: function() {
          setPaymentStep('address');
          toast.info('Payment cancelled');
        }
      }
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        handlePaymentFailure(response);
      });
      razorpay.open();
      setPaymentStep('payment');
    } catch (err) {
      console.error('Error opening Razorpay:', err);
      toast.error('Failed to open payment gateway');
      setPaymentStep('address');
    }
  };

  const handlePaymentSuccess = async (razorpayResponse, checkoutResponse) => {
    setPaymentStep('processing');
    
    try {
      const verificationData = {
        orderId: checkoutResponse.orderId,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature
      };

      const result = await checkoutService.verifyPayment(verificationData);

      if (result.success) {
        toast.success('Payment successful! Order confirmed.');
        // Redirect to order confirmation page
        navigate(`/order-confirmation/${result.orderId}`, { 
          state: { 
            newOrder: true,
            orderNumber: result.orderNumber,
            paymentId: result.transactionId
          } 
        });
      } else {
        toast.error(result.message || 'Payment verification failed');
        setPaymentStep('address');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      toast.error('Payment verification failed. Please contact support.');
      setPaymentStep('address');
    }
  };

  const handlePaymentFailure = (response) => {
    console.error('Payment failed:', response.error);
    toast.error(`Payment failed: ${response.error.description}`);
    setPaymentStep('address');
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checking out.</p>
          <button onClick={() => navigate('/marketplace')} className="btn btn-primary">
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = summary?.subtotal || cart?.totalAmount || 0;
  const shippingCharges = summary?.shippingCharges || 0;
  const tax = summary?.tax || 0;
  const totalAmount = summary?.totalAmount || subtotal;
  const amountForFreeShipping = summary?.amountForFreeShipping || 0;

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="checkout-steps">
          <div className={`step ${paymentStep === 'address' ? 'active' : 'completed'}`}>
            <span className="step-number">1</span>
            <span className="step-label">Address</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${paymentStep === 'payment' ? 'active' : paymentStep === 'processing' ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Payment</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${paymentStep === 'processing' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Confirm</span>
          </div>
        </div>
      </div>

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
            <div className="section-header">
              <FiMapPin className="section-icon" />
              <h2>Delivery Address</h2>
            </div>
            
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
                    <div className="address-content">
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
                      <div className="address-phone">📞 {address.phoneNumber}</div>
                    </div>
                    {selectedAddress === address.id && (
                      <div className="selected-indicator">
                        <FiCheck />
                      </div>
                    )}
                  </label>
                ))}
                <button 
                  onClick={() => setShowAddressForm(true)} 
                  className="add-address-btn"
                >
                  <FiPlus /> Add New Address
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
                      placeholder="Enter full name"
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
                      placeholder="10-digit mobile number"
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
                    placeholder="House number, street name"
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
                    placeholder="Apartment, suite, landmark (optional)"
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
                    <label>PIN Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={newAddress.postalCode}
                      onChange={handleAddressChange}
                      placeholder="6-digit PIN code"
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
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={newAddress.isDefault}
                      onChange={handleAddressChange}
                    />
                    <span>Set as default address</span>
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
            <div className="section-header">
              <span className="section-icon">📝</span>
              <h2>Order Notes (Optional)</h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or special instructions for your order..."
              rows="3"
              className="order-notes"
            />
          </section>

          {/* Payment Info */}
          <section className="checkout-section payment-info">
            <div className="section-header">
              <FiCreditCard className="section-icon" />
              <h2>Payment</h2>
            </div>
            <div className="payment-methods">
              <div className="payment-method selected">
                <img src="https://cdn.razorpay.com/static/assets/logo/payment.svg" alt="Razorpay" className="razorpay-logo" />
                <div className="payment-method-info">
                  <span className="payment-method-name">Pay with Razorpay</span>
                  <span className="payment-method-desc">UPI, Cards, Net Banking, Wallets</span>
                </div>
              </div>
            </div>
            <div className="security-badges">
              <div className="badge">
                <FiShield /> Secure Payment
              </div>
              <div className="badge">
                <FiTruck /> Fast Delivery
              </div>
            </div>
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <div className="checkout-sidebar">
          <div className="order-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-items">
              {cart.items.map(item => (
                <div key={item.listingId} className="summary-item">
                  <div className="item-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.listingTitle} />
                    ) : (
                      <div className="placeholder-image">🌾</div>
                    )}
                  </div>
                  <div className="item-info">
                    <span className="item-name">{item.listingTitle || 'Product'}</span>
                    <span className="item-qty">Qty: {item.quantity} {item.unit || 'kg'}</span>
                  </div>
                  <span className="item-price">₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span>Subtotal ({cart.items.length} items)</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="summary-row">
              <span>Shipping</span>
              {shippingCharges > 0 ? (
                <span>₹{shippingCharges.toFixed(2)}</span>
              ) : (
                <span className="free">FREE</span>
              )}
            </div>

            {amountForFreeShipping > 0 && (
              <div className="free-shipping-notice">
                Add ₹{amountForFreeShipping.toFixed(2)} more for FREE shipping!
              </div>
            )}

            <div className="summary-row">
              <span>Tax (GST 5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total">
              <span>Total</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>

            <button 
              onClick={handleProceedToPayment}
              disabled={submitting || !selectedAddress || paymentStep === 'processing'}
              className="btn btn-primary btn-place-order"
            >
              {submitting || paymentStep === 'processing' ? (
                <>
                  <span className="spinner-small"></span>
                  Processing...
                </>
              ) : (
                <>
                  <FiCreditCard />
                  Proceed to Pay ₹{totalAmount.toFixed(2)}
                </>
              )}
            </button>

            <div className="order-benefits">
              <div className="benefit">
                <FiShield /> 100% Secure Payment
              </div>
              <div className="benefit">
                <FiTruck /> Free Returns within 7 days
              </div>
            </div>

            <p className="terms-note">
              By placing your order, you agree to AgriLink's <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
