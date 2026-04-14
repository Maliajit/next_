"use client";
import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist();

  return (
    <div className="wishlist-page">
      <style>{`
        .wishlist-page {
          min-height: 100vh;
          padding: 140px 8% 80px;
          background: #fdfdfd;
          font-family: 'Inter', sans-serif;
        }
        .wishlist-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .wishlist-header {
          margin-bottom: 60px;
          text-align: center;
        }
        .wishlist-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          font-weight: 400;
          color: #1a1a1a;
          margin-bottom: 15px;
        }
        .wishlist-header p {
          color: #888;
          font-size: 1.1rem;
          font-weight: 300;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 40px;
        }

        .wishlist-item {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          position: relative;
          border: 1px solid rgba(0,0,0,0.04);
        }
        .wishlist-item:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
        }

        .wishlist-item-img {
          width: 100%;
          aspect-ratio: 1;
          background: #f7f7f7;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px;
          position: relative;
        }
        .wishlist-item-img img {
          width: 80%;
          height: 80%;
          object-fit: contain;
          filter: drop-shadow(0 15px 30px rgba(0,0,0,0.1));
        }

        .wishlist-remove {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 32px;
          height: 32px;
          background: #fff;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ff4d4d;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 10;
          transition: all 0.3s;
        }
        .wishlist-remove:hover {
          background: #ff4d4d;
          color: #fff;
          transform: scale(1.1);
        }

        .wishlist-item-info {
          padding: 25px;
          text-align: center;
        }
        .wishlist-item-info h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          margin: 0 0 10px;
          color: #1a1a1a;
        }
        .wishlist-item-info .price {
          display: block;
          font-size: 1.2rem;
          color: #555;
          margin-bottom: 20px;
        }

        .wishlist-btn-group {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .wishlist-btn {
          padding: 12px 24px;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.3s;
        }
        .btn-config {
          background: #1a1a1a;
          color: #fff;
        }
        .btn-config:hover {
          background: #c4a35a;
          box-shadow: 0 8px 20px rgba(196, 163, 90, 0.25);
        }

        .wishlist-empty {
          text-align: center;
          padding: 100px 0;
        }
        .wishlist-empty svg {
          opacity: 0.15;
          margin-bottom: 30px;
        }
        .wishlist-empty h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          margin-bottom: 20px;
        }
        .wishlist-empty-cta {
          display: inline-block;
          padding: 16px 40px;
          background: #1a1a1a;
          color: #fff;
          text-decoration: none;
          border-radius: 40px;
          font-weight: 600;
          transition: all 0.3s;
        }
        .wishlist-empty-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }

        @media (max-width: 768px) {
          .wishlist-page { padding-top: 100px; }
          .wishlist-header h1 { font-size: 2.5rem; }
          .wishlist-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>Your Wishlist</h1>
          <p>The timepieces that captured your imagination.</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="wishlist-empty">

            <h2>Your collection is waiting to bloom.</h2>
            <p style={{ marginBottom: '40px' }}>Explore our exquisite timepieces and add them to your wishlist.</p>
            <Link href="/products" className="wishlist-empty-cta">Explore Fylex Watches</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((item) => (
              <div key={item.id} className="wishlist-item">
                <button
                  className="wishlist-remove"
                  onClick={() => toggleWishlist(item)}
                  title="Remove from Wishlist"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <div className="wishlist-item-img">
                  <img src={item.heroImage} alt={item.title} />
                </div>
                <div className="wishlist-item-info">
                  <h3>{item.title} {item.titleAccent}</h3>
                  <span className="price">{item.price}</span>
                  <div className="wishlist-btn-group">
                    <Link href={`/discover?watch=${item.id}`} className="wishlist-btn btn-config">Discover</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
