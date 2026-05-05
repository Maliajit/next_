"use client";
import React from 'react';
import Link from 'next/link';
import { useOrder } from '@/context/OrderContext';

export default function MyPurchases() {
  const { orders } = useOrder();

  // Helper to build redirect URL to discover page
  const buildRedirectUrl = (item) => {
    const productId = item.productId || item.product?.id || item.product_id;
    if (!productId) return '/discover';
    
    let url = `/discover?watch=${productId}`;
    const variant = item.productVariant || item.variant;
    
    if (variant) {
      url += `&variant=${variant.id}`;
      if (variant.variantAttributes) {
        variant.variantAttributes.forEach(va => {
          const attrName = va.attributeValue?.attribute?.name?.toLowerCase();
          const valLabel = va.attributeValue?.label;
          if (attrName && valLabel) {
            url += `&${attrName.replace(/\s+/g, '+')}=${encodeURIComponent(valLabel)}`;
          }
        });
      }
    }
    return url;
  };

  // Helper to build variant name from attributes
  const getVariantName = (item) => {
    const variant = item.productVariant || item.variant;
    if (variant?.variantAttributes && variant.variantAttributes.length > 0) {
      return variant.variantAttributes.map(va => va.attributeValue?.label).join(', ');
    }
    return item.subtitle || item.titleAccent || '';
  };

  // Flatten orders into individual item cards, expanding for quantity
  const allPurchasedUnits = orders.flatMap(order => 
    order.items.flatMap(item => 
      Array.from({ length: item.qty || 1 }, (_, i) => ({
        ...item,
        orderDate: order.date,
        orderId: order.id,
        redirectUrl: buildRedirectUrl(item),
        variantDisplay: getVariantName(item)
      }))
    )
  );

  return (
    <div className="purchases-page">
      <style>{`
        .purchases-page {
          min-height: 100vh;
          padding: 140px 8% 80px;
          background: #fdfdfd;
          font-family: 'Inter', sans-serif;
        }
        .purchases-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .purchases-header {
          margin-bottom: 60px;
          text-align: center;
        }
        .purchases-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          font-weight: 400;
          color: #1a1a1a;
          margin-bottom: 15px;
        }
        .purchases-header p {
          color: #888;
          font-size: 1.1rem;
          font-weight: 300;
        }

        .purchases-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .purchase-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          display: flex;
          align-items: center;
          border: 1px solid rgba(0,0,0,0.04);
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          padding: 15px 25px;
        }
        .purchase-card:hover {
          transform: translateX(10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.06);
          border-color: rgba(0,0,0,0.1);
        }

        .purchase-img-wrap {
          width: 80px;
          height: 80px;
          background: #f8f8f8;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          flex-shrink: 0;
        }
        .purchase-img-wrap img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 5px 15px rgba(0,0,0,0.05));
          transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .purchase-card:hover .purchase-img-wrap img {
          transform: scale(1.1);
        }

        .purchase-info {
          padding: 0 25px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .purchase-date {
          font-size: 0.7rem;
          font-weight: 600;
          color: #c4a35a;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .purchase-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          font-weight: 400;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.2;
        }
        .v-accent {
          font-size: 1rem;
          color: #888;
          font-weight: 300;
          font-family: 'Inter', sans-serif;
        }

        .purchases-empty {
          text-align: center;
          padding: 100px 0;
        }
        .purchases-empty svg {
          opacity: 0.1;
          margin-bottom: 30px;
        }
        .purchases-empty h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          margin-bottom: 20px;
        }
        .empty-cta {
          display: inline-block;
          padding: 12px 30px;
          background: #1a1a1a;
          color: #fff;
          text-decoration: none;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          margin-top: 20px;
          border: 1px solid #1a1a1a;
        }
        .empty-cta:hover {
          background: #fff;
          color: #1a1a1a;
        }

        @media (max-width: 768px) {
          .purchases-page { padding: 100px 5% 60px; }
          .purchases-header h1 { font-size: 2rem; }
          .purchase-card { padding: 12px 15px; gap: 0; }
          .purchase-info { padding: 0 15px; }
          .purchase-name { font-size: 1.1rem; }
        }
      `}</style>

      <div className="purchases-container">
        <div className="purchases-header">
          <h1>Your Collection</h1>
          <p>Chronicles of your journey with Fylex.</p>
        </div>

        {allPurchasedUnits.length === 0 ? (
          <div className="purchases-empty">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h2>No watches purchased yet.</h2>
            <p>Your masterpiece is waiting for its first second.</p>
            <Link href="/products" className="empty-cta">Browse Collection</Link>
          </div>
        ) : (
          <div className="purchases-grid">
            {allPurchasedUnits.map((unit, idx) => (
              <Link key={`${unit.orderId}-${unit.id}-${idx}`} href={unit.redirectUrl} className="purchase-card">
                <div className="purchase-img-wrap">
                  <img src={unit.image || unit.heroImage} alt={unit.title} />
                </div>
                <div className="purchase-info">
                  <span className="purchase-date">{unit.orderDate}</span>
                  <h3 className="purchase-name">
                    {unit.title} 
                    {unit.variantDisplay && <span className="v-accent"> — {unit.variantDisplay}</span>}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
