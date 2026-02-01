import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
// Tree-shakeable individual icon imports
import { FiMapPin } from '@react-icons/all-files/fi/FiMapPin';
import { FiCreditCard } from '@react-icons/all-files/fi/FiCreditCard';
import { FiShield } from '@react-icons/all-files/fi/FiShield';
import { FiTruck } from '@react-icons/all-files/fi/FiTruck';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiPlus } from '@react-icons/all-files/fi/FiPlus';
import { FiChevronRight } from '@react-icons/all-files/fi/FiChevronRight';
import { FiEdit2 } from '@react-icons/all-files/fi/FiEdit2';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { FiPackage } from '@react-icons/all-files/fi/FiPackage';
import { FiGift } from '@react-icons/all-files/fi/FiGift';
import { FiPercent } from '@react-icons/all-files/fi/FiPercent';
import { FiAlertCircle } from '@react-icons/all-files/fi/FiAlertCircle';
import { FiLock } from '@react-icons/all-files/fi/FiLock';
import { FiCheckCircle } from '@react-icons/all-files/fi/FiCheckCircle';
import { FiTag } from '@react-icons/all-files/fi/FiTag';
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
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Login, 2: Address, 3: Payment, 4: Review
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);

  // Available coupons for demo
  const AVAILABLE_COUPONS = {
    'FRESH10': { discount: 10, type: 'percentage', minOrder: 500, description: '10% off on orders above ₹500' },
    'SAVE50': { discount: 50, type: 'flat', minOrder: 300, description: '₹50 off on orders above ₹300' },
    'FIRST100': { discount: 100, type: 'flat', minOrder: 0, description: '₹100 off for first order' },
    'FARM20': { discount: 20, type: 'percentage', minOrder: 1000, description: '20% off on orders above ₹1000' }
  };

  const DELIVERY_OPTIONS = [
    { id: 'standard', name: 'Standard Delivery', days: 3, price: 0, description: 'Free delivery in 3-5 days' },
    { id: 'express', name: 'Express Delivery', days: 1, price: 49, description: 'Get it tomorrow' },
    { id: 'scheduled', name: 'Scheduled Delivery', days: 2, price: 29, description: 'Choose your delivery slot' }
  ];

  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    deliveryInstructions: '',
    isDefault: false,
    addressType: 'home'
  });

  const [notes, setNotes] = useState('');

  // Check if user is farmer - farmers cannot place orders
  useEffect(() => {
    if (user?.roles?.includes('FARMER')) {
      toast.error('Farmers cannot place orders. Please use a customer account.');
      navigate('/farmer/dashboard');
    }
  }, [user, navigate]);

  // Calculate delivery estimate
  useEffect(() => {
    const selected = DELIVERY_OPTIONS.find(opt => opt.id === deliveryOption);
    if (selected) {
      const date = new Date();
      date.setDate(date.getDate() + selected.days);
      setDeliveryEstimate(date);
    }
  }, [deliveryOption]);

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
    // Set initial step based on user login status
    if (user) {
      setCurrentStep(2);
    }
  }, [loadRazorpayScript, user]);

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
      let saved;
      if (editingAddress) {
        saved = await addressService.updateAddress(editingAddress.id, newAddress);
        setAddresses(prev => prev.map(a => a.id === editingAddress.id ? saved : a));
        toast.success('Address updated successfully!');
      } else {
        saved = await addressService.createAddress(newAddress);
        setAddresses(prev => [...prev, saved]);
        toast.success('Address saved successfully!');
      }
      
      setSelectedAddress(saved.id);
      setShowAddressForm(false);
      setEditingAddress(null);
      setNewAddress({
        fullName: user?.name || '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'India',
        postalCode: '',
        deliveryInstructions: '',
        isDefault: false,
        addressType: 'home'
      });
    } catch (err) {
      console.error('Error saving address:', err);
      toast.error('Failed to save address');
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setNewAddress({
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      deliveryInstructions: address.deliveryInstructions || '',
      isDefault: address.isDefault,
      addressType: address.addressType || 'home'
    });
    setShowAddressForm(true);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    
    setTimeout(() => {
      const coupon = AVAILABLE_COUPONS[couponCode.toUpperCase()];
      if (coupon) {
        const subtotal = summary?.subtotal || cart?.totalAmount || 0;
        if (subtotal >= coupon.minOrder) {
          setAppliedCoupon({ code: couponCode.toUpperCase(), ...coupon });
          toast.success(`Coupon applied! ${coupon.description}`);
        } else {
          toast.error(`Minimum order amount is ₹${coupon.minOrder}`);
        }
      } else {
        toast.error('Invalid coupon code');
      }
      setCouponLoading(false);
    }, 500);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
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
    setCurrentStep(4);
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
        notes,
        deliveryOption,
        giftWrap,
        giftMessage: giftWrap ? giftMessage : ''
      };

      const checkoutResponse = await checkoutService.initializeCheckout(checkoutData);
      
      // Open Razorpay payment modal
      await openRazorpayPayment(checkoutResponse, address);

    } catch (err) {
      console.error('Error initializing checkout:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
      setCurrentStep(3);
      toast.error('Failed to initialize payment');
    } finally {
      setSubmitting(false);
    }
  };

  const openRazorpayPayment = async (checkoutResponse, address) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error('Failed to load payment gateway. Please refresh and try again.');
      setCurrentStep(3);
      return;
    }

    const options = {
      key: checkoutResponse.razorpayKeyId,
      amount: checkoutResponse.razorpayAmount,
      currency: checkoutResponse.currency,
      name: 'AgriLink',
      description: `Order #${checkoutResponse.orderNumber}`,
      order_id: checkoutResponse.razorpayOrderId,
      handler: async function (response) {
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
        color: '#2e7d32'
      },
      modal: {
        ondismiss: function() {
          setCurrentStep(3);
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
    } catch (err) {
      console.error('Error opening Razorpay:', err);
      toast.error('Failed to open payment gateway');
      setCurrentStep(3);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse, checkoutResponse) => {
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
        navigate(`/order-confirmation/${result.orderId}`, { 
          state: { 
            newOrder: true,
            orderNumber: result.orderNumber,
            paymentId: result.transactionId
          } 
        });
      } else {
        toast.error(result.message || 'Payment verification failed');
        setCurrentStep(3);
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      toast.error('Payment verification failed. Please contact support.');
      setCurrentStep(3);
    }
  };

  const handlePaymentFailure = (response) => {
    console.error('Payment failed:', response.error);
    toast.error(`Payment failed: ${response.error.description}`);
    setCurrentStep(3);
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  };

  // Calculate totals
  const getSubtotal = () => summary?.subtotal || cart?.totalAmount || 0;
  
  const getDeliveryCharge = () => {
    const selected = DELIVERY_OPTIONS.find(opt => opt.id === deliveryOption);
    const baseCharge = summary?.shippingCharges || 0;
    return selected?.price || baseCharge;
  };

  const getGiftWrapCharge = () => giftWrap ? 29 : 0;

  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getSubtotal();
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.discount) / 100;
    }
    return appliedCoupon.discount;
  };

  const getTax = () => summary?.tax || (getSubtotal() * 0.05);

  const getTotalAmount = () => {
    return getSubtotal() + getDeliveryCharge() + getGiftWrapCharge() + getTax() - getCouponDiscount();
  };

  const getTotalSavings = () => {
    let savings = getCouponDiscount();
    if (getSubtotal() >= 500 && deliveryOption === 'standard') {
      savings += 40; // Standard delivery would be ₹40
    }
    return savings;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-skeleton">
            <div className="skeleton-steps">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-step"></div>
              ))}
            </div>
            <div className="skeleton-content">
              <div className="skeleton-main">
                <div className="skeleton-section"></div>
                <div className="skeleton-section"></div>
              </div>
              <div className="skeleton-sidebar"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty">
            <div className="empty-icon">
              <FiPackage />
            </div>
            <h2>Your cart is empty</h2>
            <p>Add some items to your cart before checking out.</p>
            <Link to="/marketplace" className="btn btn-primary">
              <FiPackage /> Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedAddressData = addresses.find(a => a.id === selectedAddress);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Breadcrumb */}
        <div className="checkout-breadcrumb">
          <Link to="/">Home</Link>
          <FiChevronRight />
          <Link to="/cart">Cart</Link>
          <FiChevronRight />
          <span>Checkout</span>
        </div>

        {/* Checkout Steps - Modern Style (only show if logged in, skip login step) */}
        <div className="checkout-steps-container">
          {user ? (
            <>
              {/* Logged in user info bar */}
              <div className="logged-in-bar">
                <FiCheckCircle className="logged-in-icon" />
                <span>Signed in as <strong>{user?.email}</strong></span>
              </div>
              <div className="checkout-steps">
                <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                  <div className="step-number">
                    {currentStep > 2 ? <FiCheck /> : '1'}
                  </div>
                  <span className="step-label">Delivery Address</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                  <div className="step-number">
                    {currentStep > 3 ? <FiCheck /> : '2'}
                  </div>
                  <span className="step-label">Order Summary</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
                  <div className="step-number">
                    {currentStep > 4 ? <FiCheck /> : '3'}
                  </div>
                  <span className="step-label">Payment</span>
                </div>
              </div>
            </>
          ) : (
            <div className="checkout-steps">
              <div className={`step ${currentStep === 1 ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <span className="step-label">Login</span>
              </div>
              <div className="step-line"></div>
              <div className="step">
                <div className="step-number">2</div>
                <span className="step-label">Delivery Address</span>
              </div>
              <div className="step-line"></div>
              <div className="step">
                <div className="step-number">3</div>
                <span className="step-label">Order Summary</span>
              </div>
              <div className="step-line"></div>
              <div className="step">
                <div className="step-number">4</div>
                <span className="step-label">Payment</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="checkout-error">
            <FiAlertCircle />
            <span>{error}</span>
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}

        <div className="checkout-content">
          {/* Main Content - Left Side */}
          <div className="checkout-main">
            {/* Step 1: Login - Only show if not logged in */}
            {!user && (
              <div className="checkout-section active">
                <div className="section-header">
                  <div className="section-number">1</div>
                  <h2>LOGIN OR SIGNUP</h2>
                </div>
                <div className="section-content">
                  <div className="login-prompt">
                    <p>Please login or create an account to continue with checkout</p>
                    <Link to="/login" state={{ from: '/checkout' }} className="btn btn-primary">
                      Login / Sign Up
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 (if logged in) / Step 2 (if not): Delivery Address */}
            <div className={`checkout-section ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
              <div className="section-header">
                <div className="section-number">{user ? '1' : '2'}</div>
                <h2>DELIVERY ADDRESS</h2>
                {currentStep > 2 && (
                  <button onClick={() => setCurrentStep(2)} className="change-btn">
                    <FiEdit2 /> Change
                  </button>
                )}
              </div>
              
              {currentStep === 2 ? (
                <div className="section-content">
                  {!showAddressForm && addresses.length > 0 && (
                    <div className="address-list">
                      {addresses.map(address => (
                        <div 
                          key={address.id} 
                          className={`address-card ${selectedAddress === address.id ? 'selected' : ''}`}
                          onClick={() => setSelectedAddress(address.id)}
                        >
                          <label className="address-radio">
                            <input
                              type="radio"
                              name="address"
                              value={address.id}
                              checked={selectedAddress === address.id}
                              onChange={() => setSelectedAddress(address.id)}
                            />
                            <span className="radio-custom"></span>
                          </label>
                          <div className="address-content">
                            <div className="address-top">
                              <span className="address-name">{address.fullName}</span>
                              <span className={`address-type ${address.addressType || 'home'}`}>
                                {address.addressType || 'HOME'}
                              </span>
                              {address.isDefault && <span className="default-badge">Default</span>}
                            </div>
                            <div className="address-text">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </div>
                            <div className="address-text">
                              {address.city}, {address.state} - {address.postalCode}
                            </div>
                            <div className="address-phone">
                              Mobile: <strong>{address.phoneNumber}</strong>
                            </div>
                            {selectedAddress === address.id && (
                              <div className="address-actions">
                                <button onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }} className="edit-btn">
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <button onClick={() => setShowAddressForm(true)} className="add-address-btn">
                        <FiPlus /> Add a new address
                      </button>

                      {selectedAddress && (
                        <button onClick={() => setCurrentStep(3)} className="btn btn-primary deliver-here-btn">
                          Deliver Here
                        </button>
                      )}
                    </div>
                  )}

                  {showAddressForm && (
                    <form onSubmit={handleSaveAddress} className="address-form">
                      <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                      
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
                          <label>Mobile Number *</label>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={newAddress.phoneNumber}
                            onChange={handleAddressChange}
                            placeholder="10-digit mobile number"
                            pattern="[0-9]{10}"
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
                            pattern="[0-9]{6}"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Locality *</label>
                          <input
                            type="text"
                            name="addressLine2"
                            value={newAddress.addressLine2}
                            onChange={handleAddressChange}
                            placeholder="Locality / Area"
                          />
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label>Address (House No, Building, Street, Area) *</label>
                        <textarea
                          name="addressLine1"
                          value={newAddress.addressLine1}
                          onChange={handleAddressChange}
                          placeholder="House number, street name, area"
                          rows="3"
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>City/District/Town *</label>
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
                          <select
                            name="state"
                            value={newAddress.state}
                            onChange={handleAddressChange}
                            required
                          >
                            <option value="">Select State</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                            <option value="Assam">Assam</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Chhattisgarh">Chhattisgarh</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Goa">Goa</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                            <option value="Jharkhand">Jharkhand</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Manipur">Manipur</option>
                            <option value="Meghalaya">Meghalaya</option>
                            <option value="Mizoram">Mizoram</option>
                            <option value="Nagaland">Nagaland</option>
                            <option value="Odisha">Odisha</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Sikkim">Sikkim</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Tripura">Tripura</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Uttarakhand">Uttarakhand</option>
                            <option value="West Bengal">West Bengal</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Landmark (Optional)</label>
                        <input
                          type="text"
                          name="deliveryInstructions"
                          value={newAddress.deliveryInstructions}
                          onChange={handleAddressChange}
                          placeholder="Nearby landmark for easy reach"
                        />
                      </div>

                      <div className="address-type-selector">
                        <label>Address Type</label>
                        <div className="type-options">
                          <button 
                            type="button"
                            className={`type-btn ${newAddress.addressType === 'home' ? 'active' : ''}`}
                            onClick={() => setNewAddress(prev => ({ ...prev, addressType: 'home' }))}
                          >
                            Home
                          </button>
                          <button 
                            type="button"
                            className={`type-btn ${newAddress.addressType === 'work' ? 'active' : ''}`}
                            onClick={() => setNewAddress(prev => ({ ...prev, addressType: 'work' }))}
                          >
                            Work
                          </button>
                        </div>
                      </div>

                      <div className="checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={newAddress.isDefault}
                            onChange={handleAddressChange}
                          />
                          <span>Make this my default address</span>
                        </label>
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          Save and Deliver Here
                        </button>
                        {(addresses.length > 0 || editingAddress) && (
                          <button 
                            type="button" 
                            onClick={() => { setShowAddressForm(false); setEditingAddress(null); }} 
                            className="btn btn-outline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              ) : currentStep > 2 && selectedAddressData ? (
                <div className="section-summary">
                  <div className="selected-address">
                    <span className="address-name">{selectedAddressData.fullName}</span>
                    <span className="address-text">
                      {selectedAddressData.addressLine1}, {selectedAddressData.city}, {selectedAddressData.state} - {selectedAddressData.postalCode}
                    </span>
                    <span className="address-phone">Phone: {selectedAddressData.phoneNumber}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Step 2 (if logged in) / Step 3 (if not): Order Summary */}
            <div className={`checkout-section ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
              <div className="section-header">
                <div className="section-number">{user ? '2' : '3'}</div>
                <h2>ORDER SUMMARY</h2>
                {currentStep > 3 && (
                  <button onClick={() => setCurrentStep(3)} className="change-btn">
                    <FiEdit2 /> Change
                  </button>
                )}
              </div>
              
              {currentStep === 3 ? (
                <div className="section-content">
                  {/* Cart Items */}
                  <div className="order-items">
                    {cart.items.map(item => (
                      <div key={item.listingId} className="order-item">
                        <div className="item-image">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.listingTitle} />
                          ) : (
                            <div className="placeholder-image">🌾</div>
                          )}
                        </div>
                        <div className="item-details">
                          <Link to={`/marketplace/listing/${item.listingId}`} className="item-title">
                            {item.listingTitle || item.productName || 'Product'}
                          </Link>
                          {item.sellerName && (
                            <div className="item-seller">Seller: {item.sellerName}</div>
                          )}
                          <div className="item-qty-price">
                            <span className="item-qty">Qty: {item.quantity}</span>
                            <span className="item-price">₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Options */}
                  <div className="delivery-options">
                    <h4><FiTruck /> Delivery Options</h4>
                    {DELIVERY_OPTIONS.map(option => (
                      <label 
                        key={option.id} 
                        className={`delivery-option ${deliveryOption === option.id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={deliveryOption === option.id}
                          onChange={() => setDeliveryOption(option.id)}
                        />
                        <div className="option-content">
                          <div className="option-main">
                            <span className="option-name">{option.name}</span>
                            <span className="option-price">
                              {option.price === 0 ? 'FREE' : `₹${option.price}`}
                            </span>
                          </div>
                          <span className="option-desc">{option.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Delivery Estimate */}
                  {deliveryEstimate && (
                    <div className="delivery-estimate">
                      <FiClock />
                      <span>
                        Estimated delivery by <strong>{formatDate(deliveryEstimate)}</strong>
                      </span>
                    </div>
                  )}

                  {/* Gift Options */}
                  <div className="gift-options">
                    <label className="gift-checkbox">
                      <input
                        type="checkbox"
                        checked={giftWrap}
                        onChange={(e) => setGiftWrap(e.target.checked)}
                      />
                      <span className="gift-label">
                        <FiGift /> Add gift wrap for ₹29
                      </span>
                    </label>
                    {giftWrap && (
                      <textarea
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Add a gift message (optional)"
                        className="gift-message"
                        rows="2"
                      />
                    )}
                  </div>

                  {/* Order Notes */}
                  <div className="order-notes-section">
                    <h4>Order Notes (Optional)</h4>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any special instructions for your order..."
                      rows="2"
                      className="order-notes"
                    />
                  </div>

                  <button onClick={() => setCurrentStep(4)} className="btn btn-primary continue-btn">
                    Continue
                  </button>
                </div>
              ) : currentStep > 3 ? (
                <div className="section-summary">
                  <span>{cart.items.length} item(s)</span>
                  <span>•</span>
                  <span>{DELIVERY_OPTIONS.find(o => o.id === deliveryOption)?.name}</span>
                  {giftWrap && <span>• Gift Wrapped</span>}
                </div>
              ) : null}
            </div>

            {/* Step 3 (if logged in) / Step 4 (if not): Payment */}
            <div className={`checkout-section ${currentStep === 4 ? 'active' : ''}`}>
              <div className="section-header">
                <div className="section-number">{user ? '3' : '4'}</div>
                <h2>PAYMENT OPTIONS</h2>
              </div>
              
              {currentStep === 4 && (
                <div className="section-content">
                  <div className="payment-methods">
                    <label className={`payment-method ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                      />
                      <div className="method-content">
                        <img 
                          src="https://cdn.razorpay.com/static/assets/logo/payment.svg" 
                          alt="Razorpay" 
                          className="razorpay-logo"
                        />
                        <div className="method-info">
                          <span className="method-name">Pay with Razorpay</span>
                          <span className="method-desc">UPI, Credit/Debit Cards, Net Banking, Wallets</span>
                        </div>
                      </div>
                    </label>

                    <div className="payment-icons">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex" />
                    </div>
                  </div>

                  <div className="security-info">
                    <div className="security-badge">
                      <FiLock />
                      <span>Your payment information is secure. We use SSL encryption for all transactions.</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleProceedToPayment}
                    disabled={submitting}
                    className="btn btn-primary pay-btn"
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-small"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiLock /> Pay ₹{getTotalAmount().toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Price Summary */}
          <div className="checkout-sidebar">
            {/* Coupon Section */}
            <div className="coupon-section">
              <h3><FiTag /> Apply Coupon</h3>
              {appliedCoupon ? (
                <div className="applied-coupon">
                  <div className="coupon-info">
                    <span className="coupon-code">{appliedCoupon.code}</span>
                    <span className="coupon-savings">-₹{getCouponDiscount().toFixed(2)}</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="remove-coupon">Remove</button>
                </div>
              ) : (
                <div className="coupon-input">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                  />
                  <button 
                    onClick={handleApplyCoupon} 
                    disabled={couponLoading}
                    className="apply-btn"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              <div className="available-coupons">
                {Object.entries(AVAILABLE_COUPONS).slice(0, 2).map(([code, details]) => (
                  <button 
                    key={code}
                    onClick={() => setCouponCode(code)}
                    className="coupon-suggestion"
                  >
                    <FiPercent />
                    <span>{code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Details */}
            <div className="price-details">
              <h3>PRICE DETAILS</h3>
              
              <div className="price-row">
                <span>Price ({cart.items.length} items)</span>
                <span>₹{getSubtotal().toFixed(2)}</span>
              </div>

              <div className="price-row">
                <span>Delivery Charges</span>
                {getDeliveryCharge() === 0 ? (
                  <span className="free">FREE</span>
                ) : (
                  <span>₹{getDeliveryCharge()}</span>
                )}
              </div>

              {giftWrap && (
                <div className="price-row">
                  <span>Gift Wrap</span>
                  <span>₹{getGiftWrapCharge()}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="price-row discount">
                  <span>Coupon Discount</span>
                  <span>-₹{getCouponDiscount().toFixed(2)}</span>
                </div>
              )}

              <div className="price-row">
                <span>Tax (GST 5%)</span>
                <span>₹{getTax().toFixed(2)}</span>
              </div>

              <div className="price-divider"></div>

              <div className="price-row total">
                <span>Total Payable</span>
                <span>₹{getTotalAmount().toFixed(2)}</span>
              </div>

              {getTotalSavings() > 0 && (
                <div className="savings-banner">
                  <FiGift />
                  You will save ₹{getTotalSavings().toFixed(2)} on this order
                </div>
              )}
            </div>

            {/* Safe and Secure */}
            <div className="safe-secure">
              <div className="secure-item">
                <FiShield />
                <span>Safe and Secure Payments</span>
              </div>
              <div className="secure-item">
                <FiTruck />
                <span>Easy Returns & Quick Refunds</span>
              </div>
              <div className="secure-item">
                <FiCheckCircle />
                <span>100% Quality Assured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
