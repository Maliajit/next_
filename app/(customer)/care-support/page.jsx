"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


gsap.registerPlugin(ScrollTrigger);

const FAQ_DATA = [
  {
    q: "How often should my watch be serviced?",
    a: "We recommend a complete service every 5 to 10 years, depending on the model and real-life usage. Our master watchmakers will ensure every component meets our exacting standards."
  },
  {
    q: "Is my watch waterproof?",
    a: "Most of our timepieces are waterproof to at least 100 meters. However, we recommend having the waterproof seals checked annually, especially before any planned immersion."
  },
  {
    q: "How do I clean my watch?",
    a: "You can help preserve its lustre by cleaning it occasionally with a microfibre cloth. You can also wash the case and bracelet from time to time with soapy water and a soft brush."
  },
  {
    q: "What should I do if my watch stops?",
    a: "If the watch hasn't been worn for some time, it may need to be wound manually. Simply unscrew the crown and turn it about 25 times. It will then wind itself automatically as you wear it."
  }
];

export default function CareSupport() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  
  const formRef = useRef(null);
  const careRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    gsap.from('.cs-hero-content > *', {
      y: 30, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out'
    });

    gsap.from('.care-card', {
      scrollTrigger: {
        trigger: '.care-grid',
        start: 'top 85%',
      },
      y: 50, duration: 0.8, stagger: 0.15, ease: 'power2.out'
    });
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

  return (
    <div className="cs-root">
      
      <style>{`
        .cs-root { font-family: 'Inter', sans-serif; background: #fff; color: #1C2E4A !important; padding-top: var(--header-h); overflow-x: hidden; }
        
        /* HERO */
        .cs-hero { height: 45vh; min-height: 400px; background: #1C2E4A !important; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 40px; position: relative; overflow: hidden; }
        .cs-hero-content { z-index: 5; }
        .cs-hero-content h1 { font-family: 'Playfair Display', serif; font-size: clamp(2.8rem, 6vw, 4.8rem); margin-bottom: 24px; font-weight: 500; color: #FFFFFF !important; letter-spacing: -0.01em; opacity: 1 !important; }
        .cs-hero-content p { font-size: clamp(1rem, 1.2vw, 1.25rem); color: rgba(255,255,255,0.95) !important; max-width: 700px; margin: 0 auto; line-height: 1.8; font-weight: 400; letter-spacing: 0.02em; opacity: 1 !important; }

        .cs-section { padding: 120px 8%; max-width: 1400px; margin: 0 auto; }
        .cs-section-title { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 60px; text-align: center; color: #1C2E4A !important; font-weight: 600; opacity: 1 !important; }

        /* CARE GUIDE */
        .care-sect { background: #fdfdfd; }
        .care-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
        .care-card { padding: 50px 40px; background: #fff !important; border: none !important; border-radius: 4px; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; }
        .care-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(28,46,74,0.1); }
        .care-card h3 { font-size: 1.4rem; margin-bottom: 20px; color: #1C2E4A !important; font-family: 'Playfair Display', serif; font-weight: 600; opacity: 1 !important; }
        .care-card p { font-size: 1rem; line-height: 1.8; color: #1C2E4A !important; opacity: 0.9 !important; font-weight: 400; }

        /* TIME SETTING */
        .time-setting { background: #1C2E4A !important; color: #FFFFFF !important; }
        .time-setting .cs-section-title { color: #FFFFFF !important; }
        .time-content { display: flex; align-items: center; gap: 80px; flex-wrap: wrap; }
        .time-visual { flex: 1; min-width: 320px; background: transparent !important; padding: 50px; border: none !important; text-align: center; }
        .time-visual img { width: 100%; max-width: 450px; filter: drop-shadow(0 30px 60px rgba(0,0,0,0.5)); }
        .time-steps { flex: 1.2; min-width: 320px; }
        .step-item { margin-bottom: 40px; display: flex; gap: 24px; align-items: flex-start; }
        .step-num { width: 36px; height: 36px; border: 1px solid #FFFFFF !important; color: #FFFFFF !important; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; font-size: 14px; }
        .step-item h4 { font-size: 1.25rem; margin-bottom: 10px; color: #FFFFFF !important; font-family: 'Playfair Display', serif; font-weight: 500; }
        .step-item p { color: #FFFFFF !important; opacity: 0.9 !important; line-height: 1.7; font-weight: 400; }

        /* FAQ */
        .faq-sect { background: #f8f9fa; }
        .faq-list { max-width: 850px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid rgba(28,46,74,0.1); }
        .faq-q { padding: 30px 0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 1.15rem; font-weight: 500; transition: all 0.3s; color: #1C2E4A !important; }
        .faq-q:hover { color: #000 !important; transform: translateX(5px); }
        .faq-a { max-height: 0; overflow: hidden; transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); color: #1C2E4A !important; opacity: 0.9 !important; line-height: 1.8; font-weight: 400; font-size: 1.05rem; }
        .faq-item.active .faq-a { max-height: 250px; padding-bottom: 30px; }
        .faq-icon { transition: transform 0.4s; font-size: 24px; color: #1C2E4A !important; font-weight: 300; }
        .faq-item.active .faq-icon { transform: rotate(45deg); opacity: 0.5; }

        /* SUPPORT FORM */
        .support-form-sect { background: #fff; }
        .form-container { max-width: 700px; margin: 0 auto; padding: 60px; background: #f8f9fa; border-radius: 12px; box-shadow: 0 30px 80px rgba(28,46,74,0.06); }
        .f-group { margin-bottom: 30px; }
        .f-group label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 10px; color: #1C2E4A !important; font-weight: 600; opacity: 0.8 !important; }
        .f-input { width: 100%; padding: 18px; border: 1px solid rgba(28,46,74,0.1); border-radius: 4px; font-family: inherit; font-size: 1rem; transition: all 0.3s; background: #fff; color: #1C2E4A !important; }
        .f-input:focus { border-color: #1C2E4A !important; outline: none; box-shadow: 0 0 15px rgba(28,46,74,0.05); }
        .f-textarea { height: 160px; resize: none; }
        
        .btn-submit { width: 100%; padding: 20px; background: #1C2E4A !important; color: #FFFFFF !important; border: none; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3em; cursor: pointer; transition: all 0.4s; border-radius: 4px; }
        .btn-submit:hover { background: #000 !important; transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .success-msg { text-align: center; padding: 60px 40px; background: #fff; color: #1C2E4A !important; border-radius: 8px; font-weight: 400; border: 1px solid rgba(28,46,74,0.1); }
        .success-msg h3 { font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 15px; color: #1C2E4A !important; }

        @media (max-width: 1024px) {
          .cs-section { padding: 80px 5%; }
          .time-content { gap: 40px; justify-content: center; text-align: center; }
          .time-visual { min-width: 100%; padding: 40px 20px; }
          .time-steps { min-width: 100%; text-align: left; }
        }
        @media (max-width: 768px) {
          .cs-hero { height: 40vh; min-height: 320px; }
          .cs-hero-content h1 { font-size: clamp(2.2rem, 8vw, 3rem); }
          .cs-section { padding: 60px 24px; }
          .cs-section-title { margin-bottom: 40px; font-size: 1.85rem; }
          .care-grid { gap: 24px; }
          .care-card { padding: 35px 24px; }
          .time-content { gap: 30px; }
          .time-visual img { max-width: 280px; }
          .step-item { gap: 16px; margin-bottom: 30px; }
          .form-container { padding: 30px 16px; border-radius: 8px; margin: 0; max-width: 100%; box-shadow: none; background: #fff; border: 1px solid rgba(28,46,74,0.05); }
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

      {/* CARE GUIDE */}
      <section className="cs-section care-sect">
        <h2 className="cs-section-title">Maintenance & Care</h2>
        <div className="care-grid">
          <div className="care-card">
            <h3>Cleaning</h3>
            <p>Maintain the brilliance of your watch by wiping it occasionally with a microfibre cloth. Metal bracelets can be cleaned with mild soapy water and a soft brush.</p>
          </div>
          <div className="care-card">
            <h3>Water Resistance</h3>
            <p>Ensure the crown is fully screwed down before any immersion. We recommend an annual pressure test to verify the integrity of the seals.</p>
          </div>
          <div className="care-card">
            <h3>Magnetism</h3>
            <p>Avoid placing your watch near strong magnetic fields (speakers, tablets, magnets) as they can affect the movement's precision.</p>
          </div>
          <div className="care-card">
            <h3>Servicing</h3>
            <p>To guarantee continued accuracy and waterproofness, we recommend a complete service by our master watchmakers every 5 to 10 years.</p>
          </div>
        </div>
      </section>

      {/* TIME SETTING */}
      <section className="cs-section time-setting">
        <h2 className="cs-section-title">Setting Your Time</h2>
        <div className="time-content">
          <div className="time-visual">
            <img src="/assets/fylex-watch-v2/white-gold.png" alt="Premium Watch Guide" />
            <p style={{marginTop: '20px', fontSize: '0.8rem', color: '#999'}}>*Typical screw-down crown illustration</p>
          </div>
          <div className="time-steps">
            <div className="step-item">
              <div className="step-num">0</div>
              <div>
                <h4>Initial Position</h4>
                <p>The crown is screwed down tight against the case, ensuring maximum waterproofness. The watch is fully protected.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-num">1</div>
              <div>
                <h4>Manual Winding</h4>
                <p>Unscrew the crown. In this position, you can wind the watch manually by turning it clockwise about 25 times.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-num">2</div>
              <div>
                <h4>Setting Time & Date</h4>
                <p>Pull the crown out to the final notch. Rotate to set the desired time. Once set, push back and screw down firmly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="cs-section faq-sect">
        <h2 className="cs-section-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {FAQ_DATA.map((item, i) => (
            <div key={i} className={`faq-item ${activeFaq === i ? 'active' : ''}`}>
              <div className="faq-q" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                {item.q}
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-a">{item.a}</div>
            </div>
          ))}
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
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="f-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="f-input" 
                  required 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
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
                  onChange={e => setFormData({...formData, message: e.target.value})}
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
