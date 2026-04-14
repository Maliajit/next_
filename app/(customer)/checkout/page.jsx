"use client";
import { useCart } from '@/context/CartContext';
import { useOrder } from '@/context/OrderContext';

const Checkout = () => {
  const navigate = useRouter();
  const { items, clearCart } = useCart();
  const { addOrder } = useOrder();
  const [activeStep, setActiveStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const steps = [
    { id: 1, name: 'Shipping' },
    { id: 2, name: 'Payment' },
    { id: 3, name: 'Review' },
  ];

  const handleNext = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    } else {
      // Place Order logic
      const totalAmount = items.reduce((sum, item) => {
        const p = parseFloat(item.price.replace(/[^0-9.]/g, ''));
        return sum + (p * item.qty);
      }, 0);
      
      addOrder({
        items: [...items],
        total: `$${totalAmount.toLocaleString()}`
      });
      clearCart();
      navigate('/my-purchases');
    }
  };

  const handleBack = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
    else navigate('/cart');
  };

  return (
    <div className={`checkout-page ${isLoaded ? 'loaded' : ''}`}>
      {/* Background elements */}
      <div className="checkout-ambient-bg" />
      
      <div className="checkout-container">
        {/* Header section */}
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
          {/* Main Form Area */}
          <main className="checkout-main">
            <div className="checkout-card glassmorphism">
              {activeStep === 1 && (
                <div className="checkout-section fade-in">
                  <h2 className="section-title">Shipping Information</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Name</label>
                      <input type="text" placeholder="John" />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input type="text" placeholder="Doe" />
                    </div>
                    <div className="form-group full">
                      <label>Address Line 1</label>
                      <input type="text" placeholder="123 Luxury Lane" />
                    </div>
                    <div className="form-group full">
                      <label>Address Line 2 (Optional)</label>
                      <input type="text" placeholder="Apt 4B" />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input type="text" placeholder="New York" />
                    </div>
                    <div className="form-group">
                      <label>Postal Code</label>
                      <input type="text" placeholder="10001" />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="checkout-section fade-in">
                  <h2 className="section-title">Payment Method</h2>
                  <div className="payment-options">
                    <div className="payment-card selected">
                      <div className="card-info">
                        <div className="card-icon">💳</div>
                        <div>
                          <div className="card-type">Credit / Debit Card</div>
                          <div className="card-desc">Secure encrypted payment</div>
                        </div>
                      </div>
                      <div className="card-radio" />
                    </div>
                    <div className="payment-card disabled">
                      <div className="card-info">
                        <div className="card-icon">🅿️</div>
                        <div>
                          <div className="card-type">PayPal</div>
                          <div className="card-desc">Fast and secure</div>
                        </div>
                      </div>
                      <div className="card-radio" />
                    </div>
                  </div>
                  <div className="form-grid" style={{ marginTop: '24px' }}>
                    <div className="form-group full">
                      <label>Card Number</label>
                      <input type="text" placeholder="0000 0000 0000 0000" />
                    </div>
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input type="text" placeholder="MM/YY" />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input type="password" placeholder="***" />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="checkout-section fade-in">
                  <h2 className="section-title">Review Order</h2>
                  <p className="review-text">Please review your shipping and payment details before completing the purchase.</p>
                  <div className="review-summary-box">
                    <div className="review-item">
                      <span className="label">Shipping To:</span>
                      <span className="value">John Doe, 123 Luxury Lane, New York, 10001</span>
                    </div>
                    <div className="review-item">
                      <span className="label">Payment:</span>
                      <span className="value">Card ending in •••• 4242</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="checkout-footer-actions">
                <button className="primary-btn pulse" onClick={handleNext}>
                  {activeStep === 3 ? 'Place Order' : 'Continue'}
                </button>
              </div>
            </div>
          </main>

          {/* Sidebar Area - Order Summary */}
          <aside className="checkout-sidebar">
            <div className="order-summary-card glassmorphism">
              <h3 className="summary-title">Order Summary</h3>
              <div className="summary-items">
                <div className="summary-item">
                  <div className="item-thumbnail rose-bg" />
                  <div className="item-info">
                    <div className="item-name">Fylexx Midnight Rose</div>
                    <div className="item-meta">1 item · 40mm</div>
                  </div>
                  <div className="item-price">$32,500</div>
                </div>
              </div>
              <div className="summary-divider" />
              <div className="summary-lines">
                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>$32,500</span>
                </div>
                <div className="summary-line">
                  <span>Shipping</span>
                  <span className="free-tag">Free</span>
                </div>
                <div className="summary-line total">
                  <span>Total</span>
                  <span>$32,500</span>
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

      <style>{`
        .checkout-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: calc(var(--header-h, 70px) + 40px) 24px 80px;
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

        .checkout-main {
          padding-bottom: 20px;
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

        .payment-options {
          display: grid; gap: 12px;
        }
        .payment-card {
          padding: 16px; border-radius: 16px; border: 2px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          cursor: pointer; transition: all 0.3s;
        }
        .payment-card.selected { border-color: #1e293b; background: rgba(30, 41, 59, 0.02); }
        .payment-card.disabled { opacity: 0.5; cursor: not-allowed; }
        .card-info { display: flex; align-items: center; gap: 16px; }
        .card-icon { font-size: 24px; }
        .card-type { font-size: 14px; font-weight: 600; color: #1e293b; }
        .card-desc { font-size: 11px; color: #64748b; }
        .card-radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #e2e8f0; }
        .selected .card-radio { background: #1e293b; border-color: #1e293b; }

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
        .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(30, 41, 59, 0.15); }

        .order-summary-card { padding: 24px; position: sticky; top: 40px; }
        .summary-title { font-size: 16px; margin-bottom: 20px; color: #1e293b; }
        .summary-item { display: flex; gap: 12px; align-items: center; }
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
        @keyframes pulseBtn { 0% { box-shadow: 0 0 0 0 rgba(30, 41, 59, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(30, 41, 59, 0); } 100% { box-shadow: 0 0 0 0 rgba(30, 41, 59, 0); } }

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
