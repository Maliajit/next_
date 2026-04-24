"use client";
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import productsData from '../../../data/productsData';
import 'swiper/css/free-mode';
import Lenis from 'lenis';
import { useWishlist } from '@/context/WishlistContext';
import { X, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { fetchProducts } from '../../../lib/api';
import { getFileUrl } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

function ConfigureContent() {
  const searchParams = useSearchParams();
  const watchId = searchParams.get('watch');
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [stepsData, setStepsData] = useState([]);
  const [variants, setVariants] = useState([]);
  const [media360, setMedia360] = useState([]);
  const [frameIndex, setFrameIndex] = useState(0);

  const [currentStep, setCurrentStep] = useState(0);
  const [activeOpt, setActiveOpt] = useState(0);
  const [activeThumb, setActiveThumb] = useState(0);
  const [previewSrc, setPreviewSrc] = useState('');
  const [appliedDial, setAppliedDial] = useState(null);
  const [dialOptions, setDialOptions] = useState([]);
  const [viewMode, setViewMode] = useState('variants');
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [userSelections, setUserSelections] = useState({});

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProducts();
        const rawData = data.data || (Array.isArray(data) ? data : []);
        const p = rawData.find(item => item.id.toString() === watchId) || rawData?.[0];

        if (!p) {
          setLoading(false);
          return;
        }

        const mappedProduct = {
          ...p,
          id: p.id.toString(),
          title: p.name,
          price: `₹${Number(p.price || 0).toLocaleString('en-IN')}`,
          heroImage: getFileUrl(p.heroImage || p.images?.[0]) || '/assets/fylex-watch-v2/premium.png',
          galleryImages: (p.productMedia || []).filter(m => m.type === 'GALLERY' || m.role === 'gallery').map(m => getFileUrl(m.media?.path || m.media?.url)),
          theme: p.bgColor || 'champagne',
          accentColor: p.accentColor || '#c4a35a',
          textColor: p.textColor || '#1a1a1a',
        };
        setProduct(mappedProduct);
        setPreviewSrc(mappedProduct.heroImage);

        const threeSixty = (p.productMedia || [])
          .filter(m => m.type === '360' || m.role === '360_view')
          .map(m => getFileUrl(m.media?.path || m.media?.url))
          .filter(Boolean);
        setMedia360(threeSixty);

        const attrMap = {};
        (p.variants || []).forEach(v => {
          (v.variantAttributes || []).forEach(va => {
              const attr = va.attributeValue?.attribute;
              if(!attr) return;
              if(!attrMap[attr.name]) {
                  attrMap[attr.name] = { id: attr.id, title: `Choose your ${attr.name.toLowerCase()}`, options: [] };
              }
              if(!attrMap[attr.name].options.some(o => o.name === va.attributeValue.label)) {
                  const vImg = v.variantImages?.find(vi => vi.type === 'MAIN')?.media || v.variantImages?.[0]?.media;
                  const vPath = getFileUrl(vImg?.path || vImg?.url || (vImg?.fileName ? `/uploads/${vImg.fileName}` : null));
                  attrMap[attr.name].options.push({ 
                      name: va.attributeValue.label, 
                      img: vPath || mappedProduct.heroImage,
                      dialImg: va.attributeValue.label.toLowerCase().includes('dial') ? vPath : null
                  });
              }
          });
        });

        const dynamicSteps = Object.keys(attrMap).map((key, idx, arr) => ({
          ...attrMap[key],
          id: key.toLowerCase(),
          nextLbl: idx < arr.length - 1 ? Object.keys(attrMap)[idx+1] : 'Discover'
        }));

        setStepsData(dynamicSteps);
        setVariants(p.variants || []);
        
        const initialSelections = {};
        dynamicSteps.forEach(step => {
            initialSelections[step.id] = step.options[0]?.name;
        });
        setUserSelections(initialSelections);

        // Auto-select initial variant image if matches defaults
        const initialMatch = (p.variants || []).find(v => {
          const vAttrs = v.variantAttributes || [];
          if (vAttrs.length === 0) return false;
          return vAttrs.every(va => {
            const attrName = va.attributeValue?.attribute?.name?.toLowerCase();
            return initialSelections[attrName] === va.attributeValue?.label;
          });
        });

        if (initialMatch) {
          const vImg = initialMatch.variantImages?.find(vi => vi.type === 'MAIN')?.media || initialMatch.variantImages?.[0]?.media;
          const vPath = getFileUrl(vImg?.path || vImg?.url || (vImg?.fileName ? `/uploads/${vImg.fileName}` : null));
          if (vPath) setPreviewSrc(vPath);
        }

        const dialsStep = dynamicSteps.find(s => s.id === 'dial' || s.id === 'dials');
        if (dialsStep) setDialOptions(dialsStep.options);
      } catch (err) {
        console.error('Failed to load product for configurator:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [watchId]);

  const previewImgRef = useRef(null);
  const configuratorRef = useRef(null);
  const storyRef = useRef(null);
  const parallaxInited = useRef(false);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  const isLastStep = currentStep >= 0 && currentStep === stepsData.length - 1;
  const isDialStep = currentStep >= 0 && currentStep < stepsData.length && stepsData[currentStep].id === 'dial';

  useEffect(() => {
    if (isLastStep) setTimeout(() => ScrollTrigger.refresh(), 120);
  }, [isLastStep]);

  useEffect(() => {
    if (isDialStep && !appliedDial) setAppliedDial(dialOptions[0]?.dialImg);
  }, [isDialStep, appliedDial, dialOptions]);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#111' }}>Initializing Configurator...</div>;
  if (!product) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#111' }}>Product not found.</div>;



  const handleWishlistClick = () => {
    toggleWishlist(product);
    if (!isInWishlist(product.id)) {
      Swal.fire({
        title: 'Added to Favourites',
        text: `${product.title} has been added to your wishlist.`,
        icon: 'success',
        confirmButtonColor: '#008767',
        confirmButtonText: 'Continue',
        customClass: { popup: 'professional-swal-popup' }
      });
    } else {
      Swal.fire({
        title: 'Removed',
        text: `${product.title} has been removed from your wishlist.`,
        icon: 'info',
        confirmButtonColor: '#1a1a1a',
        confirmButtonText: 'Okay',
        customClass: { popup: 'professional-swal-popup' }
      });
    }
  };

  const handleCategoryClick = (idx) => {
    setCurrentStep(idx);
    setViewMode('variants');
  };

  const resetToOverview = () => {
    setCurrentStep(-1);
    setViewMode('angles');
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      const prevStepIdx = currentStep - 1;
      setCurrentStep(prevStepIdx);
      setActiveOpt(0);
      setActiveThumb(0);
      updatePreviewImage(stepsData[prevStepIdx].options[0].img);
    } else if (currentStep === 0) {
      resetToOverview();
    }
  };



  const updatePreviewImage = (src) => {
    if (!src || src === previewSrc) return;
    gsap.to(previewImgRef.current, {
      opacity: 0, duration: 0.2, onComplete: () => {
        setPreviewSrc(src);
        gsap.to(previewImgRef.current, { opacity: 1, duration: 0.3 });
      }
    });
  };

  const findMatchingVariant = (selections) => {
    return variants.find(v => {
      return (v.variantAttributes || []).every(va => {
        const attrName = va.attributeValue?.attribute?.name?.toLowerCase();
        return selections[attrName] === va.attributeValue?.label;
      });
    });
  };

  const handleOptClick = (idx, src) => {
    setActiveOpt(idx);
    const stepId = stepsData[currentStep].id;
    const optName = stepsData[currentStep].options[idx].name;
    const nextSelections = { ...userSelections, [stepId]: optName };
    setUserSelections(nextSelections);

    const match = findMatchingVariant(nextSelections);
    if (match) {
      const vImg = match.variantImages?.find(vi => vi.type === 'MAIN')?.media || match.variantImages?.[0]?.media;
      const vPath = getFileUrl(vImg?.path || vImg?.url || (vImg?.fileName ? `/uploads/${vImg.fileName}` : null));
      updatePreviewImage(vPath || src);
    } else {
      updatePreviewImage(src);
    }
    setActiveThumb(-1);
  };

  const handleNextStep = () => {
    if (currentStep < stepsData.length - 1) {
      const nextStepIdx = currentStep + 1;
      setCurrentStep(nextStepIdx);
      setActiveOpt(0);
      setActiveThumb(0);
      updatePreviewImage(stepsData[nextStepIdx].options[0].img);
    } else {
      setShowCustomAlert(true);
    }
  };

  const handleThumbClick = (idx, src) => {
    setActiveThumb(idx);
    setActiveOpt(-1);
    updatePreviewImage(src);
  };

  const handle360Scroll = (e) => {
    if(!media360.length) return;
    const sens = 40;
    const delta = e.clientX;
    const newIndex = Math.floor(delta / sens) % media360.length;
    setFrameIndex(Math.abs(newIndex));
  };

  return (
    <div className="customize-root">
      <style>{`
        .customize-root { font-family: 'Inter', sans-serif; background: #f0f2f5; color: #111; overflow-x: hidden; min-height: 100vh; display: flex; flex-direction: column; }
        #configurator { flex: 1; width: 100%; background: radial-gradient(circle at center, #FFFFFF 0%, #ebedf0 100%); position: relative; overflow: hidden; display: flex; flex-direction: column; z-index: 5; }
        .top-actions { position: fixed; top: 100px; right: 30px; display: flex; align-items: center; gap: 15px; z-index: 999; }
        .close-btn { width: 50px; height: 50px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #111; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.08); cursor: pointer; }
        .c-main { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding-bottom: 200px; }
        .watch-preview { height: 65vh; object-fit: contain; filter: drop-shadow(0 30px 60px rgba(0,0,0,0.15)); transition: opacity 0.4s ease; }
        .thumbnails { position: absolute; left: 40px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 20px; z-index: 15; }
        .thumb { width: 62px; height: 62px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,0.08); background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .thumb.active { border-color: #008767; transform: scale(1.1); }
        .thumb img { width: 85%; height: 85%; object-fit: contain; }
        .c-bottom-panel { position: fixed; bottom: 0; left: 0; width: 100%; z-index: 30; background: transparent; }
        .c-selection-controls { padding: 30px 60px 30px 120px; display: flex; flex-direction: column; gap: 20px; }
        .step-title { font-size: 20px; font-weight: 600; }
        .options-row { display: flex; gap: 30px; font-size: 16px; font-weight: 600; color: #8A8A8A; overflow-x: auto; scrollbar-width: none; }
        .opt { cursor: pointer; transition: color 0.3s; white-space: nowrap; }
        .opt.active { color: #008767; }
        .nav-buttons-row { display: flex; align-items: center; gap: 20px; margin-top: 10px; }
        .btn-circular-back { width: 50px; height: 50px; border-radius: 50%; background: #1a1a1a; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .btn-pill-next { background: #1a1a1a; color: #fff; font-size: 11px; font-weight: 700; padding: 12px 32px; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 999px; cursor: pointer; display: flex; align-items: center; gap: 10px; }
        .c-summary-footer { background: #fff; padding: 30px 60px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0,0,0,0.05); }
        .f-title { font-size: 22px; font-weight: 700; color: #111; margin: 0; }
        .f-price { font-size: 16px; font-weight: 600; color: #111; }
        .alert-overlay { position: fixed; inset: 0; background: #fff; display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; visibility: hidden; transition: all 0.4s; }
        .alert-overlay.show { opacity: 1; visibility: visible; }
        .alert-box { background: white; padding: 20px; text-align: center; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; position: relative; }
        .alert-top-close { position: absolute; top: 30px; right: 30px; cursor: pointer; color: #006b4d; }
        .alert-content-grid { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 450px; padding-top: 40px; }
        .alert-watch-title { font-size: 2.2rem; font-weight: 700; margin-bottom: 20px; }
        .alert-watch-preview { width: 100%; max-width: 320px; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.12)); }
        .alert-footer-btn { margin-top: 40px; padding: 14px 40px; background: #1a1a1a; color: #fff; border-radius: 999px; cursor: pointer; font-weight: 700; }
      `}</style>

      <section id="configurator" ref={configuratorRef}>
        <div className="top-actions">
          <button onClick={() => router.push(`/products`)} className="close-btn"><X size={22} /></button>
        </div>

        <div className="c-main" onMouseMove={media360.length ? handle360Scroll : undefined}>
          {media360.length > 0 ? (
            <img src={media360[frameIndex]} alt="Watch 360" className="watch-preview" />
          ) : (
            <img src={previewSrc} alt="Watch preview" className="watch-preview" ref={previewImgRef} />
          )}
          {!isLastStep && media360.length === 0 && product.galleryImages?.length > 0 && (
            <div className="thumbnails">
              {product.galleryImages.map((img, idx) => (
                <div key={idx} className={`thumb ${previewSrc === img ? 'active' : ''}`} onClick={() => updatePreviewImage(img)}>
                  <img src={img} alt={`Gallery ${idx}`} />
                </div>
              ))}
            </div>
          )}
          {media360.length > 0 && <div style={{position:'absolute',bottom:100,color:'#888',fontSize:13}}><RefreshCw size={14}/> Swipe for 360° View</div>}
        </div>

        <div className="c-bottom-panel">
          {currentStep >= 0 && currentStep < stepsData.length && (
            <div className="c-selection-controls">
              <div className="step-title">{stepsData[currentStep]?.title}</div>
              <div className="options-row">
                {stepsData[currentStep]?.options.map((opt, i) => (
                  <span key={i} className={`opt ${(isDialStep ? appliedDial === opt.dialImg : activeOpt === i) ? 'active' : ''}`}
                    onClick={() => {
                      if (isDialStep) { setAppliedDial(opt.dialImg); updatePreviewImage(opt.img); setUserSelections(prev => ({ ...prev, dial: opt.name })); }
                      else handleOptClick(i, opt.img);
                    }}>
                    {opt.name}
                  </span>
                ))}
              </div>
              <div className="nav-buttons-row">
                {currentStep > 0 && <button className="btn-circular-back" onClick={handlePrevStep}><X size={24} style={{transform:'rotate(90deg)'}}/></button>}
                <button className="btn-pill-next" onClick={handleNextStep}>{stepsData[currentStep]?.nextLbl}</button>
              </div>
            </div>
          )}

          <div className="c-summary-footer">
            <div className="f-info">
              <h3 className="f-title">{product.title}</h3>
              <span className="f-price">{product.price}</span>
            </div>
            <button className={`summary-wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}`} onClick={handleWishlistClick}>
              <X size={22} />
            </button>
          </div>
        </div>
      </section>

      <div className={`alert-overlay ${showCustomAlert ? 'show' : ''}`}>
        <div className="alert-box">
          <button className="alert-top-close" onClick={() => setShowCustomAlert(false)}><X size={24} /></button>
          <div className="alert-content-grid">
            <h2 className="alert-watch-title">{product.title}</h2>
            <ul style={{listStyle:'none',padding:0,color:'#666',marginBottom:30}}>
              {Object.keys(userSelections).map(key => <li key={key}>{userSelections[key]}</li>)}
            </ul>
            <div className="alert-image-center"><img src={previewSrc} className="alert-watch-preview" /></div>
            <button className="alert-footer-btn" onClick={() => {
              const params = new URLSearchParams({ watch: watchId, ...userSelections });
              router.push(`/discover?${params.toString()}`);
            }}>Discover</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Configure() {
  return <Suspense fallback={<div>Loading...</div>}><ConfigureContent /></Suspense>;
}
