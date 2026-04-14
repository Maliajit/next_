"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { fetchFeaturedProducts } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

// ─── DATA ────────────────────────────────────────────────────────────────────

const features = [
  { title: "Carbon Fiber Strap", desc: "Lightweight, tactical, and incredibly durable.", img: "https://www.breitling.com/api/image-proxy/images.ctfassets.net/11yu5j5b14kx/7uDlGm6A8qj2hAOE9D2rgO/bf0a4269ce2d43f76081c48eeed2bfcf/SOH_men_hero_mobile.jpg?im=RegionOfInterestCrop%2Cwidth%3D2001%2Cheight%3D1501%2CregionOfInterest%3D%28400%2C250%29&format=auto" },
  { title: "Kinetic Charging", desc: "Self-winding movement powered by your motion.", img: "https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&q=80&w=1920" },
  { title: "Modular Calibre", desc: "Precisely engineered parts for easy maintenance.", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Lf9fG1n5h47n0yh_hy_OhrM-6kODEl5Z3w&s" },
  { title: "Super-LumiNova®", desc: "Exceptional glow-in-the-dark visibility.", img: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1920" },
  { title: "Deployment Clasp", desc: "Maximum security with a single click.", img: "https://images.unsplash.com/photo-1585123334904-845d60e97b29?auto=format&fit=crop&q=80&w=1920" },
  { title: "Precision Rating", desc: "Certified chronometer for absolute accuracy.", img: "https://cdn.shopify.com/s/files/1/0699/3156/5284/files/longines.png?v=1727954696" },
  { title: "Shock Resistant", desc: "Designed to withstand extreme g-forces.", img: "https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&q=80&w=1920" },
  { title: "Grand Complications", desc: "A masterpiece of mechanical complexity.", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Lf9fG1n5h47n0yh_hy_OhrM-6kODEl5Z3w&s" },
  { title: "Heritage Registry", desc: "Protect your investment with unique serial IDs.", img: "https://images.unsplash.com/photo-1585123334904-845d60e97b29?auto=format&fit=crop&q=80&w=1920" },
  { title: "Ceramic Bezel", desc: "Scratch-resistant finish that never fades.", img: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1920" },
  { title: "Dual Time Zone", desc: "Effortless GMT function for the global traveler.", img: "https://www.breitling.com/api/image-proxy/images.ctfassets.net/11yu5j5b14kx/7uDlGm6A8qj2hAOE9D2rgO/bf0a4269ce2d43f76081c48eeed2bfcf/SOH_men_hero_mobile.jpg?im=RegionOfInterestCrop%2Cwidth%3D2001%2Cheight%3D1501%2CregionOfInterest%3D%28400%2C250%29&format=auto" },
  { title: "Master Chronometer", desc: "Exceeding the highest standards of horology.", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Lf9fG1n5h47n0yh_hy_OhrM-6kODEl5Z3w&s" },
  { title: "Sapphire Crystal", desc: "Ultra-clear, AR-coated for perfect legibility.", img: "https://cdn.shopify.com/s/files/1/0699/3156/5284/files/longines.png?v=1727954696" },
  { title: "Power Reserve", desc: "Extended energy stored for every journey.", img: "https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&q=80&w=1920" },
  { title: "Signature Crown", desc: "The final touch of master craftsmanship.", img: "https://www.breitling.com/api/image-proxy/images.ctfassets.net/11yu5j5b14kx/7uDlGm6A8qj2hAOE9D2rgO/bf0a4269ce2d43f76081c48eeed2bfcf/SOH_men_hero_mobile.jpg?im=RegionOfInterestCrop%2Cwidth%3D2001%2Cheight%3D1501%2CregionOfInterest%3D%28400%2C250%29&format=auto" }
];

const gallery = [
  { src: "https://www.breitling.com/api/image-proxy/images.ctfassets.net/11yu5j5b14kx/7uDlGm6A8qj2hAOE9D2rgO/bf0a4269ce2d43f76081c48eeed2bfcf/SOH_men_hero_mobile.jpg?im=RegionOfInterestCrop%2Cwidth%3D2001%2Cheight%3D1501%2CregionOfInterest%3D%28400%2C250%29&format=auto" },
  { src: "https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&q=80&w=1920" },
  { src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Lf9fG1n5h47n0yh_hy_OhrM-6kODEl5Z3w&s" },
  { src: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1920" },
  { src: "https://zimsonwatches.com/cdn/shop/articles/Rado_2.png?v=1715152502&width=1100" },
  { src: "https://www.breitling.com/api/image-proxy/images.ctfassets.net/11yu5j5b14kx/7uDlGm6A8qj2hAOE9D2rgO/bf0a4269ce2d43f76081c48eeed2bfcf/SOH_men_hero_mobile.jpg?im=RegionOfInterestCrop%2Cwidth%3D2001%2Cheight%3D1501%2CregionOfInterest%3D%28400%2C250%29&format=auto" },
  { src: "https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&q=80&w=1920" },
  { src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Lf9fG1n5h47n0yh_hy_OhrM-6kODEl5Z3w&s" },
  { src: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1920" },
  { src: "https://zimsonwatches.com/cdn/shop/articles/Rado_2.png?v=1715152502&width=1100" },
  { src: "https://www.breitling.com/api/image-proxy/images.ctfassets.net/11yu5j5b14kx/7uDlGm6A8qj2hAOE9D2rgO/bf0a4269ce2d43f76081c48eeed2bfcf/SOH_men_hero_mobile.jpg?im=RegionOfInterestCrop%2Cwidth%3D2001%2Cheight%3D1501%2CregionOfInterest%3D%28400%2C250%29&format=auto" },
  { src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Lf9fG1n5h47n0yh_hy_OhrM-6kODEl5Z3w&s" },
  { src: "https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&q=80&w=1920" },
  { src: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1920" },
  { src: "https://zimsonwatches.com/cdn/shop/articles/Rado_2.png?v=1715152502&width=1100" },
  { src: "https://www.breitling.com/api/image-proxy/images.ctfassets.net/11yu5j5b14kx/7uDlGm6A8qj2hAOE9D2rgO/bf0a4269ce2d43f76081c48eeed2bfcf/SOH_men_hero_mobile.jpg?im=RegionOfInterestCrop%2Cwidth%3D2001%2Cheight%3D1501%2CregionOfInterest%3D%28400%2C250%29&format=auto" },
  { src: "https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&q=80&w=1920" },
  { src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Lf9fG1n5h47n0yh_hy_OhrM-6kODEl5Z3w&s" },
  { src: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1920" },
  { src: "https://zimsonwatches.com/cdn/shop/articles/Rado_2.png?v=1715152502&width=1100" },
  { src: "https://www.breitling.com/api/image-proxy/images.ctfassets.net/11yu5j5b14kx/7uDlGm6A8qj2hAOE9D2rgO/bf0a4269ce2d43f76081c48eeed2bfcf/SOH_men_hero_mobile.jpg?im=RegionOfInterestCrop%2Cwidth%3D2001%2Cheight%3D1501%2CregionOfInterest%3D%28400%2C250%29&format=auto" },
  { src: "https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&q=80&w=1920" }
];

// ─── DATA ────────────────────────────────────────────────────────────────────

// ─── GALLERY HELPERS ─────────────────────────────────────────────────────────

function buildGalleryColumns(items: any[]) {
  const cols = [];
  let idx = 0;
  let big = true;
  while (idx < items.length) {
    const size = big ? 3 : 2;
    const col = items.slice(idx, idx + size);
    if (col.length) cols.push(col);
    idx += size;
    big = !big;
  }
  return cols;
}

// ─── GALLERY CAROUSEL COMPONENT ──────────────────────────────────────────────

const GalleryCarousel = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const posRef = useRef<number>(0);
  const velRef = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const dragStartX = useRef<number>(0);
  const dragStartPos = useRef<number>(0);
  const lastDragX = useRef<number>(0);
  const lastDragTime = useRef<number>(0);
  const halfWidthRef = useRef<number>(0);
  const AUTO_SPEED = 0.6; // px per frame

  // Measure half-width after render
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        halfWidthRef.current = trackRef.current.scrollWidth / 2;
      }
    };
    // Two rAFs to ensure layout is complete
    requestAnimationFrame(() => requestAnimationFrame(measure));
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // RAF animation loop
  const tick = useCallback(() => {
    const half = halfWidthRef.current;

    if (!isDragging.current) {
      velRef.current *= 0.92;
      if (Math.abs(velRef.current) < 0.05) velRef.current = 0;
    }

    posRef.current -= (AUTO_SPEED + Math.max(0, velRef.current));

    // Seamless loop reset
    if (half > 0 && Math.abs(posRef.current) >= half) {
      posRef.current += half;
    }

    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [tick]);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent | React.TouchEvent | any) => {
    isDragging.current = true;
    const clientX = 'clientX' in e ? e.clientX : (e as React.TouchEvent).touches?.[0]?.clientX ?? 0;
    dragStartX.current = clientX;
    dragStartPos.current = posRef.current;
    lastDragX.current = clientX;
    lastDragTime.current = performance.now();
    velRef.current = 0;
    if ((e as React.PointerEvent).pointerId != null) {
      (trackRef.current as any)?.setPointerCapture?.((e as React.PointerEvent).pointerId);
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent | React.TouchEvent | any) => {
    if (!isDragging.current) return;
    const clientX = 'clientX' in e ? e.clientX : (e as React.TouchEvent).touches?.[0]?.clientX ?? 0;
    const delta = clientX - dragStartX.current;

    // Left-only drag: clamp to negative delta
    const clampedDelta = Math.min(0, delta);
    posRef.current = dragStartPos.current + clampedDelta;

    const now = performance.now();
    const dt = now - lastDragTime.current;
    if (dt > 0) {
      // velocity in px/frame (positive = moving left)
      const rawVel = ((lastDragX.current - clientX) / dt) * (1000 / 60);
      velRef.current = Math.max(0, rawVel);
    }
    lastDragX.current = clientX;
    lastDragTime.current = now;
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const cols = buildGalleryColumns(gallery);
  // Duplicate for seamless infinite loop
  const allCols = [...cols, ...cols];

  return (
    <div
      className="fylex-gallery-viewport"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onTouchStart={(e) => onPointerDown({ clientX: e.touches[0].clientX })}
      onTouchMove={(e) => onPointerMove({ clientX: e.touches[0].clientX })}
      onTouchEnd={onPointerUp}
    >
      <div className="fylex-gallery-track" ref={trackRef}>
        {allCols.map((col, ci) => (
          <div className="fylex-gallery-col" key={ci}>
            {col.map((g, i) => (
              <div
                className="fylex-gallery-item"
                key={i}
              >
                <img src={g.src} alt="Atelier" draggable={false} />
                <div className="fylex-overlay" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

import productsData from '@/data/productsData';
import { ProductSkeleton } from '@/components/ui/Skeleton';

// ─── MAIN HOME COMPONENT ──────────────────────────────────────────────────────

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [flipValue, setFlipValue] = useState(246308291);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const loadFeatured = async () => {
      const res = await fetchFeaturedProducts();
      const data = res.data || res || [];
      setFeaturedProducts(Array.isArray(data) ? data : []);
      setLoadingFeatured(false);
    };
    loadFeatured();

  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Section refs for potential future use or ScrollTrigger targeting if needed
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const galleryRef = useRef(null);
  const containerRef = useRef(null);

  // Scroll handling removed as we now use ScrollTrigger and Lenis

  // ── Flip counter ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setFlipValue(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Section navigation helpers removed


  // ── ScrollTrigger setup ────────────────────────────────────────
  useEffect(() => {
    // Reveal cards on scroll
    const sections = gsap.utils.toArray('.section');
    sections.forEach((section: any) => {
      const card = section.querySelector('.card');
      if (card) {
        ScrollTrigger.create({
          trigger: section,
          start: "top 60%",
          end: "bottom 30%",
          onEnter: () => card.classList.add('in'),
          onEnterBack: () => card.classList.add('in'),
          onLeave: () => card.classList.remove('in'),
          onLeaveBack: () => card.classList.remove('in')
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  // Features focal-point animation removed as the section is currently inactive

  // ── FlipDigit sub-component ───────────────────────────────────
  const FlipDigit = ({ digit }: { digit: any }) => {
    const [prevDigit, setPrevDigit] = useState(digit);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
      if (digit !== prevDigit) {
        setIsAnimating(true);
        const timer = setTimeout(() => {
          setPrevDigit(digit);
          setIsAnimating(false);
        }, 350);
        return () => clearTimeout(timer);
      }
    }, [digit, prevDigit]);

    return (
      <div className="flip-digit">
        <div className="flip-top">{isAnimating ? digit : prevDigit}</div>
        <div className="flip-bottom">{isAnimating ? digit : prevDigit}</div>
        <div className={`flip-flap ${isAnimating ? 'animate' : ''}`} data-next={digit}>
          {isAnimating ? prevDigit : digit}
        </div>
      </div>
    );
  };

  const renderFlipCounter = () => {
    const str = String(flipValue).padStart(9, '0');
    const groups = [str.slice(0, 3), str.slice(3, 6), str.slice(6, 9)];
    return (
      <div className="flip-digits">
        {groups.map((group, gi) => (
          <div className="flip-group" key={gi}>
            {[...group].map((d, di) => (
              <FlipDigit key={gi * 3 + di} digit={d} />
            ))}
          </div>
        ))}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="v1-home" ref={containerRef}>
      <style>{`
        .v1-home { background: #F9F9F7; }

        /* ── Hero sections ── */
        .section {
          height: 100svh; min-height: 500px; width: 100%;
          background-attachment: fixed; background-size: cover; background-position: center;
          display: flex; align-items: center; justify-content: flex-start;
          padding-left: clamp(40px, 8vw, 120px);
          position: relative; overflow: hidden;
        }
        .section::before { content: ''; position: absolute; inset: 0; z-index: 0; }
        .s1::before { background: linear-gradient(135deg, rgba(10,8,4,0), rgba(40,28,10,.40)); }
        .s2::before { background: linear-gradient(160deg, rgba(6,4,1,0), rgba(22,14,4,0)); }
        .s1::after, .s4::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0));
          z-index: 1;
        }

        /* ── Featured Grid Section ── */
        .featured-title {
          font-family: 'Inter', sans-serif;
          font-size: 1.5rem;
          font-weight: 500; color: #111;
          letter-spacing: -0.01em;
          margin-bottom: 2rem;
        }
        .featured-grid-wrap {
          display: flex; flex-direction: column;
          padding: 40px 0 0 !important;
          margin: 0 auto !important;
          width: 100%;
          max-width: 1920px;
          height: 100vh;
          border-radius: 0;
          overflow: hidden;
          box-sizing: border-box;
        }
        .featured-grid-header { 
          padding: 0 4% 1rem; 
          text-align: left;
          width: 100%;
        }
        .featured-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 0; width: 100%; flex: 1;
        }
        .featured-item-v2 {
          position: relative; overflow: hidden;
          background: #f5f5f5; border-radius: 0;
        }
        .featured-item-v2 img {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%; object-fit: contain;
          padding: 30px;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .featured-item-v2:hover img { transform: scale(1.04); }
        
        .featured-overlay-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%);
          z-index: 1;
        }

        .featured-content {
          position: absolute; bottom: 48px; left: 48px;
          z-index: 2; color: #fff;
          max-width: 80%;
        }
        .f-label {
          font-family: 'Inter', sans-serif; font-size: 0.85rem;
          font-weight: 500; margin-bottom: 8px;
          opacity: 0.9;
        }
        .f-title {
          font-family: 'Inter', sans-serif; font-size: 2rem;
          font-weight: 600; margin-bottom: 24px;
          line-height: 1.2;
        }
        .f-shop-btn {
          background: #fff; color: #000 !important;
          padding: 14px 36px; border-radius: 999px;
          font-size: 1rem; font-weight: 600;
          text-decoration: none; border: none; cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
          letter-spacing: -0.01em;
        }
        .f-shop-btn:hover { background: #f0f0f0; }

        /* Featured Grid mobile overrides */
        @media (max-width: 768px) {
          .featured-grid-wrap { 
            padding: 0 !important; 
            margin: 0 !important; 
            width: 100%; height: auto;
            border-radius: 0;
          }
          .featured-grid-header { padding: 40px 24px 24px; }
          .featured-title { font-size: 1.25rem; margin-bottom: 1rem; }
          .featured-container { grid-template-columns: 1fr; gap: 0; }
          .featured-item-v2 { height: 60vh; border-radius: 0; }
          .featured-content { bottom: 32px; }
          .f-title { font-size: 1.6rem; }
          .f-shop-btn { padding: 10px 24px; font-size: 0.85rem; }
        }

        .s3 { background-image: url('/Watch_1.png'); }
        .s1, .s4 { padding: 0 !important; overflow: hidden; position: relative; }

        /* ── Video container ── */
        .iframe-container, .video-container {
          position: absolute; top: 50%; left: 50%;
          width: 100vw; height: 100vh;
          transform: translate(-50%, -50%);
          pointer-events: none; overflow: hidden;
        }
        .iframe-container iframe, .video-container video {
          position: absolute; top: 50%; left: 50%;
          min-width: 100%; min-height: 100%;
          width: auto; height: auto;
          transform: translate(-50%, -50%);
          object-fit: cover;
        }
        .iframe-container {
          height: 56.25vw;
          min-height: 100vh;
          min-width: 177.77vh;
        }

        /* ── Hero center overlay ── */
        .hero-center {
          position: absolute; inset: 0; z-index: 10;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 0 40px;
        }
        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 5vw, 3rem) !important;
          font-weight: 300; color: #2D2D2D;
          margin-bottom: 0.5rem; letter-spacing: 0.1em;
        }
        .hero-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem, 8vw, 6rem) !important;
          font-weight: 400; color: #1A1A1A;
          margin-bottom: 2.5rem; line-height: 1;
        }
        .cta-button {
          background: rgba(45,45,45,0.4);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          color: #000; padding: 18px 48px;
          border-radius: 999px; font-size: 0.9rem;
          font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.2em;
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s ease; cursor: pointer;
        }
        .cta-button:hover {
          background: rgba(45,45,45,0.6);
          transform: translateY(-2px);
        }

        /* ── Story cards ── */
        .card {
          position: relative; z-index: 1; text-align: left;
          padding: clamp(32px, 6vw, 64px) 0;
          max-width: min(640px, 92vw); width: 100%;
          opacity: 0; transform: translateX(-30px);
          transition: opacity 0.7s cubic-bezier(0.2,0,0.2,1),
                      transform 0.7s cubic-bezier(0.2,0,0.2,1);
        }
        .card.in { opacity: 1; transform: translateX(0); }
        .card h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 7vw, 5.2rem);
          font-weight: 300; line-height: 1.1;
          letter-spacing: .04em; color: var(--cream);
          margin-bottom: 22px;
        }
        .card h1 em { font-style: italic; color: var(--gold-light); }
        .card p {
          font-size: clamp(0.65rem, 2vw, 0.78rem);
          font-weight: 300; letter-spacing: .12em;
          line-height: 1.9; color: rgba(245,240,232,.75);
          text-transform: uppercase;
        }

        /* ── Features section ── */
        .features-wrapper {
          height: 100svh; display: flex;
          align-items: center; justify-content: center;
          background: #F9F9F7;
        }
        .features-section {
          display: grid; grid-template-columns: 1fr 1fr;
          width: 90%; height: 80vh;
          border-radius: var(--curve);
          border: 1px solid rgba(0,0,0,0.08);
          overflow: hidden; background: #FFFFFF;
          backdrop-filter: blur(14px); position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.06);
        }
        .features-left {
          padding: 60px; border-right: 1px solid rgba(0,0,0,0.06);
          height: 100%; overflow: hidden; position: relative;
        }
        .feature-items-inner {
          position: absolute; top: 0; left: 0; width: 100%;
          padding: 60px; display: flex; flex-direction: column;
        }
        .feature-item {
          padding: 40px 0; border-bottom: 1px solid rgba(0,0,0,0.06);
          cursor: pointer; transition: all 0.4s; opacity: 0.2;
          padding-left: 20px; position: relative;
        }
        .feature-item.active { opacity: 1; }
        .feature-item h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.2rem, 2.5vw, 2.2rem); color: #111111;
        }
        .features-right { position: relative; height: 100%; overflow: hidden; }
        .image-stack img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: 0;
          transition: opacity 0.6s, transform 0.8s;
          transform: scale(1.05);
        }
        .image-stack img.active { opacity: 1; transform: scale(1); }

        /* ── Section 5 ── */
        .s5 { background-image: none !important; }

        /* ── Flip counter ── */
        .flip-counter-section {
          background: #F2F2EE;
          border-top: 1px solid rgba(0,0,0,0.06);
          padding: 80px 20px;
          display: flex; justify-content: center; align-items: center;
        }
        .flip-digit {
          position: relative; width: 56px; height: 76px;
          background: var(--navy); border-radius: 8px; overflow: hidden;
        }
        .flip-top, .flip-bottom, .flip-flap {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 2.4rem; font-weight: 700; color: #fff;
        }
        .flip-top  { clip-path: inset(0 0 50% 0); }
        .flip-bottom { clip-path: inset(50% 0 0 0); background: #152238; color: #ddd; }
        .flip-flap {
          clip-path: inset(0 0 50% 0); background: var(--navy);
          transform-origin: center; z-index: 3;
          backface-visibility: hidden; transform-style: preserve-3d;
        }
        .flip-flap.animate { animation: flipDown 0.35s forwards; }
        @keyframes flipDown { to { transform: rotateX(-180deg); } }
        .flip-flap::after {
          content: attr(data-next); position: absolute; inset: 0;
          background: #152238; color: #ddd;
          display: flex; justify-content: center; align-items: center;
          transform: rotateX(180deg); backface-visibility: hidden;
          clip-path: inset(50% 0 0 0);
        }
        .flip-digits { display: flex; gap: 4px; }
        .flip-group  { display: flex; gap: 4px; }
        .flip-group + .flip-group { margin-left: 8px; position: relative; }
        .flip-group + .flip-group::before {
          content: ''; position: absolute; left: -6px;
          top: 10%; height: 80%; width: 1px;
          background: rgba(0,0,0,0.1);
        }

        /* ── Gallery (new RAFmarquee) ── */
        .fylex-gallery-section {
          padding: 80px 0 60px;
          background: #F9F9F7;
          border-top: 1px solid rgba(0,0,0,0.06);
          border-radius: var(--curve, 24px) var(--curve, 24px) 0 0;
          overflow: hidden;
        }
        .fylex-gallery-header {
          text-align: center;
          margin-bottom: 52px;
          padding: 0 40px;
        }
        .fylex-gallery-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 400; color: #111111;
          letter-spacing: 0.03em; margin: 0 0 12px;
        }
        .fylex-gallery-header p {
          color: #8A8A8A; font-size: 0.75rem;
          text-transform: uppercase; letter-spacing: 0.15em;
        }
        .fylex-gallery-viewport {
          width: 100%; overflow: hidden;
          cursor: grab; user-select: none;
          -webkit-user-select: none;
          touch-action: pan-y;
          padding: 20px 0 32px;
        }
        .fylex-gallery-viewport:active { cursor: grabbing; }
        .fylex-gallery-track {
          display: flex; gap: 16px;
          width: max-content;
          will-change: transform;
        }
        .fylex-gallery-col {
          display: flex; flex-direction: column;
          gap: 16px; width: 240px;
          flex-shrink: 0; align-self: center;
        }
        .fylex-gallery-item {
          position: relative; border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 8px 24px rgba(0,0,0,0.05);
          transition: transform 0.4s cubic-bezier(0.165,0.84,0.44,1),
                      box-shadow 0.4s cubic-bezier(0.165,0.84,0.44,1);
          background: #eee;
        }
        .fylex-gallery-item img {
          width: 100%; display: block;
          transition: transform 0.7s cubic-bezier(0.165,0.84,0.44,1);
          pointer-events: none; -webkit-user-drag: none;
        }
        .fylex-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.28), transparent);
          opacity: 0; transition: opacity 0.35s;
        }
        .fylex-gallery-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 44px rgba(0,0,0,0.10);
        }
        .fylex-gallery-item:hover img { transform: scale(1.06); }
        .fylex-gallery-item:hover .fylex-overlay { opacity: 1; }

        /* ── Mobile overrides ── */
        @media (max-width: 768px) {
          .features-wrapper {
            height: 100svh; width: 100%;
            display: flex; align-items: center; justify-content: center;
            background: #F9F9F7; position: relative;
          }
          .features-section {
            display: flex; flex-direction: column;
            height: 700px; width: 92vw;
            border-radius: var(--curve-sm); position: relative;
            margin-top: 60px;
          }
          .features-left {
            border-right: none; flex: 1; padding: 30px 20px;
            overflow: hidden; position: relative;
          }
          .feature-items-inner {
            padding: 0 20px; top: 0; position: absolute; width: 100%;
            transition: transform 0.6s cubic-bezier(0.23,1,0.32,1);
          }
          .feature-item { padding: 30px 0; border-bottom: 1px solid rgba(0,0,0,0.06); }
          .feature-item h3 { font-size: 1.4rem; }
          .feature-item p { font-size: 0.8rem; line-height: 1.6; }
          .features-right {
            position: absolute; bottom: 25px; right: 25px;
            width: 150px; height: 150px; z-index: 50; pointer-events: none;
          }
          .image-stack { width: 150px; height: 150px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 15px 40px rgba(0,0,0,0.12); }
          .image-stack img { width: 100%; height: 100%; object-fit: cover; }
          .feature-counter { position: absolute; bottom: -30px; right: 0; font-size: 0.65rem; color: var(--gold); font-weight: 500; }
          /* Gallery mobile */
          .fylex-gallery-section { padding: 60px 0 40px; }
          .fylex-gallery-col { width: 160px; }
          .fylex-gallery-track { gap: 10px; }
          /* Flip counter mobile */
          .flip-digit { width: 32px; height: 48px; border-radius: 4px; }
          .flip-top, .flip-bottom, .flip-flap { font-size: 1.4rem; }
          .flip-digits { gap: 2px; }
          .flip-group + .flip-group::before { left: -4px; }
        }
      `}</style>

      {/* ── Hero Section 1 ── */}
      <div className="section s1" ref={el => { sectionsRef.current[0] = el; }}>
        <div className="video-container">
          <video
            src="/assets/Fylexxx.mp4"
            autoPlay muted loop playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="hero-center">
          <h1 className="hero-title">The <em>Fylex</em></h1>
          <p className="hero-subtitle">A Legacy of Precision</p>
          <Link href="/products">
            <button className="cta-button">Explore Products</button>
          </Link>
        </div>
      </div>

      {/* ── Hero Section 2 ── */}
      <div
        className="section s2"
        style={{ backgroundImage: "url('/Rim.png')" }}
        ref={el => { sectionsRef.current[1] = el; }}
      >
        <div className="card">
          <div className="label">II · Movement</div>
          <h1>The <em>Heart</em> Within</h1>
          <div className="divider"></div>
          <p>
            Hundreds of hand-finished bridges and jewels.<br />
            A calibre beating 28,800 times each hour.
          </p>
        </div>
      </div>

      {/* ── Hero Section 3 ── */}
      <div className="section s3" ref={el => { sectionsRef.current[2] = el; }}>
        <div className="card">
          <div className="label">III · Design</div>
          <h1>Form Follows <em>Time</em></h1>
          <div className="divider"></div>
          <p>
            Sapphire crystal, polished steel, supple leather.<br />
            Every element chosen for eternity, not fashion.
          </p>
        </div>
      </div>

      {/* ── Hero Section 4 (video) ── */}
      <div className="section s4" ref={el => { sectionsRef.current[3] = el; }}>
        <div className="video-container">
          <video
            src="/assets/Fylexx.mp4"
            autoPlay muted loop playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* ── Hero Section 5 (Legacy) ── */}
      <div
        className="section s6"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&q=80&w=1920')" }}
        ref={el => { sectionsRef.current[4] = el; }}
      >
        <div className="card">
          <div className="label">V · Legacy</div>
          <h1>Beyond <em>Generations</em></h1>
          <div className="divider"></div>
          <p>
            A Fylex is not owned — it is entrusted.<br />
            Passed from one steady wrist to the next.
          </p>
        </div>
      </div>

      {/* ── Hero Section 6 (Featured Grid) ── */}
      <div className="section featured-grid-wrap s5" ref={el => { sectionsRef.current[5] = el; }}>
        <div className="featured-grid-header">
          <h2 className="featured-title">Featured</h2>
        </div>
        <div className="featured-container">
          {loadingFeatured ? (
            <>
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              {!isMobile && <ProductSkeleton />}
            </>
          ) : (
            featuredProducts.slice(0, 4).map((p) => (
              <div className="featured-item-v2" key={p.id} style={{ background: p.gradient }}>
                <img src={p.heroImage} alt={p.title} />
                <div className="featured-content" style={{ color: p.textColor }}>
                  <div className="f-label" style={{ color: p.accentColor }}>{p.subtitle}</div>
                  <div className="f-title">{p.title} <em>{p.titleAccent}</em></div>
                  <Link href={`/discover?watch=${p.id}`} className="f-shop-btn" style={{ background: 'transparent', color: p.textColor, border: `1px solid ${p.textColor}` }}>Shop</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Features Section (commented-out in original, preserved here) ── */}
      {/* <div className="features-wrapper" id="featuresWrapper" ref={featuresRef}>
        <section className="features-section" id="features">
          <div className="features-left" ref={featureListRef}>
            <div className="feature-items-inner" ref={featureInnerRef}>
              {features.map((f, i) => (
                <div key={i} className={`feature-item ${i === currentFeat ? 'active' : ''}`} onClick={() => setCurrentFeat(i)}>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="features-right">
            <div className="image-stack">
              {features.map((f, i) => (
                <img key={i} src={f.img} alt={f.title} className={i === currentFeat ? 'active' : ''} />
              ))}
            </div>
            <div className="feature-counter">
              <span>{String(currentFeat + 1).padStart(2, '0')}</span> / {String(features.length).padStart(2, '0')}
            </div>
          </div>
        </section>
      </div> */}

      {/* ── Gallery Section (new smooth RAF marquee) ── */}
      <div ref={galleryRef}>
        <section className="fylex-gallery-section" id="gallery">
          <div className="fylex-gallery-header">
            <h2>The Atelier Chronicles</h2>
            <p>A glimpse into the meticulous craftsmanship that defines our legacy.</p>
          </div>
          <GalleryCarousel />
        </section>
      </div>

      {/* ── Flip Counter Section ── */}
      <section className="flip-counter-section">
        <div className="flip-counter-wrapper">
          {renderFlipCounter()}
          <p style={{
            marginTop: '24px', fontSize: '1rem', color: '#555555',
            textTransform: 'uppercase', textAlign: 'center'
          }}>
            Seconds of watchmaking excellence
          </p>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-10 right-10 text-gold border border-gold-dim w-12 h-12 rounded-full flex items-center justify-center hover:bg-gold hover:text-dark transition-all"
            onClick={() => setLightboxImg(null)}
          >
            ✕
          </button>
          <img
            src={lightboxImg}
            alt="Lightbox"
            className="max-w-[90vw] max-h-[85vh] object-contain border border-gold-dim rounded"
          />
        </div>
      )}
    </div>
  );
};

export default Home;
