"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { addAddressApi, initiatePaymentApi, verifyPaymentApi, calculateTotalApi } from '@/lib/api';

const Checkout = () => {
  const navigate = useRouter();
  const { items, clearCart } = useCart();
  const { addOrder } = useOrder();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // SERVER-SIDE TRUTH
  const [totals, setTotals] = useState({
      subtotal: 0,
      shipping: 0,
      tax: 0,
      discount: 0,
      total: 0
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
    phone: '',
    email: user?.email || '',
    dob: '',
    paymentMethod: 'razorpay',
  });

  useEffect(() => {
    setIsLoaded(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // REFRESH TOTALS FROM BACKEND ONLY
  useEffect(() => {
    const refreshTotals = async () => {
        if (items.length === 0) return;
        setIsCalculating(true);
        const cartItems = items.map(i => ({ variantId: i.variantId, quantity: i.qty }));
        const res = await calculateTotalApi(cartItems, formData.postalCode);
        if (res.success) {
            setTotals(res.data);
            setError(null);
        } else {
            setError(res.error);
        }
        setIsCalculating(false);
    };
    refreshTotals();
  }, [items, formData.postalCode]);

  const handleNext = async () => {
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
      // 1. Create Address
      const addrRes = await addAddressApi(user.id, {
        name: `${formData.firstName} ${formData.lastName}`,
        mobile: formData.phone,
        address: formData.address,
        city: formData.city,
        pincode: formData.postalCode,
        country: 'India',
      });

      if (!addrRes.success) throw new Error(addrRes.error);

      if (formData.paymentMethod === 'razorpay') {
        await handleRazorpayPayment(addrRes.data.id);
      } else {
        await handleCODOrder(addrRes.data.id);
      }
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async (addressId) => {
    // 2. Initiate Payment (Backend will recalculate amount internally)
    const payRes = await initiatePaymentApi(totals.total, `rcpt_${Date.now()}`);
    if (!payRes.success) throw new Error(payRes.error);

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: payRes.data.amount,
      currency: payRes.data.currency,
      order_id: payRes.data.id,
      handler: async (response) => {
        const verRes = await verifyPaymentApi({
          orderId: payRes.data.id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });

        if (verRes.success) {
          await finalizeOrder(addressId, 'online', response.razorpay_payment_id);
        } else {
          setError('Payment verification failed');
          setIsProcessing(false);
        }
      },
      prefill: { email: formData.email, contact: formData.phone },
      modal: { ondismiss: () => setIsProcessing(false) }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleCODOrder = async (addressId) => {
    await finalizeOrder(addressId, 'cod');
  };

  const finalizeOrder = async (addressId, method, paymentId = null) => {
    const orderRes = await addOrder({
      customerId: user.id,
      shippingAddressId: addressId,
      paymentMethod: method,
      paymentId: paymentId,
      dob: formData.dob,
      items: items.map(i => ({ variantId: i.variantId, quantity: i.qty })),
    });

    if (orderRes.success) {
      clearCart();
      navigate.push('/thank-you');
    } else {
      setError(orderRes.error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="checkout-page">
      {/* ... UI Components ... */}
      <div className="totals-display">
          <div>Subtotal: ₹{totals.subtotal.toLocaleString()}</div>
          <div>Shipping: {totals.shipping === 0 ? 'FREE' : `₹${totals.shipping.toLocaleString()}`}</div>
          <div>Tax: ₹{totals.tax.toLocaleString()}</div>
          <div className="grand-total">Total: ₹{totals.total.toLocaleString()}</div>
          {isCalculating && <div className="loader">Recalculating...</div>}
          {error && <div className="error-banner">{error}</div>}
      </div>
      <button onClick={handleNext} disabled={isCalculating || isProcessing}>
          {isProcessing ? 'Processing...' : (activeStep === 3 ? 'Place Order' : 'Continue')}
      </button>
    </div>
  );
};

export default Checkout;
