"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { useWishlist } from '@/context/WishlistContext';
import { getFileUrl } from '@/lib/utils';
import localProductsData from '../../../data/productsData';

function DiscoverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const watchId = searchParams.get('watch');
  const mode = searchParams.get('mode');
  const isGeneralMode = mode === 'all';

  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollDir, setScrollDir] = useState('up');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeModalData, setActiveModalData] = useState(null);
  const [activeSpecGroup, setActiveSpecGroup] = useState(null);
  const [activeSection, setActiveSection] = useState('hero');
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
                        img: getFileUrl(vPath) || getFileUrl(rawHero) || '/assets/fylex-watch-v2/Olive-green-dial.png',
                        attributes: v.variantAttributes?.map(va => ({
                            name: va.attributeValue?.attribute?.name?.toLowerCase(),
                            value: va.attributeValue?.label
                        })) || []
                    };
                }),
                specs: (p.specifications || []).reduce((acc, s) => {
                    const gName = s.specification?.groups?.[0]?.group?.name || 'Technical Specifications';
                    if (!acc[gName]) acc[gName] = [];
                    acc[gName].push({
                        label: s.specification?.name,
                        value: s.value
                    });
                    return acc;
                }, {})
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

  // Intersection Observer for Section Pagination
  useEffect(() => {
    if (loading) return;

    const sections = ['hero', 'description', 'specs', 'heritage'];
    const observerOptions = {
      root: null,
      rootMargin: '-49% 0px -49% 0px',
      threshold: 0
    };

    const handleIntersect = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    
    // We need a small timeout to ensure the DOM is fully ready after loading
    const timeoutId = setTimeout(() => {
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [loading, watchId]); // Re-run on watch change as sections might re-render
  const openInfoModal = (p) => {
    const templates = p.combinations || [];
    setActiveModalData({ ...p, combinations: templates });
  };
  const closeInfoModal = () => setActiveModalData(null);
  
  const handleComboClick = (combo) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeModalData?.id) {
        params.set('watch', activeModalData.id);
    }
    (combo.attributes || []).forEach(attr => {
        if (attr.name && attr.value) {
            params.set(attr.name, attr.value);
        }
    });
    router.push(`?${params.toString()}`);
    closeInfoModal();
  };
  
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
          padding: 8px 16px;
          background: #1a1a1a;
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border-radius: 999px;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border: 1px solid #1a1a1a;
          pointer-events: auto;
        }
        .cfg-cta-pill:hover, .cfg-cta-pill:active {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .cfg-book-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: #1a1a1a;
          color: #fff;
          border: 1px solid #1a1a1a;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .cfg-book-btn:hover, .cfg-book-btn:active {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        /* ═══ NEW PREMIUM HERO ═══ */
        .cfg-hero {
          min-height: 100vh;
          background: radial-gradient(circle at center, #ffffff 0%, #e8edf3 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 80px 40px;
          overflow: hidden;
        }
        
        .cfg-hero-aura {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
          z-index: 1;
          pointer-events: none;
        }

        .cfg-hero-image {
          width: 100%;
          max-width: 500px;
          filter: drop-shadow(0 30px 60px rgba(0,0,0,0.12));
          position: relative;
          z-index: 5;
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* Top Left Favourites */
        .cfg-fav-toggle {
          position: absolute;
          top: 94px; /* Aligned with Configure button */
          left: 40px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          color: #006039; /* Rolex green */
          font-weight: 500;
          font-size: 14px;
          transition: opacity 0.3s;
        }
        .cfg-fav-toggle:hover { opacity: 0.8; }
        .cfg-fav-toggle svg { width: 22px; height: 22px; fill: currentColor; }

        /* Bottom Left Details */
        .cfg-details-box {
          position: absolute;
          bottom: 60px;
          left: 40px;
          z-index: 100;
          text-align: left;
          max-width: 400px;
        }
        .cfg-details-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .cfg-details-specs {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 2px;
          font-weight: 300;
        }
        .cfg-details-ref {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 15px;
          font-weight: 300;
        }
        .cfg-details-price {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cfg-info-icon {
          width: 16px;
          height: 16px;
          border: 1px solid #1a1a1a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }

        /* Middle Right Variations */
        .cfg-variations-btn {
          position: absolute;
          right: 40px;
          top: 58%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .cfg-variations-btn:hover {
            transform: translateY(-52%);
        }
        .cfg-var-thumb {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #eee;
          padding: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cfg-var-thumb img { width: 90%; height: 90%; object-fit: contain; }
        .cfg-var-label {
          font-size: 10px;
          font-weight: 700;
          color: #1a1a1a;
          text-transform: none;
          letter-spacing: 0.02em;
        }

        /* Far Right Vertical Nav */
        .cfg-vert-nav {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cfg-nav-dash {
          width: 3px;
          height: 16px;
          background: #ddd;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          cursor: pointer;
        }
        .cfg-nav-dash:hover { background: #bbb; }
        .cfg-nav-dash.active {
          height: 32px;
          background: #666;
        }

        /* ═══ PAGE VERTICAL PAGINATION ═══ */
        .cfg-page-pagination {
          position: fixed;
          right: 35px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        .cfg-pagination-bar {
          width: 4px;
          height: 40px;
          background: #d1d5db;
          border-radius: 2px;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          cursor: pointer;
          position: relative;
        }
        .cfg-pagination-bar:hover {
          background: #bbb;
        }
        .cfg-pagination-bar.active {
          height: 100px;
          background: #1a1a1a;
        }
        /* Mobile adjustment */
        @media (max-width: 768px) {
          .cfg-page-pagination {
            right: 15px;
            gap: 8px;
          }
          .cfg-pagination-bar {
            width: 3px;
            height: 25px;
          }
          .cfg-pagination-bar.active {
            height: 60px;
          }
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
          cursor: pointer;
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

        /* Technical Details Section Styles */
        .cfg-specs-section {
          padding: 20px 0;
          background: #fff;
          color: #1a1a1a;
          position: relative;
        }
        .cfg-specs-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .cfg-specs-header {
          margin-bottom: 80px;
          max-width: 800px;
        }
        .cfg-specs-title {
          font-family: 'Outfit', sans-serif;
          font-size: 3rem;
          line-height: 1.1;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1a1a1a;
          letter-spacing: -0.02em;
        }
        .cfg-specs-title span {
          color: #006039;
          display: block;
        }
        .cfg-specs-ref {
          font-size: 1.1rem;
          color: #1a1a1a;
          font-weight: 500;
          opacity: 0.8;
          margin-top: 20px;
        }
        .cfg-specs-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 120px;
          align-items: start;
        }
        .cfg-specs-img-wrap {
          position: sticky;
          top: 150px;
          display: flex;
          justify-content: center;
        }
        .cfg-specs-img {
          width: 90%;
          height: auto;
          filter: drop-shadow(0 40px 80px rgba(0,0,0,0.12));
        }
        .cfg-spec-accordion {
          border-top: 1px solid #e5e5e5;
        }
        .cfg-spec-item {
          border-bottom: 1px solid #e5e5e5;
        }
        .cfg-spec-trigger {
          width: 100%;
          padding: 15px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s;
        }
        .cfg-spec-group-name {
          font-family: 'Outfit', sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #1a1a1a;
        }
        .cfg-spec-icon {
          width: 14px;
          height: 14px;
          position: relative;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cfg-spec-icon::before,
        .cfg-spec-icon::after {
          content: '';
          position: absolute;
          background: #1a1a1a;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .cfg-spec-icon::before {
          width: 100%;
          height: 2px;
        }
        .cfg-spec-icon::after {
          width: 2px;
          height: 100%;
          transition: transform 0.4s;
        }
        .cfg-spec-item.active .cfg-spec-icon {
          transform: rotate(135deg);
        }
        .cfg-spec-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cfg-spec-item.active .cfg-spec-content {
          max-height: 1200px;
        }
        .cfg-spec-inner {
          padding-bottom: 20px;
        }
        .cfg-spec-row {
          display: flex;
          justify-content: space-between;
          padding: 18px 0;
          font-size: 1.1rem;
          border-bottom: 1px solid #f5f5f5;
        }
        .cfg-spec-row:last-child {
          border-bottom: none;
        }
        .cfg-spec-label {
          color: #1a1a1a;
          font-weight: 600;
          width: 40%;
        }
        .cfg-spec-value {
          color: #444;
          text-align: left;
          width: 55%;
          line-height: 1.5;
        }

        @media (max-width: 1024px) {
          .cfg-specs-grid {
            grid-template-columns: 1fr;
            gap: 60px;
          }
          .cfg-specs-img-wrap {
            position: relative;
            top: 0;
            order: -1;
          }
          .cfg-specs-title {
            font-size: 2rem;
          }
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

      <div className="cfg-page-pagination">
        {['hero', 'description', 'specs', 'heritage'].map((id) => (
          <div
            key={id}
            className={`cfg-pagination-bar ${activeSection === id ? 'active' : ''}`}
            onClick={() => {
              const el = document.getElementById(id);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        ))}
      </div>

      <div className="cfg-content-wrapper">
        <section id="hero" className="cfg-hero" ref={heroRef}>
          <div className="cfg-hero-aura"></div>
          
          {/* Top Left Favourites */}
          <div className="cfg-fav-toggle" onClick={() => toggleWishlist(product)}>
            <svg viewBox="0 0 24 24">
              <path d={isInWishlist(product.id) ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"} />
            </svg>
            <span>{isInWishlist(product.id) ? 'Remove from favourites' : 'Add to favourites'}</span>
          </div>

          {/* Bottom Left Details */}
          <div className="cfg-details-box">
            <h1 className="cfg-details-title">{product.title}</h1>
            <p className="cfg-details-specs">{product.subtitle}</p>
            <p className="cfg-details-ref">Reference {product.referenceNumber || product.id.slice(0, 6)}</p>
            <div className="cfg-details-price">
              ₹ {product.price?.toLocaleString() || '7,838,000'}
              <div className="cfg-info-icon">i</div>
            </div>
          </div>

          {/* Center Watch Image */}
          <img src={product.heroImage} alt={product.title} className="cfg-hero-image" />

          {/* Middle Right Variations */}
          {product.combinations?.length > 0 && (
            <div className="cfg-variations-btn" onClick={() => openInfoModal(product)}>
              <div className="cfg-var-thumb">
                <img src={product.combinations[0].img} alt="Variation" />
              </div>
              <span className="cfg-var-label">View variations</span>
            </div>
          )}

          {/* Far Right Vertical Nav */}
          {isGeneralMode && (
            <div className="cfg-vert-nav">
              {productsData.map((p, idx) => (
                <div 
                  key={p.id} 
                  className={`cfg-nav-dash ${initialIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('watch', p.id);
                    router.push(`?${params.toString()}`, { scroll: false });
                  }}
                />
              ))}
            </div>
          )}
        </section>


        {!hasConfig ? (
          <section id="description" className="cfg-desc-section" style={{
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
              <img src={product.galleryImages?.[0] || product.heroImage} alt={product.title} className="cfg-desc-img" />
            </div>
          </section>
        ) : (
          <section id="description" className="cfg-desc-section" style={{
            background: product.gradient || 'radial-gradient(circle at 10% 10%, rgba(255, 45, 117, 0.08) 0%, transparent 40%), linear-gradient(135deg, #ffffff 0%, #fff0f5 100%)'
          }}>
            <div className="cfg-mist-layer" style={{
              background: `radial-gradient(circle at 70% 40%, rgba(${product.mistRgb}, 0.15) 0%, transparent 70%)`
            }}></div>
            <div className="cfg-desc-content" style={{ position: 'relative', zIndex: 2 }}>
              <span className="cfg-desc-eyebrow" style={{ color: '#c4a35a' }}>Your Masterpiece</span>
              <h2 className="cfg-desc-heading" style={{ color: '#1a1a1a' }}>The Result of Your Craft</h2>
              <p className="cfg-desc-text" style={{ color: '#444' }}>
                {product.longDesc}
              </p>
            </div>
            <div className="cfg-desc-img-wrap">
              <img src={product.galleryImages?.[0] || product.heroImage} alt={product.title} className="cfg-desc-img" />
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
        {/* ── TECHNICAL DETAILS SECTION ── */}
        <section id="specs" className="cfg-specs-section">
          <div className="cfg-specs-container">
            <div className="cfg-specs-header">
              <h2 className="cfg-specs-title">
                More {product.title}
                <span>technical details</span>
              </h2>
              <p className="cfg-specs-ref">Reference {product.referenceNumber || product.id.slice(0, 6)}</p>
            </div>

            <div className="cfg-specs-grid">
              <div className="cfg-specs-img-wrap">
                <img src={product.galleryImages?.[1] || product.galleryImages?.[0] || product.heroImage} alt={product.title} className="cfg-specs-img" />
              </div>

              <div className="cfg-spec-accordion">
                {Object.keys(product.specs || {}).map((groupName, idx) => (
                  <div key={groupName} className={`cfg-spec-item ${activeSpecGroup === groupName ? 'active' : ''}`}>
                    <button 
                      className="cfg-spec-trigger"
                      onClick={() => setActiveSpecGroup(activeSpecGroup === groupName ? null : groupName)}
                    >
                      <span className="cfg-spec-group-name">{groupName}</span>
                      <div className="cfg-spec-icon"></div>
                    </button>
                    <div className="cfg-spec-content">
                      <div className="cfg-spec-inner">
                        {(product.specs[groupName] || []).map((spec, sIdx) => (
                          <div key={sIdx} className="cfg-spec-row">
                            <span className="cfg-spec-label">{spec.label}</span>
                            <span className="cfg-spec-value">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="heritage" className="cfg-heritage-section">
          <div className="cfg-heritage-left">
            <span className="cfg-heritage-eyebrow">Heritage & Legacy</span>
            <h2 className="cfg-heritage-heading">A Story Written in Time</h2>
            <p className="cfg-heritage-text">{product.heritageText}</p>
          </div>
          <div className="cfg-heritage-right">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'flex-end', width: '100%' }}>
              {product.galleryImages?.[2] && (
                <img 
                  src={product.galleryImages[2]} 
                  alt="Heritage" 
                  style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.1))' }} 
                />
              )}
              <div className="cfg-sold-stats" onClick={() => openInfoModal(product)}>
                <span className="shimmer-sweep"></span>
                <span className="stats-numbers">{product.sold}/{product.totalStock}</span>
                <span className="stats-label">Configurations Sold</span>
                <p className="stats-description">Explore the unique combinations and personalized touches chosen by our discerning clients around the globe. Click to view the registry.</p>
              </div>
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
                <div key={combo.id} className="cfg-combo-item" onClick={() => handleComboClick(combo)}>
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
