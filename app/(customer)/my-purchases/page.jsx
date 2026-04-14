"use client";
import React from 'react';
import Link from 'next/link';
import { useOrder } from '@/context/OrderContext';

export default function MyPurchases() {
  const { orders } = useOrder();

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
          max-width: 1000px;
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

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .order-card {
          background: #fff;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.04);
          transition: transform 0.3s ease;
        }
        .order-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.06);
        }

        .order-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 1px solid #f0f0f0;
        }
        .order-id { font-weight: 700; color: #1a1a1a; font-size: 0.9rem; }
        .order-date { color: #888; font-size: 0.9rem; }

        .order-items {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .bought-item {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .bought-img {
          width: 80px;
          height: 80px;
          background: #f7f7f7;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
        }
        .bought-img img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .bought-info {
          flex: 1;
        }
        .bought-info h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          margin: 0 0 4px;
        }
        .bought-info .price {
          color: #666;
          font-weight: 500;
        }

        .order-total-row {
          margin-top: 25px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 15px;
        }
        .total-lbl { color: #888; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .total-val { font-size: 1.4rem; font-weight: 700; color: #1a1a1a; }

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
          padding: 16px 40px;
          background: #1a1a1a;
          color: #fff;
          text-decoration: none;
          border-radius: 40px;
          font-weight: 600;
          transition: all 0.3s;
          margin-top: 20px;
        }
        .empty-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }

        @media (max-width: 768px) {
          .purchases-page { padding: 100px 5% 60px; }
          .purchases-header h1 { font-size: 2.5rem; }
          .order-card { padding: 20px; }
        }
      `}</style>

      <div className="purchases-container">
        <div className="purchases-header">
          <h1>Your Collection</h1>
          <p>Chronicles of your journey with Fylex.</p>
        </div>

        {orders.length === 0 ? (
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
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-meta">
                  <span className="order-id">{order.id}</span>
                  <span className="order-date">{order.date}</span>
                </div>
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="bought-item">
                      <div className="bought-img">
                        <img src={item.heroImage} alt={item.title} />
                      </div>
                      <div className="bought-info">
                        <h3>{item.title} {item.titleAccent}</h3>
                        <div className="price">{item.price} x {item.qty}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-total-row">
                  <span className="total-lbl">Total Investment</span>
                  <span className="total-val">{order.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
