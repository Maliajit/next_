"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import productsData from '../../../data/productsData';

const PreConfigure = () => {
  const [favorites, setFavorites] = useState({});

  const toggleFavorite = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="pre-configure-page fixed inset-0 flex flex-col bg-white overflow-hidden z-[1001]">
      <style>{`
        .pre-configure-page {
          font-family: 'Inter', sans-serif;
        }
        .swiper-container-main {
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
          z-index: 5;
        }
        .swiper-slide {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .slide-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }
        .p-aura-shadow {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 20%, transparent 60%),
            linear-gradient(to left, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 25%, transparent 65%);
          z-index: 2;
        }
        .p-mist-layer {
          position: absolute;
          width: 120%;
          height: 120%;
          filter: blur(120px);
          opacity: 0.7;
          z-index: 1;
        }
        .p-accent-beam {
          position: absolute;
          width: 200%;
          height: 300px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          transform: rotate(-35deg);
          top: -10%;
          left: -20%;
          pointer-events: none;
          z-index: 3;
          opacity: 0.6;
        }

        .btn-fav {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.06);
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          color: #1a1a1a;
          pointer-events: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .btn-fav:hover {
          transform: translateY(-2px);
          border-color: #c4a35a;
          color: #c4a35a;
          background: #fff;
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }
        .btn-fav.active {
          background: #1a1a1a;
          border-color: #1a1a1a;
          color: #c4a35a;
        }

        .section-champagne { background: #fffafb; }
        .section-champagne .p-mist-layer { background: radial-gradient(circle at 70% 40%, rgba(196,163,90,0.2) 0%, transparent 70%); }
        
        .section-mist-blue { background: #e5f0f0ef; }
        .section-mist-blue .p-mist-layer { background: radial-gradient(circle at 70% 40%, rgba(30,64,175,0.15) 0%, transparent 70%); }

        .section-soft-green { background: #ddfddcff; }
        .section-soft-green .p-mist-layer { background: radial-gradient(circle at 70% 40%, rgba(6,110,80,0.15) 0%, transparent 70%); }

        .section-pearl-silver { background: #fcfcfc; }
        .section-pearl-silver .p-mist-layer { background: radial-gradient(circle at 70% 40%, rgba(71,85,105,0.15) 0%, transparent 70%); }

        .section-rose-burgundy { background: #d4c0c4cb; }
        .section-rose-burgundy .p-mist-layer { background: radial-gradient(circle at 70% 40%, rgba(127,29,29,0.12) 0%, transparent 70%); }

        .slide-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
          max-width: 1200px;
          padding: 80px 20px 120px; /* Space for Header and Footer/Pagination */
        }
        .product-image-container {
          position: relative;
          width: 100%;
          max-width: 480px;
          margin-bottom: 20px;
        }
        .product-image {
          width: 100%;
          height: auto;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.12));
        }
        
        .product-info {
          color: #1a1a1a;
        }
        .product-name {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 400;
          margin: 0;
          line-height: 1.1;
        }
        .product-name em {
          font-style: italic;
          opacity: 0.6;
          margin-left: 10px;
        }
        .product-price {
          font-size: 1.3rem;
          color: #555;
          margin: 10px 0 25px;
          font-weight: 300;
          display: block;
        }
        .btn-configure {
          display: inline-block;
          padding: 13px 40px;
          background: #1a1a1a;
          color: #fff;
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          border-radius: 999px;
          border: 1px solid #1a1a1a;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        .btn-configure:hover {
          background: #c4a35a;
          border-color: #c4a35a;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(196, 163, 90, 0.25);
        }

        /* Custom Pagination Lines */
        .swiper-pagination {
          bottom: 120px !important; /* Adjusted position */
          display: flex;
          justify-content: center;
          gap: 12px;
          z-index: 50;
        }
        .swiper-pagination-bullet {
          width: 40px !important;
          height: 2px !important;
          border-radius: 0 !important;
          background: #1a1a1a !important;
          opacity: 0.2;
          margin: 0 !important;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          width: 60px !important;
          background: #c4a35a !important;
        }

        .footer-wrapper {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 40;
          background: linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0));
          pointer-events: none;
        }
        .footer-wrapper > * {
          pointer-events: auto;
        }
        .footer-wrapper footer {
          padding: 30px 20px !important;
          width: 100%;
        }
        /* Keep it clean but let it be visible */
        .footer-wrapper .footer-main-v1 { 
          display: none; 
        }
        .footer-wrapper .footer-bottom-v1 { padding-top: 0; border: none; justify-content: center; }

        .header-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 50;
        }

        @media (max-width: 1024px) {
          .slide-content { padding-bottom: 160px; }
          .swiper-pagination { bottom: 100px !important; }
        }

        @media (max-width: 768px) {
          .product-image-container { max-width: 280px; }
          .product-name { font-size: 1.8rem; }
          .product-price { font-size: 1.1rem; }
          .btn-configure { padding: 14px 35px; font-size: 0.75rem; }
          .swiper-pagination { bottom: 90px !important; }
        }
      `}</style>

      <div className="header-wrapper">
        <Header />
      </div>

      <main className="flex-1 relative overflow-hidden z-10">
        <div className="swiper-container-main">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={true}
            className="mySwiper h-full w-full"
          >
            {productsData.map((product) => (
              <SwiperSlide key={product.id}>
                <div className={`slide-bg section-${product.theme}`}>
                  <div className="p-aura-shadow"></div>
                  <div className="p-mist-layer"></div>
                  <div className="p-accent-beam"></div>
                </div>

                <div className="slide-content">
                  <div className="product-image-container">
                    <img src={product.heroImage} alt={product.title} className="product-image" />
                  </div>
                  <div className="product-info">
                    <h2 className="product-name">
                      {product.title}
                      <em>{product.titleAccent}</em>
                    </h2>
                    <span className="product-price">{product.price}</span>
                    <div className="flex gap-3 items-center justify-center mt-6">
                      <Link href={`/configure?watch=${product.id}`} className="btn-configure">
                        Configure
                      </Link>
                      <button
                        className={`btn-fav ${favorites[product.id] ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(product.id);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={favorites[product.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </main>

      {/* Custom footer wrapper to keep it clean and fixed at bottom */}
      <div className="footer-wrapper">
        <Footer />
      </div>
    </div>
  );
};

export default PreConfigure;
