"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { addAddressApi, initiatePaymentApi, verifyPaymentApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

const Checkout = () => {
  const navigate = useRouter();
  const { items, clearCart } = useCart();
  const { addOrder } = useOrder();
  const { user } = useAuth();
  const { success, error, info } = useToast() || {};

  const [activeStep, setActiveStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
    phone: '',
    email: user?.email || '',
    paymentMethod: 'razorpay', // 'razorpay' or 'cod'
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setIsLoaded(true);
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    if (user?.name) {
      const names = user.name.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: user.email || prev.email,
        phone: user.mobile || prev.phone,
      }));
    }

    return () => {
      document.body.removeChild(script);
    };
  }, [user]);

  const steps = [
    { id: 1, name: 'Shipping' },
    { id: 2, name: 'Payment' },
    { id: 3, name: 'Review' },
  ];

  const subtotal = items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (i.qty || 1), 0);
  const shipping = subtotal > 150000 ? 0 : 1;
  const total = subtotal + shipping;

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'Required';
      if (!formData.lastName.trim()) errors.lastName = 'Required';
      if (!formData.address.trim()) errors.address = 'Required';
      if (!formData.city.trim()) errors.city = 'Required';

      const postalRegex = /^[1-9][0-9]{5}$/; // Indian PIN code
      if (!formData.postalCode) errors.postalCode = 'Required';
      else if (!postalRegex.test(formData.postalCode)) errors.postalCode = 'Invalid PIN (6 digits)';

      const phoneRegex = /^[6-9][0-9]{9}$/; // Indian mobile
      if (!formData.phone) errors.phone = 'Required';
      else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) errors.phone = 'Invalid 10-digit number';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) errors.email = 'Required';
      else if (!emailRegex.test(formData.email)) errors.email = 'Invalid email';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(activeStep)) {
      error?.('Please fill in all required fields');
      return;
    }

    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    } else {
      await handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Create Address first
      const addressResult = await addAddressApi(user.id, {
        name: `${formData.firstName} ${formData.lastName}`,
        mobile: formData.phone,
        address: formData.address,
        city: formData.city,
        state: 'State', // Should ideally be a field
        pincode: formData.postalCode,
        country: 'India',
        type: 'home',
        isDefault: true,
      });

      if (!addressResult || addressResult.error) {
        throw new Error('Failed to save shipping address');
      }

      const shippingAddressId = addressResult.id.toString();

      if (formData.paymentMethod === 'razorpay') {
        await handleRazorpayPayment(shippingAddressId);
      } else {
        await handleCODOrder(shippingAddressId);
      }
    } catch (err) {
      error?.(err.message || 'Checkout failed');
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async (addressId) => {
    // 2. Initiate Razorpay Order
    const razorpayOrder = await initiatePaymentApi(total, `order_rcpt_${Date.now()}`);

    if (!razorpayOrder || !razorpayOrder.id) {
      throw new Error('Failed to initialize payment gateway');
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Fylex Luxury',
      description: 'Luxury Timepiece Purchase',
      order_id: razorpayOrder.id,
      handler: async (response) => {
        try {
          // 3. Verify Payment
          const verification = await verifyPaymentApi({
            orderId: razorpayOrder.id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });

          if (verification && verification.success) {
            // 4. Create Final Order in Backend
            await addOrder({
              customerId: user.id,
              shippingAddressId: addressId,
              billingAddressId: addressId,
              paymentMethod: 'online',
              paymentId: response.razorpay_payment_id,
              notes: formData.apartment ? `Apt: ${formData.apartment}` : '',
              items: [...items],
              total: `₹${total.toLocaleString()}`,
              date: new Date().toLocaleDateString(),
            });

            success?.('Order placed successfully!');
            clearCart();
            navigate.push('/my-purchases');
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (err) {
          error?.(err.message);
          setIsProcessing(false);
        }
      },
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        contact: formData.phone,
      },
      theme: { color: '#1e293b' },
      modal: {
        ondismiss: () => setIsProcessing(false),
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleCODOrder = async (addressId) => {
    await addOrder({
      customerId: user.id,
      shippingAddressId: addressId,
      billingAddressId: addressId,
      paymentMethod: 'cod',
      notes: formData.apartment ? `Apt: ${formData.apartment}` : '',
      items: [...items],
      total: `₹${total.toLocaleString()}`,
      date: new Date().toLocaleDateString(),
    });

    success?.('Order placed successfully (COD)!');
    clearCart();
    navigate.push('/my-purchases');
  };

  const handleBack = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
    else navigate.push('/cart');
  };

  const updateFormData = (e) => {
    const { name, value } = e.target;

    // Strict filtering based on field type
    let sanitizedValue = value;

    if (name === 'phone' || name === 'postalCode') {
      // Only digits
      sanitizedValue = value.replace(/\D/g, '');
      // Max length limits
      if (name === 'phone') sanitizedValue = sanitizedValue.slice(0, 10);
      if (name === 'postalCode') sanitizedValue = sanitizedValue.slice(0, 6);
    } else if (name === 'firstName' || name === 'lastName' || name === 'city') {
      // Only letters and spaces
      sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div className={`checkout-page ${isLoaded ? 'loaded' : ''}`}>
      <div className="checkout-ambient-bg" />

      <div className="checkout-container">
        <header className="checkout-header">
          <div className="checkout-back-nav" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </div>
          <h1 className="checkout-title">Secure Checkout</h1>
          <div className="checkout-progress">
            {steps.map((step) => (
              <div key={step.id} className={`step-item ${activeStep >= step.id ? 'active' : ''}`}>
                <div className="step-dot" />
                <span className="step-name">{step.name}</span>
              </div>
            ))}
          </div>
        </header>

        <div className="checkout-layout">
          <main className="checkout-main">
            <div className="checkout-card glassmorphism">
              {activeStep === 1 && (
                <div className="checkout-section fade-in">
                  <h2 className="section-title">Shipping Information</h2>
                  <div className="form-grid">
                    <div className={`form-group ${validationErrors.firstName ? 'error' : ''}`}>
                      <label>First Name</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={updateFormData} placeholder="John" maxLength={50} />
                      {validationErrors.firstName && <span className="error-msg">{validationErrors.firstName}</span>}
                    </div>
                    <div className={`form-group ${validationErrors.lastName ? 'error' : ''}`}>
                      <label>Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={updateFormData} placeholder="Doe" maxLength={50} />
                      {validationErrors.lastName && <span className="error-msg">{validationErrors.lastName}</span>}
                    </div>
                    <div className={`form-group full ${validationErrors.email ? 'error' : ''}`}>
                      <label>Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={updateFormData} placeholder="john@example.com" />
                      {validationErrors.email && <span className="error-msg">{validationErrors.email}</span>}
                    </div>
                    <div className={`form-group full ${validationErrors.address ? 'error' : ''}`}>
                      <label>Address Line 1</label>
                      <input type="text" name="address" value={formData.address} onChange={updateFormData} placeholder="123 Luxury Lane" maxLength={200} />
                      {validationErrors.address && <span className="error-msg">{validationErrors.address}</span>}
                    </div>
                    <div className="form-group full">
                      <label>Apartment, suite, etc. (optional)</label>
                      <input type="text" name="apartment" value={formData.apartment} onChange={updateFormData} placeholder="Apt 4B" maxLength={100} />
                    </div>
                    <div className={`form-group ${validationErrors.city ? 'error' : ''}`}>
                      <label>City</label>
                      <input type="text" name="city" value={formData.city} onChange={updateFormData} placeholder="New York" maxLength={50} />
                      {validationErrors.city && <span className="error-msg">{validationErrors.city}</span>}
                    </div>
                    <div className={`form-group ${validationErrors.postalCode ? 'error' : ''}`}>
                      <label>Postal Code</label>
                      <input type="text" name="postalCode" value={formData.postalCode} onChange={updateFormData} placeholder="100001" maxLength={6} />
                      {validationErrors.postalCode && <span className="error-msg">{validationErrors.postalCode}</span>}
                    </div>
                    <div className={`form-group full ${validationErrors.phone ? 'error' : ''}`}>
                      <label>Phone Number</label>
                      <input type="text" name="phone" value={formData.phone} onChange={updateFormData} placeholder="9876543210" maxLength={10} />
                      {validationErrors.phone && <span className="error-msg">{validationErrors.phone}</span>}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="checkout-section fade-in">
                  <h2 className="section-title">Payment Method</h2>
                  <div className="payment-options">
                    <div
                      className={`payment-card ${formData.paymentMethod === 'razorpay' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'razorpay' }))}
                    >
                      <div className="card-info">
                        <div className="card-icon">💳</div>
                        <div>
                          <div className="card-type">Razorpay (Cards/UPI/Netbanking)</div>
                          <div className="card-desc">Secure live payment gateway</div>
                        </div>
                      </div>
                      <div className="card-radio" />
                    </div>
                    <div
                      className={`payment-card ${formData.paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                    >
                      <div className="card-info">
                        <div className="card-icon">🚚</div>
                        <div>
                          <div className="card-type">Cash on Delivery</div>
                          <div className="card-desc">Pay when you receive the product</div>
                        </div>
                      </div>
                      <div className="card-radio" />
                    </div>
                  </div>

                  {formData.paymentMethod === 'razorpay' && (
                    <div className="payment-notice">
                      <p>You will be redirected to Razorpay secure checkout to complete your purchase.</p>
                    </div>
                  )}
                </div>
              )}

              {activeStep === 3 && (
                <div className="checkout-section fade-in">
                  <h2 className="section-title">Review Order</h2>
                  <p className="review-text">Please review your shipping and payment details before completing the purchase.</p>
                  <div className="review-summary-box">
                    <div className="review-item">
                      <span className="label">Shipping To:</span>
                      <span className="value">{formData.firstName} {formData.lastName}, {formData.address}, {formData.city}, {formData.postalCode}</span>
                    </div>
                    <div className="review-item">
                      <span className="label">Contact:</span>
                      <span className="value">{formData.phone} | {formData.email}</span>
                    </div>
                    <div className="review-item">
                      <span className="label">Payment:</span>
                      <span className="value">{formData.paymentMethod === 'razorpay' ? 'Razorpay Secure' : 'Cash on Delivery'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="checkout-footer-actions">
                <button
                  className={`primary-btn ${isProcessing ? 'disabled' : 'pulse'}`}
                  onClick={handleNext}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : (activeStep === 3 ? 'Place Order' : 'Continue')}
                </button>
              </div>
            </div>
          </main>

          <aside className="checkout-sidebar">
            <div className="order-summary-card glassmorphism">
              <h3 className="summary-title">Order Summary</h3>
              <div className="summary-items">
                {items.map((item) => (
                  <div key={item.id} className="summary-item">
                    <div className="item-thumbnail rose-bg">
                      <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div className="item-info">
                      <div className="item-name">{item.title}</div>
                      <div className="item-meta">{item.qty} item{item.qty !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="item-price">{item.priceDisplay || `₹${Number(item.unitPrice).toLocaleString()}`}</div>
                  </div>
                ))}
              </div>
              <div className="summary-divider" />
              <div className="summary-lines">
                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-line">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'free-tag' : ''}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                <div className="summary-line total">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="trust-badge-mini">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>Encrypted SSL Secure Checkout</span>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .checkout-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 110px 24px 80px;
          font-family: 'Montserrat', sans-serif;
          position: relative;
          opacity: 0;
          transition: opacity 0.8s ease;
        }
        .checkout-page.loaded { opacity: 1; }
        
        .checkout-ambient-bg {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: 
            radial-gradient(circle at 10% 10%, rgba(99, 130, 201, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 90% 90%, rgba(118, 75, 162, 0.05) 0%, transparent 50%);
          z-index: -1;
        }

        .checkout-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .checkout-header {
          text-align: center;
          margin: 20px 0 48px;
        }

        .checkout-back-nav {
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; color: #64748b; font-size: 13px;
          margin-bottom: 24px; transition: color 0.3s;
          width: fit-content;
        }
        .checkout-back-nav:hover { color: #1e293b; }

        .checkout-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px; color: #1e293b;
          margin-bottom: 32px;
        }

        .checkout-progress {
          display: flex; justify-content: center; gap: 40px;
        }
        .step-item {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          opacity: 0.3; transition: opacity 0.4s;
        }
        .step-item.active { opacity: 1; }
        .step-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #1e293b;
        }
        .step-name { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }

        .checkout-layout {
          display: grid; grid-template-columns: 1fr 340px; gap: 32px;
        }

        .glassmorphism {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
        }

        .checkout-card { padding: 40px; }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px; color: #1e293b; margin-bottom: 24px;
        }

        .form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        .form-group.full { grid-column: span 2; }
        .form-group label {
          display: block; font-size: 11px; text-transform: uppercase;
          letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px;
          font-weight: 600;
        }
        .form-group input {
          width: 100%; padding: 12px 16px; border-radius: 12px;
          border: 1px solid #e2e8f0; background: white;
          font-size: 14px; transition: border-color 0.3s;
        }
        .form-group input:focus { border-color: #1e293b; outline: none; }
        .form-group.error input { border-color: #ef4444; }
        .error-msg { color: #ef4444; font-size: 10px; margin-top: 4px; display: block; font-weight: 500; }

        .payment-options {
          display: grid; gap: 12px;
        }
        .payment-card {
          padding: 16px; border-radius: 16px; border: 2px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          cursor: pointer; transition: all 0.3s;
        }
        .payment-card.selected { border-color: #1e293b; background: rgba(30, 41, 59, 0.02); }
        .card-info { display: flex; align-items: center; gap: 16px; }
        .card-icon { font-size: 24px; }
        .card-type { font-size: 14px; font-weight: 600; color: #1e293b; }
        .card-desc { font-size: 11px; color: #64748b; }
        .card-radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #e2e8f0; }
        .selected .card-radio { background: #1e293b; border-color: #1e293b; }

        .payment-notice {
          margin-top: 24px; padding: 16px; border-radius: 12px;
          background: rgba(30, 41, 59, 0.05); color: #64748b;
          font-size: 13px; line-height: 1.5;
        }

        .review-summary-box {
          background: rgba(30, 41, 59, 0.02); padding: 24px;
          border-radius: 16px; display: grid; gap: 16px;
        }
        .review-item { display: grid; gap: 4px; }
        .review-item .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; }
        .review-item .value { font-size: 14px; color: #1e293b; font-weight: 500; }

        .checkout-footer-actions {
          margin-top: 40px; padding-top: 32px; border-top: 1px solid #e2e8f0;
          display: flex; justify-content: flex-end;
        }
        .primary-btn {
          padding: 14px 48px; border-radius: 14px; border: none;
          background: #1e293b; color: white; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.1em;
          font-size: 12px; cursor: pointer; transition: all 0.3s;
        }
        .primary-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(30, 41, 59, 0.15); }
        .primary-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .order-summary-card { padding: 24px; position: sticky; top: 40px; }
        .summary-title { font-size: 16px; margin-bottom: 20px; color: #1e293b; }
        .summary-item { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
        .item-thumbnail { width: 48px; height: 48px; border-radius: 8px; flex-shrink: 0; }
        .rose-bg { background: #5B3B3B15; }
        .item-name { font-size: 13px; font-weight: 600; color: #334155; }
        .item-meta { font-size: 11px; color: #94a3b8; }
        .item-price { margin-left: auto; font-size: 13px; font-weight: 600; }
        
        .summary-divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
        .summary-line { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 12px; }
        .summary-line.total { font-weight: 700; font-size: 16px; color: #1e293b; margin-top: 8px; }
        .free-tag { color: #10b981; font-weight: 700; }

        .trust-badge-mini {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 24px; color: #94a3b8; font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .pulse { animation: pulseBtn 2s infinite; }
        @keyframes pulseBtn { 
          0% { box-shadow: 0 0 0 0 rgba(30, 41, 59, 0.4); } 
          70% { box-shadow: 0 0 0 10px rgba(30, 41, 59, 0); } 
          100% { box-shadow: 0 0 0 0 rgba(30, 41, 59, 0); } 
        }

        @media (max-width: 860px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .checkout-sidebar { order: -1; }
          .checkout-card { padding: 24px; }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
