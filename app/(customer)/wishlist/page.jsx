"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    const variantId = item.variantId || (item.variants?.[0]?.id) || item.id;
    addToCart(variantId.toString(), 1, item);
    toggleWishlist(item);
  };

  return (
    <div className="wishlist-page">
      <style>{`
        .wishlist-page {
          min-height: 100vh;
          padding: 160px 5% 80px;
          background: #ffffff;
          font-family: 'Inter', sans-serif;
        }
        .wishlist-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .wishlist-header {
          margin-bottom: 30px;
          text-align: center;
        }
        .wishlist-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #000;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }
        .wishlist-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .wishlist-item {
          background: #f8f8f8;
          display: flex;
          flex-direction: column;
          position: relative;
          cursor: pointer;
          transition: transform 0.3s ease;
          overflow: hidden;
        }
        .wishlist-item:hover {
          transform: translateY(-5px);
        }

        .wishlist-item-img {
          width: 100%;
          height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: transparent;
        }
        .wishlist-item-img img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .wishlist-item-content {
          padding: 0 40px 40px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .wishlist-item-info {
          margin-bottom: 10px;
        }
        .wishlist-item-info h3 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #000;
          // margin: 0 0 8px;
          line-height: 1.2;
        }
        .wishlist-item-info .variant-name {
          display: block;
          color: #666;
          font-size: 1.1rem;
          // margin-bottom: 8px;
        }
        .wishlist-item-info .price {
          font-size: 1.2rem;
          color: #000;
          font-weight: 600;
        }

        .wishlist-remove {
          position: absolute;
          top: 25px;
          right: 25px;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #000;
          transition: opacity 0.2s;
          z-index: 10;
        }
        .wishlist-remove:hover {
          opacity: 0.6;
        }

        .btn-cart-container{
        display: flex;
    justify-content: center;
        }
        .btn-cart {
          background: #1a1a1a;
          color: #fff;
          border: 1px solid #1a1a1a;
          border-radius: 999px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 9px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          margin-top: auto;
        }
        .btn-cart:hover {
          background: rgba(26, 26, 26, 0.8);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .wishlist-empty {
          text-align: center;
          padding: 100px 0;
        }
        .wishlist-empty h2 {
          font-size: 2.5rem;
          margin-bottom: 20px;
          font-weight: 700;
        }
        .wishlist-empty-cta {
          display: inline-block;
          padding: 8px 16px;
          background: #000;
          color: #fff;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 600;
          transition: background 0.3s;
          text-transform: uppercase;
          border-radius: 999px;
        }
        .wishlist-empty-cta:hover {
          background: #333;
        }

        @media (max-width: 1024px) {
          .wishlist-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .wishlist-item-img {
            height: 350px;
          }
        }

        @media (max-width: 600px) {
          .wishlist-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .wishlist-page {
            padding: 120px 3% 60px;
          }
          .wishlist-item-content {
            padding: 0 15px 15px;
          }
          .wishlist-item-img {
            height: 190px;
            padding: 20px;
          }
          .wishlist-item-info h3 {
            font-size: 1.0rem;
          }
          .wishlist-item-info .variant-name {
            font-size: 0.9rem;
          }
          .wishlist-item-info .price {
            font-size: 1rem;
          }
          .wishlist-remove {
            top: 15px;
            right: 15px;
          }
        }

      `}</style>

      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>Wishlist</h1>
          <p>Your curated selection of exceptional timepieces.</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <h2>Your collection is empty</h2>
            <p style={{ marginBottom: '40px', color: '#666' }}>Discover our latest collections and find your next masterpiece.</p>
            <Link href="/products" className="wishlist-empty-cta">Shop Collection</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((item) => (
              <div 
                key={item.id} 
                className="wishlist-item"
                onClick={() => router.push(item.redirectUrl || `/discover?watch=${item.slug || item.productId || item.id}`)}
              >
                <button
                  className="wishlist-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(item);
                  }}
                  title="Remove from Wishlist"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <div className="wishlist-item-img">
                  <img src={item.image || item.heroImage} alt={item.title} />
                </div>

                <div className="wishlist-item-content">
                  <div className="wishlist-item-info">
                    <h3>{item.title}</h3>
                    <span className="variant-name">{item.variantName}</span>
                    <span className="price">{item.formattedPrice}</span>
                  </div>

                  <div className="btn-cart-container">
                    <button 
                      onClick={(e) => handleAddToCart(e, item)} 
                      className="btn-cart"
                    >
                      Move to cart
                    </button>
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