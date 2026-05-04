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
          padding: 140px 8% 80px;
          background: #fdfdfd;
          font-family: 'Inter', sans-serif;
        }
        .wishlist-container {
          max-width: 1000px;
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
          color: #666;
          font-size: 1.1rem;
          font-weight: 300;
        }

        .wishlist-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .wishlist-item {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          padding: 30px 40px;
          cursor: pointer;
          border: 1px solid #f0f0f0;
          align-items: center;
        }
        .wishlist-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }

        .wishlist-item-content {
          flex: 0 0 60%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-right: 30px;
        }

        .wishlist-item-info h3 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 10px;
          color: #1a1a1a;
          line-height: 1.1;
        }
        .wishlist-item-info .variant-name {
          display: block;
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 10px;
          font-weight: 400;
        }
        .wishlist-item-info .price-container {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .wishlist-item-info .price {
          font-size: 1.3rem;
          color: #1a1a1a;
          font-weight: 500;
        }

        .wishlist-item-img {
          flex: 0 0 40%;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        .wishlist-item-img img {
          max-width: 100%;
          max-height: 240px;
          object-fit: contain;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
        }

        .wishlist-remove {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #999;
          transition: all 0.3s;
          z-index: 10;
        }
        .wishlist-remove:hover {
          color: #333;
          transform: scale(1.1);
        }

        .btn-cart {
          background: transparent;
          color: #006039;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0;
          transition: all 0.3s;
        }
        .btn-cart:hover {
          opacity: 0.8;
          transform: translateX(4px);
        }
        .btn-cart svg {
            width: 20px;
            height: 20px;
        }

        .wishlist-empty {
          text-align: center;
          padding: 100px 0;
        }
        .wishlist-empty h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          margin-bottom: 20px;
        }
        .wishlist-empty-cta {
          display: inline-block;
          padding: 12px 35px;
          background: #1a1a1a;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s;
        }
        .wishlist-empty-cta:hover {
          background: #333;
        }

        @media (max-width: 768px) {
          .wishlist-item {
            padding: 25px;
            gap: 15px;
          }
          .wishlist-item-content {
            padding-right: 15px;
          }
          .wishlist-item-info h3 {
            font-size: 1.2rem;
          }
          .wishlist-item-info .variant-name {
            font-size: 0.95rem;
          }
          .wishlist-item-info .price {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 480px) {
          .wishlist-page {
            padding: 100px 5% 60px;
          }
          .wishlist-item {
              flex-direction: row; /* Keeping it horizontal even on small screens as requested */
              padding: 20px;
          }
          .wishlist-item-content {
              flex: 0 0 65%;
              padding-right: 10px;
          }
          .wishlist-item-img {
              flex: 0 0 35%;
          }
          .wishlist-header h1 {
              font-size: 2rem;
          }
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
              <div 
                key={item.id} 
                className="wishlist-item"
                onClick={() => router.push(item.redirectUrl || `/discover?watch=${item.productId || item.id}`)}
              >
                <button
                  className="wishlist-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(item);
                  }}
                  title="Remove from Wishlist"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <div className="wishlist-item-content">
                  <div className="wishlist-item-info">
                    <h3>{item.productName || item.title}</h3>
                    <span className="variant-name">{item.variantName}</span>
                    <div className="price-container">
                      <span className="price">{item.price}</span>
                    </div>
                  </div>

                  <div className="btn-cart-container">
                    <button 
                      onClick={(e) => handleAddToCart(e, item)} 
                      className="btn-cart"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      Add to Cart
                    </button>
                  </div>
                </div>

                <div className="wishlist-item-img">
                  <img src={item.image || item.heroImage} alt={item.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
