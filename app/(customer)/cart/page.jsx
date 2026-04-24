"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Real watch assets
const watchRose = '/assets/fylex-watch-v2/everose-gold.png';
const watchSilver = '/assets/fylex-watch-v2/white-gold.png';
const watchGold = '/assets/fylex-watch-v2/goldwatch.png';

import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

function CartItemRow({ item, index, onQtyChange, onRemove }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 120 + 80);
    return () => clearTimeout(t);
  }, [index]);

  const displayPrice = item.price;
  const displayName = `${item.title} ${item.titleAccent || ''}`;
  const displayVariant = item.subtitle;
  const displayColor = item.accentColor || '#1C2E4A';
  const displayImage = item.image;

  return (
    <div
      className="cart-item-row"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.55s ease, transform 0.55s ease',
      }}
    >
      <div className="cart-item-top">
        <div className="cart-watch-visual" style={{ 
          background: `linear-gradient(135deg, ${displayColor}15, ${displayColor}25)`,
          padding: '8px'
        }}>
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={displayName} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          ) : (
            <div className="cart-placeholder-icon">⌚</div>
          )}
        </div>

        <div className="cart-item-details">
          <div className="cart-item-name">{displayName}</div>
          <div className="cart-item-variant">{displayVariant}</div>
          <div className="cart-item-price">{displayPrice}</div>
        </div>
      </div>

      <div className="cart-item-actions">
        <div className="cart-qty-block">
          <button className="cart-qty-btn" onClick={() => onQtyChange(item.id, -1)}>−</button>
          <span className="cart-qty-val">{item.qty}</span>
          <button className="cart-qty-btn" onClick={() => onQtyChange(item.id, 1)}>+</button>
        </div>

        <button className="cart-remove-btn" onClick={() => onRemove(item.id)} title="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Cart() {
  const navigate = useRouter();
  const { items, updateQty, removeFromCart } = useCart();
  const [heroVisible, setHeroVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const summaryRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setSummaryVisible(true); },
      { threshold: 0.15 }
    );
    if (summaryRef.current) observer.observe(summaryRef.current);
    return () => observer.disconnect();
  }, []);

  const handleQty = (id, delta) => {
    updateQty(id, delta);
  };

  const handleRemove = (id) => {
    removeFromCart(id);
  };

    const subtotal = items.reduce((s, i) => {
      const priceStr = String(i.price || '0').replace('₹', '').replace('$', '').replace(/,/g, '');
      return s + (parseFloat(priceStr) || 0) * (i.qty || 1);
    }, 0);
    const shipping = subtotal > 150000 ? 0 : 500; // Adjusted for luxury watch pricing
    const total = subtotal + shipping;

    return (
        <div className="cart-page">
            {/* Ambient bg layers */}
            <div className="cart-bg-layer cart-bg-1" />
            <div className="cart-bg-layer cart-bg-2" />
            <div className="cart-bg-layer cart-bg-3" />

            {/* Hero */}
            <div
                className="cart-hero"
                style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? 'translateY(0)' : 'translateY(-20px)',
                    transition: 'opacity 0.7s ease, transform 0.7s ease',
                }}
            >
                <span className="cart-hero-label">Your Selection</span>
                <h1 className="cart-hero-title">Shopping Cart</h1>
                <p className="cart-hero-sub">{items.length} item{items.length !== 1 ? 's' : ''} curated for you</p>
            </div>

            <div className="cart-layout">
                {/* Items */}
                <div className="cart-items-col">
                    {items.length === 0 ? (
                        <div className="cart-empty">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <circle cx="32" cy="32" r="30" stroke="#1C2E4A" strokeWidth="1.5" opacity="0.2" />
                                <path d="M20 22h24l-3 18H23L20 22z" stroke="#1C2E4A" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                                <circle cx="26" cy="46" r="2" fill="#1C2E4A" opacity="0.4" />
                                <circle cx="38" cy="46" r="2" fill="#1C2E4A" opacity="0.4" />
                            </svg>
                            <p>Your cart is empty</p>
                            <Link href="/products" className="cart-empty-cta">Explore Watches</Link>
                        </div>
                    ) : (
                        items.map((item, i) => (
                            <CartItemRow
                                key={item.id}
                                item={item}
                                index={i}
                                onQtyChange={handleQty}
                                onRemove={handleRemove}
                            />
                        ))
                    )}
                </div>

                {/* Summary */}
                <div
                    ref={summaryRef}
                    className="cart-summary-col"
                    style={{
                        opacity: summaryVisible ? 1 : 0,
                        transform: summaryVisible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'opacity 0.65s ease 0.2s, transform 0.65s ease 0.2s',
                    }}
                >
                    <div className="cart-summary-card">
                        <div className="cart-summary-title">Order Summary</div>
                        <div className="cart-summary-line">
                            <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="cart-summary-line">
                            <span>Shipping</span>
                            <span>{shipping === 0 ? <span className="cart-free-tag">Free</span> : `₹${shipping.toLocaleString()}`}</span>
                        </div>
                        {shipping > 0 && (
                            <div className="cart-free-hint">Spend ₹{(150000 - subtotal).toLocaleString()} more for free shipping</div>
                        )}
                        <div className="cart-summary-divider" />
                        <div className="cart-summary-total">
                            <span>Total</span><span>₹{total.toLocaleString()}</span>
                        </div>
                        <button className="cart-checkout-btn" onClick={() => navigate.push('/checkout')}>
                            <span>Proceed to Checkout</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
            <Link href="/products" className="cart-continue-link">← Continue Shopping</Link>
          </div>

          {/* Trust badges */}
          <div className="cart-trust-badges">
            {[
              { icon: '🔒', label: 'Secure Payment' },
              { icon: '↩', label: '30-Day Returns' },
              { icon: '🚚', label: 'Fast Delivery' },
            ].map(b => (
              <div className="cart-badge" key={b.label}>
                <span className="cart-badge-icon">{b.icon}</span>
                <span className="cart-badge-label">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .cart-page {
          min-height: 100vh;
          padding: calc(var(--header-h, 70px) + 40px) 24px 80px;
          position: relative;
          overflow: hidden;
          background: #f4f6fb;
          font-family: 'Montserrat', sans-serif;
        }
        .cart-bg-layer {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(80px);
        }
        .cart-bg-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,130,201,0.18) 0%, transparent 70%);
          top: -200px; left: -150px;
          animation: cartFloat1 12s ease-in-out infinite alternate;
        }
        .cart-bg-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(118,75,162,0.12) 0%, transparent 70%);
          top: 40%; right: -180px;
          animation: cartFloat2 15s ease-in-out infinite alternate;
        }
        .cart-bg-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(28,46,74,0.10) 0%, transparent 70%);
          bottom: -100px; left: 30%;
          animation: cartFloat3 10s ease-in-out infinite alternate;
        }
        @keyframes cartFloat1 { from{transform:translate(0,0)} to{transform:translate(40px,30px)} }
        @keyframes cartFloat2 { from{transform:translate(0,0)} to{transform:translate(-30px,40px)} }
        @keyframes cartFloat3 { from{transform:translate(0,0)} to{transform:translate(20px,-30px)} }

        .cart-hero {
          position: relative; z-index: 1;
          text-align: center;
          margin-bottom: 52px;
        }
        .cart-hero-label {
          display: inline-block;
          font-size: 10px;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: #4a6fa5;
          font-weight: 600;
          margin-bottom: 14px;
        }
        .cart-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(38px, 5.5vw, 72px);
          font-weight: 400;
          color: #1C2E4A;
          line-height: 1.08;
          margin-bottom: 12px;
          background: linear-gradient(120deg, #1C2E4A 0%, #4a6fa5 55%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cart-hero-sub {
          font-size: 13px;
          color: #7a8aa0;
          font-weight: 300;
          letter-spacing: 0.06em;
        }

        .cart-layout {
          position: relative; z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 32px;
          align-items: start;
        }
        @media(max-width: 860px) {
          .cart-layout { grid-template-columns: 1fr; }
        }

        .cart-item-row {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(99,130,201,0.12);
          border-radius: 20px;
          padding: 20px 24px;
          margin-bottom: 16px;
          box-shadow: 0 4px 24px rgba(28,46,74,0.06);
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .cart-item-row:hover {
          box-shadow: 0 8px 36px rgba(28,46,74,0.12);
          transform: translateY(-2px);
        }
        .cart-watch-visual {
          width: 80px; height: 96px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cart-item-details { flex: 1; min-width: 0; }
        .cart-item-name {
          font-family: 'Playfair Display', serif;
          font-size: 17px; color: #1C2E4A;
          font-weight: 400; margin-bottom: 4px;
        }
        .cart-item-variant {
          font-size: 11px; color: #7a8aa0;
          letter-spacing: 0.07em; text-transform: uppercase;
          margin-bottom: 10px;
        }
        .cart-item-price {
          font-size: 15px; font-weight: 600;
          color: #4a6fa5;
        }
        .cart-qty-block {
          display: flex; align-items: center;
          gap: 10px; margin-right: 10px;
        }
        .cart-qty-btn {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 1.5px solid rgba(99,130,201,0.3);
          background: white; color: #1C2E4A;
          font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .cart-qty-btn:hover {
          background: #4a6fa5; color: white;
          border-color: #4a6fa5; transform: scale(1.1);
        }
        .cart-qty-val {
          font-size: 15px; font-weight: 600;
          color: #1C2E4A; width: 24px; text-align: center;
        }
        .cart-remove-btn {
          background: none; border: none;
          color: #adb5c8; cursor: pointer;
          padding: 6px; border-radius: 50%;
          transition: color 0.2s, background 0.2s, transform 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .cart-remove-btn:hover {
          color: #e05c6b; background: #fce8ea; transform: scale(1.1);
        }

        /* Empty */
        .cart-empty {
          text-align: center; padding: 80px 24px;
          color: #7a8aa0;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .cart-empty p { font-size: 16px; }
        .cart-empty-cta {
          display: inline-block;
          padding: 12px 32px;
          background: linear-gradient(120deg, #1C2E4A, #4a6fa5);
          color: white; border-radius: 50px;
          text-decoration: none; font-size: 12px;
          letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .cart-empty-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(74,111,165,0.35); }

        /* Summary */
        .cart-summary-card {
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(99,130,201,0.15);
          border-radius: 24px;
          padding: 32px 28px;
          box-shadow: 0 8px 40px rgba(28,46,74,0.08);
        }
        .cart-summary-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px; color: #1C2E4A;
          margin-bottom: 28px;
        }
        .cart-summary-line {
          display: flex; justify-content: space-between;
          font-size: 13px; color: #5a6a80;
          margin-bottom: 14px;
        }
        .cart-free-tag {
          color: #3aaf85; font-weight: 600; font-size: 12px;
          background: rgba(58,175,133,0.1); padding: 1px 8px; border-radius: 20px;
        }
        .cart-free-hint {
          font-size: 11px; color: #4a6fa5;
          background: rgba(74,111,165,0.08);
          padding: 8px 12px; border-radius: 10px;
          margin-bottom: 14px;
        }
        .cart-summary-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,130,201,0.25), transparent);
          margin: 20px 0;
        }
        .cart-summary-total {
          display: flex; justify-content: space-between;
          font-size: 18px; font-weight: 700;
          color: #1C2E4A; margin-bottom: 28px;
        }
        .cart-checkout-btn {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(120deg, #1C2E4A 0%, #4a6fa5 100%);
          color: white; border: none; border-radius: 14px;
          font-size: 12px; letter-spacing: 0.15em;
          text-transform: uppercase; font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: transform 0.3s, box-shadow 0.3s;
          margin-bottom: 16px;
        }
        .cart-checkout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(28,46,74,0.28);
        }
        .cart-continue-link {
          display: block; text-align: center;
          font-size: 12px; color: #7a8aa0;
          text-decoration: none; letter-spacing: 0.04em;
          transition: color 0.2s;
        }
        .cart-continue-link:hover { color: #4a6fa5; }

        .cart-trust-badges {
          display: flex; justify-content: space-between;
          margin-top: 20px; gap: 8px;
        }
        .cart-badge {
          flex: 1;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(99,130,201,0.1);
          border-radius: 14px;
          padding: 12px 8px;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          font-size: 10px; color: #5a6a80;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cart-badge:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(28,46,74,0.08); }
        .cart-badge-icon { font-size: 18px; }
        .cart-badge-label { letter-spacing: 0.04em; font-weight: 500; }
        
        /* Mobile Layout */
        @media (max-width: 600px) {
          .cart-page {
            padding: calc(var(--header-h, 70px) + 20px) 16px 80px;
          }
          .cart-hero-title {
            font-size: 2.2rem;
          }
          .cart-item-row {
             flex-direction: column;
             align-items: stretch;
             gap: 16px;
             padding: 16px;
          }
          /* Top portion: Image + Details */
          .cart-item-top {
             display: flex;
             align-items: center;
             gap: 16px;
          }
          .cart-watch-visual {
             width: 65px; height: 80px;
          }
          .cart-item-name {
             font-size: 15px;
          }
          .cart-item-variant {
             font-size: 10px;
          }
          /* Bottom portion: Qty + Remove */
          .cart-item-actions {
             display: flex;
             justify-content: space-between;
             align-items: center;
             padding-top: 12px;
             border-top: 1px solid rgba(0,0,0,0.05);
          }
          .cart-qty-block { margin: 0; }
          .cart-remove-btn { padding: 8px; background: rgba(0,0,0,0.03); }
          .cart-summary-card {
            padding: 24px 20px;
          }
          .cart-trust-badges {
            flex-direction: column;
            gap: 10px;
          }
          .cart-badge {
            flex-direction: row;
            text-align: left;
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
}
