"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, EffectCoverflow, Navigation, Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-coverflow';
import 'swiper/css/free-mode';
import { fetchProducts } from '../../../lib/api';
import { useCart } from '@/context/CartContext';
import { getFileUrl } from '@/lib/utils';
import localProductsData from '../../../data/productsData';

function DiscoverContent() {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const watchId = searchParams.get('watch');
  const mode = searchParams.get('mode');
  const isGeneralMode = mode === 'all';

  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollDir, setScrollDir] = useState('up');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeModalData, setActiveModalData] = useState(null);
  const lastScrollY = useRef(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchProducts();
      if (data) {
        const actualData = data.data || (Array.isArray(data) ? data : []);
        const hexToRgb = (hex) => {
          if (!hex) return '196, 163, 90';
          const cleanHex = hex.replace('#', '');
          const r = parseInt(cleanHex.substring(0, 2), 16);
          const g = parseInt(cleanHex.substring(2, 4), 16);
          const b = parseInt(cleanHex.substring(4, 6), 16);
          return `${r}, ${g}, ${b}`;
        };

        const mapped = actualData.map(p => {
            // Main Image Resolution
            let rawHero = p.heroImage || (p.images?.[0]);
            if (!rawHero && p.variants?.length > 0) {
                const vImg = p.variants[0].variantImages?.find(vi => vi.type === 'MAIN')?.media || p.variants[0].variantImages?.[0]?.media;
                rawHero = vImg?.url || (vImg?.fileName ? `/uploads/${vImg.fileName}` : '');
            }
            if (rawHero && !rawHero.startsWith('http') && !rawHero.startsWith('/') && !rawHero.startsWith('data:')) {
                rawHero = `/uploads/${rawHero}`;
            }

            return {
                ...p,
                id: p.id.toString(),
                title: p.name,
                subtitle: p.subtitle || 'Luxury Collection',
                description: p.shortDescription || p.description || '',
                longDesc: p.description || p.shortDescription || 'Experience the pinnacle of watchmaking with our masterfully crafted timepiece.',
                heroImage: getFileUrl(rawHero) || '/assets/fylex-watch-v2/premium.png',
                image: getFileUrl(rawHero) || '/assets/fylex-watch-v2/premium.png',
                theme: p.bgColor || 'champagne',
                accentColor: p.accentColor || '#c4a35a',
                accentRgb: hexToRgb(p.accentColor || '#c4a35a'),
                mistColor: p.mistColor || '',
                mistRgb: hexToRgb(p.mistColor || p.accentColor || '#c4a35a'),
                textColor: p.textColor || '#1a1a1a',
                videoUrl: p.videoUrl || null,
                heritageText: p.heritageText || 'Founded on the principles of precision and timeless elegance, Fylex has been at the forefront of horological innovation for generations.',
                sold: p.soldCount || (p.id % 100) + 120, // Real data or believable placeholder
                totalStock: p.qty || p.stockCount || 500,
                galleryImages: (p.productMedia?.length > 0) 
                    ? p.productMedia.map(m => {
                        let mPath = m.media?.url || (m.media?.fileName ? `/uploads/${m.media.fileName}` : '');
                        return getFileUrl(mPath);
                    }).filter(Boolean)
                    : (p.images || []).map(img => getFileUrl(img.startsWith('http') || img.startsWith('/') ? img : `/uploads/${img}`)),
                combinations: (p.variants || []).map(v => {
                    const vImg = v.variantImages?.find(vi => vi.type === 'MAIN')?.media || v.variantImages?.[0]?.media;
                    let vPath = vImg?.url || vImg?.path || (vImg?.fileName ? `/uploads/${vImg.fileName}` : '');
                    if (vPath && !vPath.startsWith('http') && !vPath.startsWith('/') && !vPath.startsWith('data:')) {
                        vPath = `/uploads/${vPath}`;
                    }
                    return {
                        id: v.id.toString(),
                        name: v.variantAttributes?.map(va => va.attributeValue?.label).join(', ') || v.sku,
                        img: getFileUrl(vPath) || getFileUrl(rawHero) || '/assets/fylex-watch-v2/Olive-green-dial.png'
                    };
                })
            };
        });
        setProductsData(mapped);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 60);

      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setScrollDir('down');
      } else {
        setScrollDir('up');
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const openInfoModal = (p) => {
    const templates = p.combinations || [];
    setActiveModalData({ ...p, combinations: templates });
  };
  const closeInfoModal = () => setActiveModalData(null);
  
  const handleBookNow = () => {
    // Find matching variant based on current configuration
    let targetVariant = null;
    const variants = product.variants || [];
    
    if (hasConfig) {
        targetVariant = variants.find(v => {
            return (v.variantAttributes || []).every(va => {
                const attrName = va.attributeValue?.attribute?.name?.toLowerCase();
                const selectedVal = searchParams.get(attrName);
                return selectedVal === va.attributeValue?.label;
            });
        });
    }

    // Fallback to first variant if no exact match (or if not in config mode)
    if (!targetVariant && variants.length > 0) {
        targetVariant = variants[0];
    }

    if (targetVariant) {
        addToCart(targetVariant.id.toString(), 1, { title: product.title });
    } else {
        // Fallback to adding by productId if no variant exists (Backend handles auto-creation)
        addToCart(null, 1, { title: product.title }, product.id);
    }
  };

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [watchId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div className="loading-state">Initializing Experience...</div>
      </div>
    );
  }

  // Default to first if no watchId is provided or product not found
  const productIndex = productsData.findIndex(p => p.id === watchId);
  const initialIndex = productIndex !== -1 ? productIndex : 0;
  const product = productsData[initialIndex];

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>No Products Available</h2>
          <p style={{ color: '#888', marginBottom: '2rem' }}>We are currently updating our collection. Please check back soon.</p>
          <Link href="/" style={{ color: '#1a1a1a', fontWeight: 600 }}>← Back to Home</Link>
        </div>
      </div>
    );
  }
  // ── DYNAMIC VARIANT MATCHING ──
  const selections = {};
  searchParams.forEach((value, key) => {
    if (key !== 'watch' && key !== 'mode') {
      selections[key.toLowerCase()] = value;
    }
  });

  const matchingVariant = (product.variants || []).find(v => {
    const vAttrs = v.variantAttributes || [];
    if (vAttrs.length === 0) return false;
    return vAttrs.every(va => {
      const attrName = va.attributeValue?.attribute?.name?.toLowerCase();
      return selections[attrName] === va.attributeValue?.label;
    });
  });

  if (matchingVariant) {
    const vMainImg = matchingVariant.variantImages?.find(vi => vi.type === 'MAIN')?.media || matchingVariant.variantImages?.[0]?.media;
    if (vMainImg) {
      let vPath = vMainImg.url || vMainImg.path || (vMainImg.fileName ? `/uploads/${vMainImg.fileName}` : '');
      product.heroImage = getFileUrl(vPath);
      product.image = getFileUrl(vPath);
    }
    
    const vGallery = (matchingVariant.variantImages || [])
      .filter(vi => vi.type === 'GALLERY' || vi.type === 'gallery')
      .map(vi => {
        const m = vi.media;
        const p = m?.url || m?.path || (m?.fileName ? `/uploads/${m.fileName}` : '');
        return getFileUrl(p);
      })
      .filter(Boolean);
    
    if (vGallery.length > 0) {
      product.galleryImages = vGallery;
    }
  }

  const hasConfig = Object.keys(selections).length > 0;
  const materialParam = searchParams.get('material');
  const bezelParam = searchParams.get('bezel');
  const dialParam = searchParams.get('dial');

  // Dynamic config map derived from product variants if possible, with hardcoded fallbacks for featured looks
  const configMap = {
    materials: {
      "Yellow Gold": { img: '/assets/fylex-watch-v2/goldwatch.png', desc: '18 ct yellow gold, our proprietary alloy, offers an unmistakable radiance and a majestic presence on the wrist.' },
      "White Gold": { img: '/assets/fylex-watch-v2/white-gold.png', desc: 'Crafted with 18 ct white gold, this finish provides a discreet yet profound sense of luxury, shimmering with a cold, pure light.' },
      "Everose gold": { img: '/assets/fylex-watch-v2/everose-gold.png', desc: 'Our exclusive 18 ct pink gold alloy, Everose gold, preserves the pink beauty of the watch through years of exposure.' },
      "Premium": { img: '/assets/fylex-watch-v2/premium.png', desc: 'The ultimate expression of our manufacture, the premium finish combines our most rare alloys for a truly one-of-a-kind luster.' }
    },
    bezels: {
      "Fluted": { img: '/assets/fylex-watch-v2/Flutted.png', desc: 'The fluted bezel, a signature mark of distinction, was originally designed for waterproofness but has become a purely aesthetic masterpiece.' },
      "Brilliant Diamond set": { img: '/assets/fylex-watch-v2/brilliant-diamond-set.png', desc: 'Each diamond is meticulously selected and set by hand to ensure a symphony of light and brilliance that captures every gaze.' }
    },
    dials: {
      "Olive Green": { img: '/assets/fylex-watch-v2/Olive-green-dial.png', desc: 'A deep, sunray-finished olive green dial that symbolizes growth and the eternal spirit of the Fylex collection.' },
      "Chocolate": { img: '/assets/fylex-watch-v2/Chocolate-dial.png', desc: 'The rich chocolate brown dial offers a warm, sophisticated contrast to the precious metals of the case and bracelet.' },
      "Meteorite": { img: '/assets/fylex-watch-v2/metoritedial.png', desc: 'Forged in the heart of distant stars, the meteorite dial features unique natural patterns that make your timepiece truly unique.' },
      "Diamond-paved": { img: '/assets/fylex-watch-v2/Diamondpavedial.png', desc: 'A breathtaking landscape of light, the diamond-paved dial is a testament to our gem-setting prowess and dedication to opulence.' }
    }
  };

  // Attempt to find images from actual variants if not in hardcoded map
  const findVariantImg = (attrName, valName) => {
    // Try to find the variant that matches the current selection as closely as possible
    const currentSelections = selections || {};
    const match = (product.variants || []).find(v => {
      const vAttrs = v.variantAttributes || [];
      // Must have the target attribute value
      const hasTarget = vAttrs.some(va => 
        va.attributeValue?.attribute?.name?.toLowerCase() === attrName.toLowerCase() && 
        va.attributeValue?.label === valName
      );
      if (!hasTarget) return false;

      // Try to match other current selections too
      return vAttrs.every(va => {
        const aName = va.attributeValue?.attribute?.name?.toLowerCase();
        if (aName === attrName.toLowerCase()) return true; // already checked
        if (currentSelections[aName]) {
          return va.attributeValue?.label === currentSelections[aName];
        }
        return true;
      });
    });

    const vImg = match?.variantImages?.find(vi => vi.type === 'MAIN')?.media || match?.variantImages?.[0]?.media;
    if (!vImg) return null;
    let vPath = vImg.url || vImg.path || (vImg.fileName ? `/uploads/${vImg.fileName}` : '');
    if (vPath && !vPath.startsWith('http') && !vPath.startsWith('/') && !vPath.startsWith('data:')) {
        vPath = `/uploads/${vPath}`;
    }
    return getFileUrl(vPath);
  };

  return (
    <div className={`cfg-page section-${product.theme}`}>
      <style>{`
        /* ═══════════ CONFIGURE PAGE ═══════════ */
        .cfg-page {
          font-family: 'Inter', sans-serif;
          color: ${product.textColor};
          background: #ffffff;
          overflow-x: hidden;
        }

        /* ── YOUR CHOICES SECTION ── */
        .cfg-choices-section {
          padding: 120px 8%;
          background: #fafaf9;
          border-top: 1px solid #eee;
        }
        .cfg-choices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 60px;
          margin-top: 60px;
        }
        .cfg-choice-card {
          text-align: center;
          transition: transform 0.4s ease;
        }
        .cfg-choice-card:hover { transform: translateY(-10px); }
        .cfg-choice-img-wrap {
          background: #fff;
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 30px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 320px;
        }
        .cfg-choice-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.1));
        }
        .cfg-choice-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #c4a35a;
          margin-bottom: 15px;
          display: block;
        }
        .cfg-choice-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          margin-bottom: 20px;
          color: #1a1a1a;
        }
        .cfg-choice-desc {
          font-size: 0.95rem;
          line-height: 1.7;
          color: #666;
          max-width: 280px;
          margin: 0 auto;
        }

        /* ── TOP RIGHT CTA (Navbar-like) ── */
        .cfg-top-right-cta {
          position: fixed;
          top: 90px;
          right: 40px;
          z-index: 2000;
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s;
        }
        .cfg-top-right-cta.hidden {
          transform: translateY(-100px);
          opacity: 0;
          pointer-events: none;
        }
        .cfg-cta-pill {
          display: inline-block;
          padding: 10px 24px;
          background: #1a1a1a;
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border-radius: 999px;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border: 1px solid #1a1a1a;
          pointer-events: auto;
        }
        .cfg-cta-pill:hover {
          background: #c4a35a;
          border-color: #c4a35a;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(196, 163, 90, 0.2);
        }

        /* ═══ HERO SECTION ═══ */
        .cfg-hero {
          min-height: 100vh;
          background: ${product.gradient || product.bgColor};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          padding: 120px 20px 80px;
          overflow: hidden;
        }
        .cfg-hero::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(to top, #ffffff, transparent);
          pointer-events: none;
        }
        .cfg-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 400;
          margin: 0 0 10px;
          line-height: 1.05;
          opacity: ${isScrolled ? 0 : 1};
          transform: translateY(${isScrolled ? '-30px' : '0'});
          transition: opacity 0.5s, transform 0.5s;
        }
        .cfg-hero-accent {
          font-style: italic;
          opacity: 0.5;
          display: block;
          font-size: 0.45em;
          letter-spacing: 0.15em;
        }
        .cfg-hero-subtitle {
          font-size: 0.85rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: ${product.accentColor};
          font-weight: 600;
          margin-bottom: 30px;
          opacity: ${isScrolled ? 0 : 1};
          transition: opacity 0.5s;
        }
        .cfg-hero-image {
          width: 100%;
          max-width: 550px;
          filter: drop-shadow(0 30px 60px rgba(0,0,0,0.12));
          position: relative;
          z-index: 5;
        }

        /* ── TOP SWIPER ── */
        .cfg-top-swiper {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }
        .cfg-top-swiper .swiper-button-next,
        .cfg-top-swiper .swiper-button-prev {
          color: #1a1a1a;
          background: rgba(255,255,255,0.5);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          backdrop-filter: blur(10px);
        }

        /* ── DESCRIPTION SECTION ── */
        .cfg-desc-section {
          padding: 100px 8%;
          max-width: 100%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          background: #000;
          position: relative;
          overflow: hidden;
        }
        .cfg-mist-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .cfg-desc-eyebrow {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${product.accentColor};
          margin-bottom: 24px;
        }
        .cfg-desc-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          margin: 0 0 30px;
          line-height: 1.2;
          color: #ffffff;
        }
        .cfg-desc-text {
          font-size: 1.15rem;
          line-height: 1.9;
          color: #eeeeee;
          font-weight: 300;
        }
        .cfg-desc-img {
          width: 100%;
          max-width: 450px;
          filter: drop-shadow(0 20px 50px rgba(0,0,0,0.1));
        }

        /* ═══ VIDEO SECTION ═══ */
        .cfg-video-section {
          padding: 40px 8% 100px;
        }
        .cfg-video-wrap {
          max-width: 1000px;
          margin: 0 auto;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.1);
          aspect-ratio: 16/9;
        }

        /* ═══ SWIPER CAROUSEL ═══ */
        .cfg-swiper-section {
          padding: 80px 0;
          background: ${product.bgColor};
        }
        .cfg-swiper-title {
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          margin-bottom: 50px;
        }
        .cfg-swiper-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .cfg-swiper-container .swiper-slide {
          width: 420px;
          height: 415px;
          transition: transform 0.4s ease, opacity 0.4s ease;
          opacity: 0.4;
          transform: scale(0.7);
        }
        .cfg-swiper-container .swiper-slide-active {
          opacity: 1;
          transform: scale(1);
          z-index: 10;
        }
        .cfg-slide-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
          background: #fff;
        }
        .cfg-swiper-container .swiper-pagination {
          position: relative;
          margin-top: 50px;
          bottom: 0 !important;
        }
        .cfg-swiper-container .swiper-pagination-bullet {
          width: 50px;
          height: 4px;
          border-radius: 4px;
          background: #ccc;
          opacity: 0.5;
          margin: 0 6px !important;
          transition: all 0.4s ease;
        }
        .cfg-swiper-container .swiper-pagination-bullet-active {
          width: 80px;
          opacity: 1;
          background: ${product.accentColor};
        }

        /* ═══ HERITAGE / FINAL TEXT ═══ */
        .cfg-heritage-section {
          padding: 100px 8%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 60px;
          align-items: center;
        }
        .cfg-heritage-left {
          max-width: 500px;
        }
        .cfg-heritage-right {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }
        .cfg-sold-stats {
          background: #ffffff;
          color: #1a1a1a;
          padding: 50px 60px;
          border-radius: 24px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s;
          box-shadow: 0 20px 50px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 520px;
          border: none;
          z-index: 1;
        }
        /* ── Animated rotating gradient border ── */
        .cfg-sold-stats::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 26px;
          background: conic-gradient(
            from var(--border-angle, 0deg),
            ${product.accentColor},
            rgba(196,163,90,0.15),
            ${product.accentColor}44,
            rgba(255,255,255,0.3),
            ${product.accentColor}
          );
          z-index: -2;
          animation: borderSpin 4s linear infinite;
        }
        /* ── Inner fill to "cut out" the border ── */
        .cfg-sold-stats::after {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 22px;
          background: linear-gradient(155deg, #ffffff 0%, #fdfcfa 50%, #fff 100%);
          z-index: -1;
        }
        @property --border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes borderSpin {
          to { --border-angle: 360deg; }
        }
        /* ── Shimmer light sweep ── */
        .cfg-sold-stats .shimmer-sweep {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          animation: shimmerSweep 3.5s ease-in-out infinite;
          z-index: 3;
          pointer-events: none;
        }
        @keyframes shimmerSweep {
          0%   { left: -100%; }
          50%  { left: 150%; }
          100% { left: 150%; }
        }
        .cfg-sold-stats > * {
          position: relative;
          z-index: 4;
        }
        .cfg-sold-stats:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 35px 70px rgba(0,0,0,0.14), 0 0 30px ${product.accentColor}22;
        }
        .stats-numbers {
          display: block;
          font-family: 'Playfair Display', serif;
          font-size: 4rem;
          margin-bottom: 16px;
          color: ${product.accentColor};
          line-height: 1;
          animation: softPulse 3s ease-in-out infinite;
        }
        @keyframes softPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        .stats-label {
          font-size: 0.9rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #1a1a1a;
          font-weight: 600;
          margin-bottom: 12px;
          display: block;
        }
        .stats-description {
          font-size: 1rem;
          line-height: 1.6;
          color: #666;
          font-weight: 300;
          margin: 0;
        }
        .cfg-heritage-eyebrow {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${product.accentColor};
          margin-bottom: 24px;
          display: block;
        }
        .cfg-heritage-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          margin: 0 0 30px;
          line-height: 1.2;
        }
        .cfg-heritage-text {
          font-size: 1.15rem;
          line-height: 1.9;
          color: #555;
          font-weight: 300;
        }

        /* ═══════════ LIGHT/ELEGANT MODAL STYLES ═══════════ */
        .cfg-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .cfg-modal-overlay.show {
          opacity: 1;
          visibility: visible;
        }
        .cfg-modal-box {
          background: #ffffff;
          border: 1px solid #eaeaea;
          width: 100%;
          max-width: 480px;
          height: 750px;
          max-height: 90vh;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px rgba(0,0,0,0.12);
          transform: translateY(20px);
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          overflow: hidden;
        }
        .cfg-modal-overlay.show .cfg-modal-box {
          transform: translateY(0);
        }
        .cfg-modal-header {
          padding: 24px 30px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafaf9;
        }
        .cfg-modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.35rem;
          font-weight: 500;
          color: #1a1a1a;
          margin: 0;
        }
        .cfg-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #999;
          transition: color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }
        .cfg-modal-close:hover {
          color: #1a1a1a;
        }
        .cfg-modal-content {
          flex: 1;
          overflow-y: scroll; /* Force scrollbar */
          padding: 0;
          overscroll-behavior: contain;
          min-height: 0;
          -webkit-overflow-scrolling: touch;
        }
        .cfg-modal-content::-webkit-scrollbar {
          width: 8px;
        }
        .cfg-modal-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-left: 1px solid #eaeaea;
        }
        .cfg-modal-content::-webkit-scrollbar-thumb {
          background-color: #c1c1c1;
          border-radius: 4px;
        }
        .cfg-modal-content::-webkit-scrollbar-thumb:hover {
          background-color: #a8a8a8;
        }
        .cfg-combo-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px 30px;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.3s;
        }
        .cfg-combo-item:hover {
          background: #fdfdfc;
        }
        .cfg-combo-num {
          font-size: 0.75rem;
          font-weight: 600;
          color: #888;
          letter-spacing: 0.1em;
          min-width: 40px;
        }
        .cfg-combo-img-wrap {
          width: 66px;
          height: 66px;
          background: #f9f9f9;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cfg-combo-img-wrap img {
          width: 80%;
          height: 80%;
          object-fit: contain;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.06));
        }
        .cfg-combo-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cfg-combo-name {
          font-size: 0.9rem;
          color: #1a1a1a;
          line-height: 1.5;
          font-weight: 500;
        }
        .cfg-combo-status {
          font-size: 0.75rem;
          color: ${product.accentColor};
          font-weight: 500;
        }

        /* ═══ RESPONSIVE FIXES ═══ */
        @media (max-width: 900px) {
          .cfg-desc-section {
            grid-template-columns: 1fr;
            text-align: left;
            padding: 60px 8%;
          }
          .cfg-desc-img-wrap {
            display: flex;
            justify-content: center;
            margin-top: 10px;
          }
          .cfg-desc-img {
            max-width: 400px !important;
            width: 90% !important;
          }
          .cfg-heritage-section {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .cfg-heritage-right {
            justify-content: flex-start;
          }
        }

        /* GLOBAL: Organic Layered "Aura" Gradients (No 50-50 Split) */
        .section-soft-green .cfg-swiper-section {
          background: 
            radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(6, 78, 59, 0.2) 0%, transparent 60%),
            #010e0a;
          color: #fff;
        }
        .section-soft-green .cfg-swiper-title { color: #fff; }

        .section-mist-blue .cfg-swiper-section {
          background: 
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(30, 58, 138, 0.2) 0%, transparent 60%),
            #020617;
          color: #fff;
        }
        .section-mist-blue .cfg-swiper-title { color: #fff; }

        .section-champagne .cfg-swiper-section {
          background: 
            radial-gradient(circle at 20% 30%, rgba(217, 119, 6, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(69, 26, 3, 0.2) 0%, transparent 60%),
            #0c0501;
          color: #fff;
        }
        .section-champagne .cfg-swiper-title { color: #fff; }

        .section-pearl-silver .cfg-swiper-section {
          background: 
            radial-gradient(circle at 20% 30%, rgba(148, 163, 184, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(15, 23, 42, 0.2) 0%, transparent 60%),
            #030712;
          color: #fff;
        }
        .section-pearl-silver .cfg-swiper-title { color: #fff; }

        .section-rose-burgundy .cfg-swiper-section {
          background: 
            radial-gradient(circle at 20% 30%, rgba(239, 68, 68, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(69, 10, 10, 0.2) 0%, transparent 60%),
            #0f0202;
          color: #fff;
        }
        .section-rose-burgundy .cfg-swiper-title { color: #fff; }
        
        .cfg-book-btn {
          background: #1a1a1a;
          color: #fff;
          padding: 18px 48px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          margin-top: 40px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .cfg-book-btn:hover {
          background: #c4a35a;
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(196, 163, 90, 0.3);
        }
        .cfg-book-btn svg {
          transition: transform 0.3s;
        }
        .cfg-book-btn:hover svg {
          transform: translateX(5px);
        }
      `}</style>

      {/* ── TOP-RIGHT CTA ── */}
      <div className={`cfg-top-right-cta ${scrollDir === 'down' && isScrolled ? 'hidden' : ''}`}>
        {product.productType === 'simple' ? (
          <button onClick={handleBookNow} className="cfg-cta-pill">Book Now</button>
        ) : (
          <Link href={`/configure?watch=${product.id}`} className="cfg-cta-pill">Configure</Link>
        )}
      </div>

      <div className="cfg-content-wrapper">
        <section className="cfg-hero" ref={heroRef}>
          {isGeneralMode ? (
            <div className="cfg-top-swiper">
              <Swiper
                modules={[Navigation, Pagination, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                navigation={true}
                pagination={{ clickable: true }}
                initialSlide={initialIndex}
                onSlideChange={(swiper) => {
                  const newProduct = productsData[swiper.activeIndex];
                  const params = new URLSearchParams(searchParams);
                  params.set('watch', newProduct.id);
                  window.history.replaceState(null, '', `?${params.toString()}`);
                }}
                style={{ width: '100%', height: 'auto' }}
              >
                {productsData.map((p) => (
                  <SwiperSlide key={p.id}>
                    <span className="cfg-hero-subtitle">{p.subtitle}</span>
                    <h1 className="cfg-hero-title">
                      {p.title}
                      <span className="cfg-hero-accent">{p.titleAccent}</span>
                    </h1>
                    <img src={p.heroImage} alt={p.title} className="cfg-hero-image" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <>
              <span className="cfg-hero-subtitle">{product.subtitle}</span>
              <h1 className="cfg-hero-title">
                {product.title}
                <span className="cfg-hero-accent">{product.titleAccent}</span>
              </h1>
              <img src={product.heroImage} alt={product.title} className="cfg-hero-image" />
            </>
          )}
        </section>

        {/* ── NEW YOUR CHOICES SECTION ── */}
        {hasConfig && (
          <section className="cfg-choices-section">
            <div style={{ textAlign: 'center' }}>
              <span className="cfg-desc-eyebrow">Your Custom Piece</span>
              <h2 className="cfg-desc-heading" style={{ color: '#1a1a1a' }}>Refining the Infinite</h2>
            </div>

            <div className="cfg-choices-grid">
              {Object.keys(selections).map(key => {
                const val = selections[key];
                const vPath = findVariantImg(key, val);
                return (
                  <div key={key} className="cfg-choice-card">
                    <div className="cfg-choice-img-wrap">
                      <img src={vPath || product.image} alt={val} className="cfg-choice-img" />
                    </div>
                    <span className="cfg-choice-label" style={{ textTransform: 'capitalize' }}>{key}</span>
                    <h3 className="cfg-choice-name">{val}</h3>
                    <p className="cfg-choice-desc">
                      {configMap.materials[val]?.desc || 
                       configMap.bezels[val]?.desc || 
                       configMap.dials[val]?.desc || 
                       `Premium ${key} selection crafted with absolute precision for a superior timepiece experience.`}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
                <button onClick={handleBookNow} className="cfg-book-btn">
                    Book This Configuration
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
            </div>
          </section>
        )}

        {!hasConfig ? (
          <section className="cfg-desc-section" style={{
            background: product.gradient || `
              radial-gradient(circle at 10% 10%, rgba(${product.accentRgb}, 0.15) 0%, transparent 40%),
              radial-gradient(circle at 90% 90%, rgba(${product.accentRgb}, 0.1) 0%, transparent 40%),
              linear-gradient(135deg, #000000 0%, #050505 50%, #000000 100%)
            `
          }}>
            <div className="cfg-mist-layer" style={{
              background: `radial-gradient(circle at 70% 40%, rgba(${product.mistRgb}, 0.2) 0%, transparent 70%)`
            }}></div>
            <div className="cfg-desc-content" style={{ position: 'relative', zIndex: 2 }}>
              <span className="cfg-desc-eyebrow">About This Timepiece</span>
              <h2 className="cfg-desc-heading">Crafted for the Extraordinary</h2>
              <p className="cfg-desc-text">{product.longDesc}</p>
            </div>
            <div className="cfg-desc-img-wrap" style={{ position: 'relative', zIndex: 2 }}>
              <img src={product.heroImage} alt={product.title} className="cfg-desc-img" />
            </div>
          </section>
        ) : (
          <section className="cfg-desc-section" style={{
            background: product.gradient || 'radial-gradient(circle at 10% 10%, rgba(255, 45, 117, 0.08) 0%, transparent 40%), linear-gradient(135deg, #ffffff 0%, #fff0f5 100%)'
          }}>
            <div className="cfg-mist-layer" style={{
              background: `radial-gradient(circle at 70% 40%, rgba(${product.mistRgb}, 0.15) 0%, transparent 70%)`
            }}></div>
            <div className="cfg-desc-content" style={{ position: 'relative', zIndex: 2 }}>
              <span className="cfg-desc-eyebrow" style={{ color: '#c4a35a' }}>Your Masterpiece</span>
              <h2 className="cfg-desc-heading" style={{ color: '#1a1a1a' }}>The Result of Your Craft</h2>
              <p className="cfg-desc-text" style={{ color: '#444' }}>
                Your selected configuration–a {materialParam} timepiece with a {bezelParam} bezel and a {dialParam} dial–is a true reflection
                of excellence and personal style. This unique combination merges the finest materials with our artisanal heritage,
                creating a piece that is as distinctive as it is timeless. Discover the precision of Fylex, now personalized by you.
              </p>
            </div>
            <div className="cfg-desc-img-wrap">
              <img src={product.heroImage} alt={product.title} className="cfg-desc-img" />
            </div>
          </section>
        )}

        {product.videoUrl && (
          <section className="cfg-video-section">
            <div className="cfg-video-wrap">
              <video
                src={product.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </section>
        )}

        <section className="cfg-swiper-section">
          <h2 className="cfg-swiper-title">The Gallery</h2>
          <div className="cfg-swiper-container">
            <Swiper
              modules={[EffectCoverflow, Pagination, FreeMode]}
              effect="coverflow"
              grabCursor={true}
              centeredSlides={true}
              slidesPerView="auto"
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 120,
                modifier: 2.5,
                slideShadows: false,
              }}
              pagination={{ clickable: true }}
              loop={true}
              freeMode={true}
            >
              {product.galleryImages?.map((img, i) => (
                <SwiperSlide key={i}>
                  <img src={img} alt={`${product.title} Gallery ${i + 1}`} className="cfg-slide-img" />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        <section className="cfg-heritage-section">
          <div className="cfg-heritage-left">
            <span className="cfg-heritage-eyebrow">Heritage & Legacy</span>
            <h2 className="cfg-heritage-heading">A Story Written in Time</h2>
            <p className="cfg-heritage-text">{product.heritageText}</p>
          </div>
          <div className="cfg-heritage-right">
            <div className="cfg-sold-stats" onClick={() => openInfoModal(product)}>
              <span className="shimmer-sweep"></span>
              <span className="stats-numbers">{product.sold}/{product.totalStock}</span>
              <span className="stats-label">Configurations Sold</span>
              <p className="stats-description">Explore the unique combinations and personalized touches chosen by our discerning clients around the globe. Click to view the registry.</p>
            </div>
          </div>
        </section>
      </div>

      {/* ═══ ELEGANT LIGHT INFO MODAL ═══ */}
      <div className={`cfg-modal-overlay ${activeModalData ? 'show' : ''}`} onClick={closeInfoModal}>
        <div className="cfg-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="cfg-modal-header">
            <h3 className="cfg-modal-title">Sold Configurations</h3>
            <button className="cfg-modal-close" onClick={closeInfoModal}>✕</button>
          </div>
          <div className="cfg-modal-content" data-lenis-prevent="true" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
            {activeModalData?.combinations?.length > 0 ? (
              activeModalData.combinations.map((combo) => (
                <div key={combo.id} className="cfg-combo-item">
                  <span className="cfg-combo-num">#{combo.id}</span>
                  <div className="cfg-combo-img-wrap">
                    <img src={combo.img} alt={`Combo ${combo.id}`} />
                  </div>
                  <div className="cfg-combo-details">
                    <span className="cfg-combo-name">{combo.name}</span>
                    <span className="cfg-combo-status">Exclusive Build</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '60px 40px', textAlign: 'center', color: '#888', fontSize: '0.95rem' }}>
                No configurations have been registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Discover() {
  return (
    <Suspense fallback={<div>Loading Discovery...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
