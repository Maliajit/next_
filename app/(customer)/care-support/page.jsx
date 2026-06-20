"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchActiveFaqs, fetchProductCareStepsGrouped, fetchProducts } from '@/lib/api';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

export default function CareSupport() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const [faqs, setFaqs] = useState([]);
  const [groupedSteps, setGroupedSteps] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { orders } = useOrder();

  const formRef = useRef(null);

  // Derive purchased product IDs
  const purchasedProductIds = useMemo(() => {
    const ids = new Set();
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.productId) ids.add(item.productId.toString());
      });
    });
    return ids;
  }, [orders]);

  useEffect(() => {
    window.scrollTo(0, 0);

    gsap.from('.cs-hero-content > *', {
      y: 30, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out'
    });

    const loadData = async () => {
      try {
        const [faqRes, stepsRes, prodRes] = await Promise.all([
          fetchActiveFaqs(),
          fetchProductCareStepsGrouped(),
          fetchProducts()
        ]);

        const faqData = Array.isArray(faqRes.data) ? faqRes.data : (faqRes.data?.data || []);
        if (faqRes.success) setFaqs(faqData);

        if (prodRes.success) {
          const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
          setAllProducts(prods);
        }

        if (stepsRes.success) {
          // Group steps by product
          const stepsData = Array.isArray(stepsRes.data) ? stepsRes.data : (stepsRes.data?.data || []);
          const grouped = stepsData.reduce((acc, step) => {
            const pid = step.productId.toString();
            if (!acc[pid]) {
              acc[pid] = {
                product: step.product,
                steps: []
              };
            }
            acc[pid].steps.push(step);
            return acc;
          }, {});

          const groupsArr = Object.values(grouped);
          setGroupedSteps(groupsArr);

          if (groupsArr.length > 0) {
            setSelectedProductId(groupsArr[0].product?.id?.toString() || '');
          }
        }
      } catch (err) {
        console.error("Failed to load care support data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Numbers only
    setFormData({ ...formData, phone: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.message) return;

    // Animate button then show success
    gsap.to('.btn-submit', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
    setTimeout(() => {
      setSubmitted(true);
      gsap.fromTo('.success-msg', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 });
    }, 400);
  };

  const selectedGroup = groupedSteps.find(g => g.product?.id?.toString() === selectedProductId);

  return (
    <div className="cs-root">
      <style>{`
        .cs-root { font-family: 'Inter', sans-serif; background: #000; color: #fff !important; padding-top: var(--header-h); overflow-x: hidden; }
        
        /* HERO */
        .cs-hero { height: 45vh; min-height: 400px; background: #0a0a0a !important; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 40px; position: relative; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .cs-hero-content { z-index: 5; }
        .cs-hero-content h1 { font-family: 'Avenir', 'Neue Haas Grotesk Display Pro', 'Inter', sans-serif; font-size: clamp(2.8rem, 6vw, 4.8rem); margin-bottom: 24px; font-weight: 500; color: #fff !important; letter-spacing: -0.01em; opacity: 1 !important; }
        .cs-hero-content p { font-size: clamp(1rem, 1.2vw, 1.25rem); color: rgba(255,255,255,0.7) !important; max-width: 700px; margin: 0 auto; line-height: 1.8; font-weight: 400; letter-spacing: 0.02em; opacity: 1 !important; }

        .cs-section { padding: 100px 8%; max-width: 1400px; margin: 0 auto; }
        .cs-section-title { font-family: 'Avenir', 'Neue Haas Grotesk Display Pro', 'Inter', sans-serif; font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 30px; text-align: center; color: #fff !important; font-weight: 600; opacity: 1 !important; }

        /* TIME SETTING (DYNAMIC CARE STEPS) */
        .time-setting { background: #000 !important; color: #fff !important; }
        
        .product-selector { max-width: 400px; margin: 0 auto 60px auto; text-align: center; }
        .product-selector select { 
          width: 100%; padding: 14px 20px; background: #111; color: #fff; 
          border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; 
          font-family: inherit; font-size: 1rem; outline: none; cursor: pointer;
          transition: all 0.3s ease;
        }
        .product-selector select:focus { border-color: rgba(255,255,255,0.5); }

        .product-care-group { margin-bottom: 80px; padding-bottom: 40px; }
        .product-care-header { text-align: center; margin-bottom: 40px; }
        .product-care-header h3 { font-family: 'Avenir', 'Neue Haas Grotesk Display Pro', 'Inter', sans-serif; font-size: 2rem; font-weight: 500; color: #fff; margin-bottom: 10px; }
        .product-care-header p { font-size: 0.9rem; color: rgba(255,255,255,0.5); }
        
        .time-content { display: flex; flex-direction: column; align-items: center; gap: 60px; max-width: 800px; margin: 0 auto; }
        .time-visual { width: 100%; text-align: center; }
        .time-visual img { width: 100%; max-width: 350px; height: auto; object-fit: contain; filter: drop-shadow(0 20px 40px rgba(255,255,255,0.05)); border-radius: 12px; margin: 0 auto; }
        
        .time-steps { position: relative; width: 100%; padding-left: 24px; }
        .time-steps::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          left: 41px; /* 24px padding + 17px half-width of 34px circle */
          width: 2px;
          background: rgba(255,255,255,0.15);
          z-index: 0;
        }
        
        .step-item { position: relative; z-index: 1; margin-bottom: 60px; display: flex; gap: 30px; align-items: flex-start; }
        .step-item:last-child { margin-bottom: 0; }
        
        .step-num { 
          width: 36px; height: 36px; 
          background: #000;
          border: 2px solid rgba(255,255,255,0.5) !important; 
          color: #fff !important; 
          border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
          font-weight: 700; flex-shrink: 0; font-size: 14px; 
          position: relative; z-index: 2;
        }
        
        .step-content { flex: 1; padding-top: 5px; }
        .step-content h4 { font-size: 1.4rem; margin-bottom: 12px; color: #fff !important; font-family: 'Avenir', 'Neue Haas Grotesk Display Pro', 'Inter', sans-serif; font-weight: 500; }
        .step-content p { color: rgba(255,255,255,0.7) !important; line-height: 1.7; font-weight: 400; font-size: 1rem; }
        
        .step-img-container { margin-top: 20px; }
        .step-img-container img { max-width: 250px; max-height: 250px; width: 100%; height: auto; object-fit: contain; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
        
        .images-only-timeline { display: flex; flex-direction: column; align-items: center; gap: 50px; width: 100%; max-width: 600px; margin: 0 auto; position: relative; }
        .images-only-timeline::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          left: 50%;
          width: 2px;
          background: rgba(255,255,255,0.15);
          z-index: 0;
          transform: translateX(-50%);
        }
        .image-only-item { text-align: center; position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
        .image-only-img-wrapper { background: #000; padding: 10px 0; z-index: 1; }
        .image-only-img-wrapper img { width: 100%; max-width: 300px; height: auto; object-fit: contain; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
        .image-only-label { 
          margin-top: 15px; background: #000; padding: 6px 16px; border-radius: 20px; 
          border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
          position: relative; z-index: 2;
        }

        /* STATIC CARE CONTENT */
        .static-care-sect { background: #000; padding: 100px 8% 60px 8%; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .static-care-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 60px; max-width: 1400px; margin: 0 auto; }
        .care-card { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 40px; }
        .care-card h3 { font-family: 'Avenir', 'Neue Haas Grotesk Display Pro', 'Inter', sans-serif; font-size: 1.8rem; font-weight: 500; color: #fff; margin-bottom: 20px; }
        .care-card p { color: rgba(255,255,255,0.7); line-height: 1.8; margin-bottom: 15px; font-size: 0.95rem; }
        .care-card ul { margin-left: 20px; list-style-type: none; padding: 0; }
        .care-card ul li { color: rgba(255,255,255,0.7); line-height: 1.8; margin-bottom: 10px; font-size: 0.95rem; position: relative; padding-left: 20px; }
        .care-card ul li::before { content: '•'; position: absolute; left: 0; color: #fff; opacity: 0.5; }

        /* FAQ */
        .faq-sect { background: #0a0a0a; border-top: 1px solid rgba(255,255,255,0.05); }
        .faq-list { max-width: 850px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid rgba(255,255,255,0.1); }
        .faq-q { padding: 30px 0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 1.15rem; font-weight: 500; transition: all 0.3s; color: #fff !important; }
        .faq-q:hover { color: rgba(255,255,255,0.8) !important; transform: translateX(5px); }
        .faq-a { max-height: 0; overflow: hidden; transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); color: rgba(255,255,255,0.7) !important; line-height: 1.8; font-weight: 400; font-size: 1.05rem; }
        .faq-item.active .faq-a { max-height: 250px; padding-bottom: 30px; }
        .faq-icon { transition: transform 0.4s; font-size: 24px; color: #fff !important; font-weight: 300; }
        .faq-item.active .faq-icon { transform: rotate(45deg); opacity: 0.5; }

        /* SUPPORT FORM */
        .support-form-sect { background: #000; border-top: 1px solid rgba(255,255,255,0.05); }
        .form-container { max-width: 700px; margin: 0 auto; padding: 60px; background: #0a0a0a; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
        .f-group { margin-bottom: 30px; }
        .f-group label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 10px; color: rgba(255,255,255,0.8) !important; font-weight: 600; }
        .f-input { width: 100%; padding: 18px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; font-family: inherit; font-size: 1rem; transition: all 0.3s; background: #111; color: #fff !important; }
        .f-input:focus { border-color: #fff !important; outline: none; box-shadow: 0 0 15px rgba(255,255,255,0.05); }
        .f-textarea { height: 160px; resize: none; }
        
        .btn-submit { 
          width: 100%; 
          padding: 16px; 
          background: #fff !important; 
          color: #000 !important; 
          border: none; 
          font-size: 12px; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 0.15em; 
          cursor: pointer; 
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); 
          border-radius: 999px; 
        }
        .btn-submit:hover, .btn-submit:active { 
          background: #ccc !important;
          transform: translateY(-2px); 
        }
        .success-msg { text-align: center; padding: 60px 40px; background: #111; color: #fff !important; border-radius: 8px; font-weight: 400; border: 1px solid rgba(255,255,255,0.1); }
        .success-msg h3 { font-family: 'Avenir', 'Neue Haas Grotesk Display Pro', 'Inter', sans-serif; font-size: 2rem; margin-bottom: 15px; color: #fff !important; }

        @media (max-width: 1024px) {
          .cs-section { padding: 80px 5%; }
        }
        @media (max-width: 768px) {
          .cs-hero { height: 40vh; min-height: 320px; }
          .cs-hero-content h1 { font-size: clamp(2.2rem, 8vw, 3rem); }
          .cs-section { padding: 60px 24px; }
          .cs-section-title { margin-bottom: 30px; font-size: 1.85rem; }
          .form-container { padding: 30px 16px; border-radius: 8px; margin: 0; max-width: 100%; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1); }
          .f-group { margin-bottom: 20px; }
          .f-group label { font-size: 0.65rem; margin-bottom: 6px; }
          .f-input { padding: 14px; font-size: 0.95rem; }
          .btn-submit { padding: 18px; font-size: 11px; }
        }
      `}</style>

      {/* HERO */}
      <section className="cs-hero">
        <div className="cs-hero-content">
          <h1>Care & Support</h1>
          <p>Ensuring your masterpiece remains a timeless symbol of precision and craftsmanship for generations to come.</p>
        </div>
      </section>

      {/* STATIC CARE CONTENT */}
      <section className="static-care-sect">
        <div className="static-care-grid">
          <div className="care-card">
            <h3>Care & Longevity</h3>
            <p>A well-kept timepiece carries its character for years.<br/>To preserve yours:</p>
            <ul>
              <li>Avoid showers, swimming, or submersion in water</li>
              <li>Protect from heavy rain and prolonged moisture</li>
              <li>Keep away from strong magnetic fields</li>
              <li>Avoid extreme heat exposure</li>
              <li>Clean gently using a soft, dry cloth</li>
              <li>Ensure the crown is fully secured at all times</li>
            </ul>
          </div>
          
          <div className="care-card">
            <h3>Water Advisory</h3>
            <p>This watch is rated for everyday splash resistance (3ATM).</p>
            <p>It is designed for urban life — not aquatic environments.</p>
            <p>Water damage is not covered under warranty.</p>
          </div>

          <div className="care-card">
            <h3>Service & Support</h3>
            <p>Your ownership extends beyond purchase.</p>
            <p>For warranty support or servicing, please contact FYLEX through official channels. We remain committed to ensuring your timepiece continues to perform as intended.</p>
          </div>
        </div>
      </section>

      {/* DYNAMIC TIME SETTING & CARE STEPS */}
      <section className="cs-section time-setting">
        <h2 className="cs-section-title">Setting Your Time</h2>

        <div className="product-selector">
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
          >
            <option value="">Select a Product</option>
            {allProducts.map(p => (
              <option key={p.id} value={p.id.toString()}>{p.name}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center text-white opacity-70">
            <p>Loading care instructions...</p>
          </div>
        ) : !selectedProductId ? (
          <div className="text-center text-white opacity-70">
            <p>Please select a product from the dropdown above to view its care instructions.</p>
          </div>
        ) : !selectedGroup || selectedGroup.steps.length === 0 ? (
          <div className="text-center text-white opacity-70">
            <p>No care instructions available yet for this product.</p>
          </div>
        ) : (
          <div className="product-care-group">
            <div className="product-care-header">
              <h3>{selectedGroup.product?.name || 'Watch Care'}</h3>
              <p>{purchasedProductIds.has(selectedProductId) ? 'Your personalized care instructions' : 'Visual guide for this collection'}</p>
            </div>

            {purchasedProductIds.has(selectedProductId) ? (
              // Full view for purchased items
              <div className="time-content">
                <div className="time-visual">
                  <img
                    src={selectedGroup.product?.heroImage || '/assets/fylex-watch-v2/white-gold.png'}
                    alt={selectedGroup.product?.name}
                  />
                </div>
                <div className="time-steps">
                  {selectedGroup.steps.map((step, sIdx) => (
                    <div key={sIdx} className="step-item">
                      <div className="step-num">{step.stepNumber}</div>
                      <div className="step-content">
                        <h4>{step.title}</h4>
                        <p>{step.description}</p>
                        {step.imageUrl && (
                          <div className="step-img-container">
                            <img src={step.imageUrl} alt={step.title} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Images only for non-purchased items
              <div className="images-only-timeline">
                {selectedGroup.steps.filter(s => s.imageUrl).map((step, sIdx) => (
                  <div key={sIdx} className="image-only-item">
                    <div className="image-only-img-wrapper">
                      <img src={step.imageUrl} alt={`Step ${step.stepNumber}`} />
                    </div>
                    <div className="image-only-label">Step {step.stepNumber}</div>
                  </div>
                ))}
                {selectedGroup.steps.filter(s => s.imageUrl).length === 0 && (
                  <p className="text-center text-white opacity-50 w-full col-span-full bg-black z-10 py-4">Visuals coming soon</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* DYNAMIC FAQ */}
      <section className="cs-section faq-sect">
        <h2 className="cs-section-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {isLoading ? (
            <p className="text-center opacity-70">Loading FAQs...</p>
          ) : faqs.length === 0 ? (
            <p className="text-center opacity-70">No FAQs available yet.</p>
          ) : (
            faqs.map((item, i) => (
              <div key={i} className={`faq-item ${activeFaq === i ? 'active' : ''}`}>
                <div className="faq-q" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                  {item.question}
                  <span className="faq-icon">+</span>
                </div>
                <div className="faq-a">{item.answer}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* SUPPORT FORM */}
      <section className="cs-section support-form-sect">
        <h2 className="cs-section-title">Get in Touch</h2>
        <div className="form-container">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <div className="f-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="f-input"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="f-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="f-input"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="f-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="f-input"
                  required
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="Your phone number"
                />
              </div>
              <div className="f-group">
                <label>Message</label>
                <textarea
                  className="f-input f-textarea"
                  required
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
              </div>
              <button type="submit" className="btn-submit">Submit Request</button>
            </form>
          ) : (
            <div className="success-msg">
              <h3>Thank You!</h3>
              <p>We'll reach you out soon!</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
