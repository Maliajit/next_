"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ThankYouPage = () => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="thank-you-container">
      <div className="bg-elements">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className={`thank-you-card ${visible ? 'fade-in' : ''}`}>
        <div className="icon-wrapper">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 className="title">Thank You</h1>
        <p className="subtitle">Your order has been placed successfully</p>
        
        <div className="divider"></div>
        
        <p className="message">
          We've received your request and are currently processing your luxury timepiece. 
          A confirmation email has been sent to your inbox.
        </p>

        <div className="actions">
          <Link href="/my-purchases" className="btn btn-primary">
            View My Orders
          </Link>
          <Link href="/discover" className="btn btn-secondary">
            Continue Exploring
          </Link>
        </div>
      </div>

      <style jsx>{`
        .thank-you-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F9F9F7;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .bg-elements {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .blob-1 {
          width: 400px;
          height: 400px;
          background: #1C2E4A;
          top: -100px;
          right: -100px;
        }

        .blob-2 {
          width: 300px;
          height: 300px;
          background: #F2C94C;
          bottom: -50px;
          left: -50px;
        }

        .thank-you-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 32px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
          opacity: 0;
          transform: translateY(20px);
        }

        .fade-in {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: #1C2E4A;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 10px 20px rgba(28, 46, 74, 0.2);
        }

        .title {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .subtitle {
          font-size: 16px;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 30px;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(30, 41, 59, 0.1), transparent);
          margin-bottom: 30px;
        }

        .message {
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 40px;
          padding: 0 10px;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn {
          padding: 14px 28px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.3s ease;
          cursor: pointer;
          text-decoration: none;
        }

        .btn-primary {
          background: #1C2E4A;
          color: white;
          border: none;
          box-shadow: 0 4px 15px rgba(28, 46, 74, 0.2);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(28, 46, 74, 0.3);
        }

        .btn-secondary {
          background: transparent;
          color: #1C2E4A;
          border: 1px solid #1C2E4A;
        }

        .btn-secondary:hover {
          background: rgba(28, 46, 74, 0.05);
          transform: translateY(-2px);
        }

        @media (max-width: 600px) {
          .thank-you-card {
            padding: 40px 24px;
          }
          .title {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
};

export default ThankYouPage;
