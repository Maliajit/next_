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
          padding: 160px 5% 80px;
          background: #ffffff;
          font-family: 'Inter', sans-serif;
        }
        .purchases-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .purchases-header {
          margin-bottom: 30px;
          text-align: center;
        }
        .purchases-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #000;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }
        .purchases-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .purchases-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .purchase-card {
          background: #f8f8f8;
          display: flex;
          flex-direction: column;
          position: relative;
          cursor: pointer;
          transition: transform 0.3s ease;
          overflow: hidden;
          text-decoration: none;
        }
        .purchase-card:hover {
          transform: translateY(-5px);
        }

        .purchase-img-wrap {
          width: 100%;
          height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: transparent;
        }
        .purchase-img-wrap img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .purchase-info {
          padding: 0 40px 40px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .purchase-date {
          font-size: 0.8rem;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }
        .purchase-name {
          font-size: 1.8rem;
          font-weight: 700;
          color: #000;
          margin: 0 0 8px;
          line-height: 1.2;
        }
        .v-accent {
          display: block;
          color: #666;
          font-size: 1.1rem;
          font-weight: 400;
          margin-bottom: 8px;
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
          font-size: 2.5rem;
          margin-bottom: 20px;
          font-weight: 700;
          color: #000;
        }
        .purchases-empty p {
          color: #666;
          margin-bottom: 40px;
        }
        .empty-cta {
          display: inline-block;
          padding: 15px 40px;
          background: #000;
          color: #fff;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 600;
          transition: background 0.3s;
          text-transform: uppercase;
        }
        .empty-cta:hover {
          background: #333;
        }

        @media (max-width: 1024px) {
          .purchases-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .purchase-img-wrap {
            height: 350px;
          }
        }

        @media (max-width: 600px) {
          .purchases-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .purchases-page {
            padding: 120px 3% 60px;
          }
          .purchase-info {
            padding: 0 15px 15px;
          }
          .purchase-img-wrap {
            height: 150px;
            padding: 20px;
          }
          .purchase-name {
            font-size: 1.1rem;
          }
          .v-accent {
            font-size: 0.9rem;
          }
          .purchase-date {
            font-size: 0.7rem;
          }
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
                  </h3>
                  {unit.variantDisplay && <span className="v-accent">{unit.variantDisplay}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
