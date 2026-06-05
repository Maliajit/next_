"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { checkMobileApi } from '@/lib/api';
import Swal from 'sweetalert2';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 4 + Math.random() * 6,
  x: Math.random() * 100,
  y: Math.random() * 100,
  dur: 8 + Math.random() * 10,
  delay: Math.random() * 6,
  opacity: 0.08 + Math.random() * 0.14,
}));

function InputField({ label, type, id, value, onChange, placeholder, icon, autoComplete, prefix, maxLength }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="lp-field-wrapper">
      <label className="lp-field-label" htmlFor={id}>{label}</label>
      <div className={`lp-field-box ${focused ? 'lp-field-focused' : ''} ${value ? 'lp-field-filled' : ''}`}>
        {icon && <span className="lp-field-icon">{icon}</span>}
        {prefix && <span className="lp-field-prefix" style={{fontWeight: 600, color: '#1C2E4A', marginRight: '4px'}}>{prefix}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="lp-input"
          autoComplete={autoComplete}
          maxLength={maxLength}
        />
      </div>
    </div>
  );
}

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [loaded, setLoaded] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const { loginOtp } = useAuth();
  const navigate = useRouter();

  useEffect(() => {
    const t1 = setTimeout(() => setLoaded(true), 60);
    const t2 = setTimeout(() => setFormVisible(true), 280);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    
    setSubmitting(true);
    try {
      const result = await checkMobileApi({ mobile });
      if (!result.success) {
        Swal.fire({
          icon: 'warning',
          title: 'Not Registered',
          text: 'This mobile number is not registered. Please sign up to create an account.',
          confirmButtonText: 'Sign Up Now',
          confirmButtonColor: '#4a6fa5',
          showCancelButton: true,
          cancelButtonText: 'Try Another'
        }).then((res) => {
          if (res.isConfirmed) {
            navigate.push('/signup');
          }
        });
        return;
      }
      setStep(2);
    } catch (err) {
      setError('Unable to verify mobile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setSubmitting(true);
    try {
      console.log('[auth-ui] otp login submit', { mobile, otp });
      await loginOtp({ mobile, otp });
      console.log('[auth-ui] navigation trigger', { target: '/', reason: 'verified otp success' });
      navigate.push('/');
    } catch (err) {
      setError(err?.message || 'Invalid mobile number or OTP');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lp-page">
      <div className="lp-bg">
        <div className="lp-bg-blob lp-blob-1" />
        <div className="lp-bg-blob lp-blob-2" />
        <div className="lp-bg-blob lp-blob-3" />
        <div className="lp-bg-blob lp-blob-4" />
      </div>

      {/* Floating particles */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="lp-particle"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            opacity: p.opacity,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="lp-split">
        {/* Left panel */}
        <div
          className="lp-left-panel"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateX(0)' : 'translateX(-40px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          <div className="lp-brand">
            <span className="lp-brand-name">FYLEXX</span>
          </div>

          <div className="lp-left-copy">
            <div className="lp-eyebrow">Member Access</div>
            <h1 className="lp-left-heading">Wear Time.<br />Define You.</h1>
            <p className="lp-left-sub">
              Sign in to your account to explore exclusive collections, track orders,
              and manage your personalized timepieces.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div
          className={`lp-right-panel ${shake ? 'lp-shake' : ''}`}
          style={{
            opacity: formVisible ? 1 : 0,
            transform: formVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div className="lp-form-card">
            <div className="lp-form-header">
              <h2 className="lp-form-title">
                {step === 1 ? 'Welcome back' : 'Verify Identity'}
              </h2>
              <p className="lp-form-subtitle">
                {step === 1
                  ? 'Sign in to your Fylexx account'
                  : `Enter the 4-digit code sent to ${mobile}`}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleMobileSubmit} className="lp-form" noValidate>
                <InputField
                  label="Mobile Number"
                  type="tel"
                  id="login-mobile"
                  value={mobile}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobile(val);
                  }}
                  placeholder="Enter 10-digit number"
                  autoComplete="tel"
                  prefix="+91"
                  maxLength={10}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  }
                />

                {error && <div className="lp-error-box">{error}</div>}

                <button type="submit" className={`lp-submit-btn ${submitting ? 'lp-submitting' : ''}`} disabled={submitting}>
                  {submitting ? (
                    <span className="lp-spinner" />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="lp-form" noValidate>
                <InputField
                  label="Enter OTP"
                  type="text"
                  id="login-otp"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="••••"
                  autoComplete="one-time-code"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                />

                {error && <div className="lp-error-box">{error}</div>}

                <div className="lp-row-options">
                  <button type="button" onClick={() => setStep(1)} className="lp-forgot">Change Number</button>
                </div>

                <button
                  type="submit"
                  className={`lp-submit-btn ${submitting ? 'lp-submitting' : ''}`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="lp-spinner" />
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="lp-switch-text" style={{ marginTop: '24px' }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="lp-switch-link">Sign up</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .lp-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: stretch;
          font-family: 'Montserrat', sans-serif;
          background: linear-gradient(135deg, #e3e8f0 0%, #f4f7f9 50%, #e9edf4 100%);
        }

        /* Background */
        .lp-bg {
          position: fixed; inset: 0; z-index: 0;
        }
        .lp-bg-blob {
          position: absolute; border-radius: 50%;
          filter: blur(90px); pointer-events: none;
        }
        .lp-blob-1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(74,111,165,0.22) 0%, transparent 65%);
          top: -200px; left: -200px;
          animation: blobDrift1 14s ease-in-out infinite alternate;
        }
        .lp-blob-2 {
          width: 550px; height: 550px;
          background: radial-gradient(circle, rgba(118,75,162,0.16) 0%, transparent 65%);
          top: 30%; right: -150px;
          animation: blobDrift2 18s ease-in-out infinite alternate;
        }
        .lp-blob-3 {
          width: 450px; height: 450px;
          background: radial-gradient(circle, rgba(28,46,74,0.12) 0%, transparent 65%);
          bottom: -100px; left: 30%;
          animation: blobDrift3 11s ease-in-out infinite alternate;
        }
        .lp-blob-4 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(67,160,215,0.10) 0%, transparent 65%);
          top: 60%; left: 10%;
          animation: blobDrift1 16s ease-in-out infinite alternate-reverse;
        }
        @keyframes blobDrift1 { from{transform:translate(0,0)} to{transform:translate(50px,35px)} }
        @keyframes blobDrift2 { from{transform:translate(0,0)} to{transform:translate(-40px,50px)} }
        @keyframes blobDrift3 { from{transform:translate(0,0)} to{transform:translate(30px,-40px)} }

        /* Particles */
        .lp-particle {
          position: fixed; border-radius: 50%;
          background: radial-gradient(circle, #4a6fa5, #764ba2);
          animation: particleFloat linear infinite;
          pointer-events: none; z-index: 1;
        }
        @keyframes particleFloat {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.1); }
          100% { transform: translateY(0) scale(1); }
        }

        /* Layout */
        .lp-split {
          position: relative; z-index: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          width: 100%;
          padding-top: var(--header-h, 70px);
        }
        @media(max-width: 820px) {
          .lp-split { 
            grid-template-columns: 1fr; 
            min-height: auto;
            gap: 0;
          }
          .lp-left-panel { 
            padding: 40px 24px 10px;
            justify-content: flex-start;
          }
          .lp-left-copy {
            flex: none;
          }
          .lp-left-sub {
            margin-bottom: 24px;
          }
          .lp-right-panel {
            padding: 10px 24px 60px;
            align-items: flex-start;
          }
          .lp-form-card {
            padding: 32px 24px;
          }
        }

        /* Left panel */
        .lp-left-panel {
          display: flex; flex-direction: column;
          padding: 60px 56px;
          justify-content: space-between;
        }
        .lp-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .lp-brand-mark {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(28,46,74,0.12);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .lp-brand-name {
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.3em; color: #1C2E4A;
          text-transform: uppercase;
        }
        .lp-left-copy { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .lp-eyebrow {
          font-size: 10px; letter-spacing: 0.38em;
          text-transform: uppercase; color: #4a6fa5;
          font-weight: 600; margin-bottom: 18px;
        }
        .lp-left-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 4vw, 58px);
          font-weight: 400; line-height: 1.1;
          color: #1C2E4A;
          background: linear-gradient(120deg, #1C2E4A 0%, #4a6fa5 60%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
        }
        .lp-left-sub {
          font-size: 14px; color: #5a6a80;
          line-height: 1.75; max-width: 360px;
          margin-bottom: 48px;
        }


        /* Right panel / form */
        .lp-right-panel {
          display: flex; align-items: center; justify-content: center;
          padding: 40px 28px;
        }
        .lp-shake { animation: shakeAnim 0.55s ease; }
        @keyframes shakeAnim {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }

        .lp-form-card {
          width: 100%; max-width: 420px;
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99,130,201,0.18);
          border-radius: 28px;
          padding: 44px 38px;
          box-shadow: 0 12px 60px rgba(28,46,74,0.1), 0 2px 12px rgba(118,75,162,0.06);
        }
        .lp-form-header { margin-bottom: 32px; }
        .lp-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 400;
          color: #1C2E4A; margin-bottom: 6px;
        }
        .lp-form-subtitle {
          font-size: 13px; color: #7a8aa0;
        }

        .lp-form { display: flex; flex-direction: column; gap: 20px; }

        .lp-field-wrapper { display: flex; flex-direction: column; gap: 7px; }
        .lp-field-label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.08em; color: #4a5a70;
          text-transform: uppercase;
        }
        .lp-field-box {
          display: flex; align-items: center; gap: 10px;
          background: rgba(240,244,252,0.7);
          border: 1.5px solid rgba(99,130,201,0.18);
          border-radius: 12px;
          padding: 13px 16px;
          transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
        }
        .lp-field-focused {
          border-color: #4a6fa5;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 0 0 3px rgba(74,111,165,0.12);
        }
        .lp-field-icon { color: #8a9ab8; flex-shrink: 0; display: flex; }
        .lp-input {
          flex: 1; border: none; background: transparent;
          font-size: 14px; color: #1C2E4A;
          font-family: 'Montserrat', sans-serif; font-weight: 400;
          outline: none;
        }
        .lp-input::placeholder { color: #b0bdd0; }

        .lp-row-options {
          display: flex; justify-content: space-between; align-items: center;
        }
        .lp-remember {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: #5a6a80; cursor: pointer;
          user-select: none;
        }
        .lp-checkbox { display: none; }
        .lp-checkbox-custom {
          width: 16px; height: 16px; border-radius: 5px;
          border: 1.5px solid rgba(99,130,201,0.4);
          background: rgba(255,255,255,0.8);
          display: inline-block; transition: all 0.2s;
          flex-shrink: 0;
        }
        .lp-checkbox:checked + .lp-checkbox-custom {
          background: linear-gradient(135deg, #4a6fa5, #764ba2);
          border-color: transparent;
        }
        .lp-forgot {
          font-size: 12px; color: #4a6fa5;
          text-decoration: none; font-weight: 500;
          transition: color 0.2s;
        }
        .lp-forgot:hover { color: #1C2E4A; }
        .lp-error-box {
          border: 1px solid rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.06);
          color: #b91c1c;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 500;
        }

        .lp-submit-btn {
          width: 100%; padding: 8px 16px;
          background: #000000ff;
          color: #ffffffff; border: 1px solid #ffffff; border-radius: 999px;
          font-size: 10px; letter-spacing: 0.15em;
          text-transform: uppercase; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          margin-top: 4px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .lp-submit-btn:hover, .lp-submit-btn:active {
          background: #ffffffff !important;
          color: #000000ff !important;
          border-color: #000000;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        .lp-submit-btn:disabled { opacity: 0.75; cursor: not-allowed; }
        .lp-submit-btn > * { position: relative; z-index: 1; }

        .lp-spinner {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: white;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lp-switch-text {
          text-align: center; font-size: 13px; color: #7a8aa0;
        }
        .lp-switch-link {
          color: #4a6fa5; font-weight: 600;
          text-decoration: none; transition: color 0.2s;
        }
        .lp-switch-link:hover { color: #1C2E4A; }
      `}</style>
    </div>
  );
}
