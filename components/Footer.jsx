"use client";
import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <>
      <style>{`
        footer.footer-v1 {
          background: var(--dark);
          padding: clamp(40px, 8vw, 80px) clamp(20px, 5vw, 56px) clamp(20px, 4vw, 40px);
          border-top: 1px solid var(--gold-dim);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: clamp(30px, 6vw, 60px);
          overflow: hidden;
          color: var(--cream);
        }
        .footer-main-v1 {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: clamp(20px, 4vw, 40px);
        }
        .footer-col-v1 h4 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem; font-weight: 400;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 24px;
        }
        .footer-col-v1 ul { list-style: none; }
        .footer-col-v1 ul li { margin-bottom: 12px; }
        .footer-link-v1 {
          font-size: 0.65rem; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(245,240,232,0.5); text-decoration: none;
          transition: color 0.3s, transform 0.3s;
          display: inline-block;
        }
        .footer-link-v1:hover { color: var(--gold-light); transform: translateX(4px); }
        .footer-brand-v1 p {
          font-size: 0.75rem; line-height: 1.8;
          color: rgba(245,240,232,0.4); max-width: 280px; margin-top: 16px;
        }
        .footer-bottom-v1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: clamp(20px, 4vw, 40px);
          border-top: 1px solid rgba(201,169,110,0.1);
        }
        .footer-bottom-v1 p {
          font-size: 0.55rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(201,169,110,0.3);
        }
        .footer-mark-v1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem; font-weight: 300;
          letter-spacing: 0.4em; color: var(--gold-dim); text-transform: uppercase;
        }
        .footer-logo-v1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem; letter-spacing: 0.25em; color: var(--gold);
          text-transform: uppercase; text-decoration: none; display: flex; align-items: center; gap: 10px;
        }
        .footer-logo-v1 img { height: 28px; width: auto; }

        @media (max-width: 992px) {
          .footer-main-v1 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 576px) {
          .footer-main-v1 { grid-template-columns: 1fr; }
          .footer-bottom-v1 { justify-content: center; text-align: center; }
          .footer-mark-v1 { display: none; }
        }
      `}</style>

      <footer className="footer-v1">
        <div className="footer-main-v1">
          <div className="footer-col-v1 footer-brand-v1">
            <Link href="/" className="footer-logo-v1">
              <img src="/fylex_logo.png" alt="Fylex" />
              Fylex
            </Link>
            <p>Redefining luxury horology through centuries of Swiss excellence and precision engineering.</p>
          </div>
          <div className="footer-col-v1">
            <h4>Our Collections</h4>
            <ul>
              <li><Link href="/shop" className="footer-link-v1">Grand Complications</Link></li>
              <li><Link href="/discover" className="footer-link-v1">Master Chronometer</Link></li>
              <li><Link href="/configure" className="footer-link-v1">The Atelier series</Link></li>
              <li><Link href="/shop" className="footer-link-v1">Heritage Collection</Link></li>
            </ul>
          </div>
          <div className="footer-col-v1">
            <h4>The House</h4>
            <ul>
              <li><Link href="/" className="footer-link-v1">Our Origins</Link></li>
              <li><Link href="/shop" className="footer-link-v1">Craftsmanship</Link></li>
              <li><Link href="/" className="footer-link-v1">Sustainability</Link></li>
              <li><Link href="/" className="footer-link-v1">Careers</Link></li>
            </ul>
          </div>
          <div className="footer-col-v1">
            <h4>Client Services</h4>
            <ul>
              <li><Link href="/" className="footer-link-v1">Contact Us</Link></li>
              <li><Link href="/configure" className="footer-link-v1">Private Viewing</Link></li>
              <li><Link href="/discover" className="footer-link-v1">Watch Care</Link></li>
              <li><Link href="/" className="footer-link-v1">Registry</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom-v1">
          <p>&copy; 2026 Fylex</p>
          <div className="footer-mark-v1">F · Y · L · E · X</div>
          <p>Crafted with Intention</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
