"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const ORBS = [
  { w: 650, h: 650, top: '-180px', left: '-180px', c: 'rgba(74,111,165,0.20)', dur: 13 },
  { w: 500, h: 500, top: '35%', right: '-140px', c: 'rgba(118,75,162,0.15)', dur: 17 },
  { w: 420, h: 420, bottom: '-80px', left: '25%', c: 'rgba(28,46,74,0.11)', dur: 10 },
  { w: 300, h: 300, top: '55%', left: '8%', c: 'rgba(67,160,215,0.09)', dur: 15 },
];

const STEPS = ['Account', 'Profile', 'Confirm'];

function StepIndicator({ current }) {
  return (
    <div className="sp-step-row">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="sp-step-item">
            <div
              className={`sp-step-dot ${i < current ? 'sp-step-done' : i === current ? 'sp-step-active' : ''}`}
            >
              {i < current ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span className={`sp-step-label ${i === current ? 'sp-step-label-active' : ''}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`sp-step-connector ${i < current ? 'sp-connector-done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function InputField({ label, type = 'text', id, value, onChange, placeholder, icon, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="sp-field-wrapper">
      <label className="sp-field-label" htmlFor={id}>{label}</label>
      <div className={`sp-field-box ${focused ? 'sp-field-focused' : ''} ${value ? 'sp-field-filled' : ''}`}>
        {icon && <span className="sp-field-icon">{icon}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="sp-input"
          autoComplete="off"
        />
      </div>
      {hint && <span className="sp-field-hint">{hint}</span>}
    </div>
  );
}

function Step0({ data, setData }) {
  return (
    <div className="sp-step-content">
      <InputField
        label="Full Name"
        id="sp-name"
        value={data.name}
        onChange={e => setData(p => ({ ...p, name: e.target.value }))}
        placeholder="John Marlowe"
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
          </svg>
        }
      />
      <InputField
        label="Email Address"
        type="email"
        id="sp-email"
        value={data.email}
        onChange={e => setData(p => ({ ...p, email: e.target.value }))}
        placeholder="you@example.com"
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="4" width="20" height="16" rx="3" /><path d="m2 7 10 7 10-7" strokeLinecap="round" />
          </svg>
        }
      />
      <InputField
        label="Password"
        type="password"
        id="sp-pass"
        value={data.password}
        onChange={e => setData(p => ({ ...p, password: e.target.value }))}
        placeholder="Min. 8 characters"
        hint="Use uppercase, numbers and symbols for best security"
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
          </svg>
        }
      />
    </div>
  );
}

function Step1({ data, setData }) {
  return (
    <div className="sp-step-content">
      <div className="sp-avatar-section">
        <div className="sp-avatar-ring">
          <div className="sp-avatar-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4a6fa5" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <p className="sp-avatar-label">Profile Photo <span>(optional)</span></p>
      </div>
      <InputField
        label="Phone Number"
        type="tel"
        id="sp-phone"
        value={data.phone}
        onChange={e => setData(p => ({ ...p, phone: e.target.value }))}
        placeholder="+1 (555) 000-0000"
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="2" width="14" height="20" rx="2" /><circle cx="12" cy="18" r="1" fill="currentColor" />
          </svg>
        }
      />
      <div className="sp-field-wrapper">
        <label className="sp-field-label">Preferred Style</label>
        <div className="sp-style-grid">
          {['Minimalist', 'Classic', 'Sport', 'Luxury'].map(s => (
            <button
              key={s}
              type="button"
              className={`sp-style-pill ${data.style === s ? 'sp-style-selected' : ''}`}
              onClick={() => setData(p => ({ ...p, style: s }))}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <InputField
        label="Country"
        id="sp-country"
        value={data.country}
        onChange={e => setData(p => ({ ...p, country: e.target.value }))}
        placeholder="United States"
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" strokeLinecap="round" />
          </svg>
        }
      />
    </div>
  );
}

function Step2({ data }) {
  return (
    <div className="sp-step-content sp-confirm-step">
      <div className="sp-confirm-ring">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="26" fill="none" stroke="url(#confirmGrad)" strokeWidth="2" />
          <defs>
            <linearGradient id="confirmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a6fa5" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
          <path d="M17 29l8 8 14-16" stroke="#4a6fa5" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h3 className="sp-confirm-title">Review your details</h3>
      <p className="sp-confirm-sub">Almost there — verify everything looks good before creating your account.</p>

      <div className="sp-confirm-list">
        {[
          { label: 'Name', val: data.name || '—' },
          { label: 'Email', val: data.email || '—' },
          { label: 'Phone', val: data.phone || '—' },
          { label: 'Style', val: data.style || '—' },
          { label: 'Country', val: data.country || '—' },
        ].map(row => (
          <div key={row.label} className="sp-confirm-row">
            <span className="sp-confirm-key">{row.label}</span>
            <span className="sp-confirm-val">{row.val}</span>
          </div>
        ))}
      </div>

      <label className="sp-terms-label" htmlFor="sp-terms-check">
        <input type="checkbox" className="sp-terms-check" id="sp-terms-check" />
        <span className="sp-terms-custom" />
        <span>
          I agree to Fylexx's{' '}
          <a href="#" className="sp-terms-link">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="sp-terms-link">Privacy Policy</a>
        </span>
      </label>
    </div>
  );
}

export default function Signup() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', email: '', password: '',
    phone: '', style: '', country: '',
  });
  const [loaded, setLoaded] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { signup } = useAuth();
  const navigate = useRouter();

  useEffect(() => {
    setError(''); // Clear error on step change
  }, [step]);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const next = async () => {
    setError('');
    
    if (step === 0) {
      if (!data.name.trim()) return setError('Please enter your full name');
      if (!data.email.trim()) return setError('Please enter your email address');
      if (!validateEmail(data.email)) return setError('Please enter a valid email address');
      if (!data.password) return setError('Please enter a password');
      if (data.password.length < 8) return setError('Password must be at least 8 characters long');
    }

    if (step === 1) {
      if (!data.phone.trim()) return setError('Please enter your phone number');
      if (!data.country.trim()) return setError('Please enter your country');
    }

    if (step < 2) {
      setStep(s => s + 1);
      setContentKey(k => k + 1);
    } else {
      // Check terms on last step
      const termsCheck = document.getElementById('sp-terms-check');
      if (termsCheck && !termsCheck.checked) {
        return setError('You must agree to the Terms and Conditions');
      }

      setSubmitting(true);
      try {
        await signup({
          name: data.name,
          email: data.email,
          password: data.password,
          mobile: data.phone,
        });
        setDone(true);
        setTimeout(() => navigate.push('/profile'), 2000);
      } catch (err) {
        console.error('Signup error:', err);
        setError(err.message || 'Signup failed. Please check your details and try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const back = () => {
    if (step > 0) { setStep(s => s - 1); setContentKey(k => k + 1); }
  };

  const btnLabel = step === 2 ? 'Create Account' : 'Continue';

  return (
    <div className="sp-page">
      {/* Ambient orbs */}
      {ORBS.map((o, i) => (
        <div
          key={i}
          className="sp-orb"
          style={{
            width: o.w, height: o.h,
            top: o.top, left: o.left, right: o.right, bottom: o.bottom,
            background: `radial-gradient(circle, ${o.c} 0%, transparent 65%)`,
            animationDuration: `${o.dur}s`,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}

      <div className="sp-outer">
        <div
          className="sp-container"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          {/* Header */}
          <div className="sp-header">
            <div className="sp-logo">
              <svg viewBox="0 0 40 40" width="30" height="30">
                <circle cx="20" cy="20" r="18" stroke="#1C2E4A" strokeWidth="1.4" fill="none" />
                <circle cx="20" cy="20" r="10" stroke="#4a6fa5" strokeWidth="1.1" fill="none" />
                <circle cx="20" cy="20" r="4" fill="#1C2E4A" />
                <line x1="20" y1="2" x2="20" y2="7" stroke="#1C2E4A" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="20" y1="33" x2="20" y2="38" stroke="#1C2E4A" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="sp-logo-text">FYLEXX</span>
            </div>
            <div className="sp-header-copy">
              <h1 className="sp-main-title">Create Account</h1>
              <p className="sp-main-sub">Join the Fylexx family — precision, craft & style</p>
            </div>
          </div>

          {/* Step indicator */}
          <StepIndicator current={step} />

          {/* Card */}
          <div className="sp-card">
            {done ? (
              <div className="sp-success">
                <div className="sp-success-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="22" fill="none" stroke="url(#sGrad)" strokeWidth="2">
                      <animate attributeName="stroke-dasharray" from="0 138" to="138 138" dur="0.8s" fill="freeze" />
                    </circle>
                    <defs>
                      <linearGradient id="sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4a6fa5" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                    <path d="M14 25l7 7 13-14" stroke="#4a6fa5" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <animate attributeName="stroke-dasharray" from="0 60" to="60 60" dur="0.5s" begin="0.6s" fill="freeze" />
                    </path>
                  </svg>
                </div>
                <h3 className="sp-success-title">Account Created!</h3>
                <p className="sp-success-sub">Welcome to Fylexx, {data.name.split(' ')[0] || 'Friend'}. Your journey begins now.</p>
                <Link href="/login" className="sp-success-btn">Sign In to Your Account</Link>
              </div>
            ) : (
              <>
                <div
                  key={contentKey}
                  style={{ animation: 'spSlideIn 0.45s ease both' }}
                >
                  {step === 0 && <Step0 data={data} setData={setData} />}
                  {step === 1 && <Step1 data={data} setData={setData} />}
                  {step === 2 && <Step2 data={data} />}
                </div>

                {error && (
                  <div className="sp-error-box">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="sp-btn-row">
                  {step > 0 && (
                    <button className="sp-back-btn" onClick={back}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Back
                    </button>
                  )}
                  <button
                    className={`sp-next-btn ${submitting ? 'sp-next-loading' : ''}`}
                    onClick={next}
                    disabled={submitting}
                    style={{ marginLeft: step === 0 ? 'auto' : 0 }}
                  >
                    {submitting ? (
                      <span className="sp-spinner" />
                    ) : (
                      <>
                        <span>{btnLabel}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="sp-login-row">
            Already have an account?{' '}
            <Link href="/login" className="sp-login-link">Sign In</Link>
          </p>
        </div>
      </div>

      <style>{`
        .sp-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #e3e8f0 0%, #f4f7f9 50%, #e9edf4 100%);
          font-family: 'Montserrat', sans-serif;
          padding-top: var(--header-h, 70px);
        }

        .sp-orb {
          position: fixed; border-radius: 50%;
          filter: blur(90px); pointer-events: none; z-index: 0;
          animation: orbFloat ease-in-out infinite alternate;
        }
        @keyframes orbFloat {
          from { transform: translate(0,0) scale(1); }
          to { transform: translate(30px,40px) scale(1.05); }
        }

        .sp-outer {
          position: relative; z-index: 1;
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 20px 60px;
        }

        .sp-container {
          width: 100%; max-width: 560px;
        }

        /* Header */
        .sp-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .sp-logo {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(28,46,74,0.1);
          border-radius: 12px;
          padding: 8px 16px;
          margin-bottom: 22px;
        }
        .sp-logo-text {
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.3em; color: #1C2E4A;
          text-transform: uppercase;
        }
        .sp-main-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 5vw, 50px);
          font-weight: 400; line-height: 1.1;
          background: linear-gradient(120deg, #1C2E4A 0%, #4a6fa5 55%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }
        .sp-main-sub {
          font-size: 13px; color: #7a8aa0;
          letter-spacing: 0.04em;
        }

        /* Step indicator */
        .sp-step-row {
          display: flex; align-items: center;
          justify-content: center;
          margin-bottom: 28px;
          gap: 0;
        }
        .sp-step-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px;
        }
        .sp-step-dot {
          width: 34px; height: 34px; border-radius: 50%;
          border: 2px solid rgba(99,130,201,0.3);
          background: rgba(255,255,255,0.7);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; color: #9aaabe;
          transition: all 0.4s ease;
          backdrop-filter: blur(6px);
        }
        .sp-step-active {
          background: linear-gradient(135deg, #4a6fa5, #764ba2);
          border-color: transparent; color: white;
          box-shadow: 0 4px 16px rgba(74,111,165,0.4);
          transform: scale(1.08);
        }
        .sp-step-done {
          background: linear-gradient(135deg, #3aaf85, #4a6fa5);
          border-color: transparent; color: white;
        }
        .sp-step-label {
          font-size: 10px; letter-spacing: 0.1em;
          text-transform: uppercase; color: #9aaabe;
          font-weight: 500;
          transition: color 0.3s;
        }
        .sp-step-label-active { color: #4a6fa5; font-weight: 600; }
        .sp-step-connector {
          width: 60px; height: 2px;
          background: rgba(99,130,201,0.2);
          margin: 0 6px; margin-bottom: 20px;
          border-radius: 2px;
          transition: background 0.4s;
          flex-shrink: 0;
        }
        .sp-connector-done {
          background: linear-gradient(90deg, #3aaf85, #4a6fa5);
        }

        /* Card */
        .sp-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(22px);
          border: 1px solid rgba(99,130,201,0.16);
          border-radius: 28px;
          padding: 40px 36px 36px;
          box-shadow: 0 16px 60px rgba(28,46,74,0.1), 0 2px 10px rgba(118,75,162,0.06);
          margin-bottom: 20px;
          overflow: hidden;
        }

        @keyframes spSlideIn {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Step content */
        .sp-step-content { display: flex; flex-direction: column; gap: 20px; }

        /* Avatar */
        .sp-avatar-section {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          margin-bottom: 4px;
        }
        .sp-avatar-ring {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(74,111,165,0.12), rgba(118,75,162,0.12));
          border: 2px dashed rgba(74,111,165,0.3);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: transform 0.3s, border-color 0.3s;
        }
        .sp-avatar-ring:hover { transform: scale(1.05); border-color: rgba(74,111,165,0.5); }
        .sp-avatar-placeholder { display: flex; align-items: center; justify-content: center; }
        .sp-avatar-label {
          font-size: 12px; color: #7a8aa0;
        }
        .sp-avatar-label span { color: #adb5c8; }

        /* Style grid */
        .sp-style-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
        .sp-style-pill {
          padding: 9px 18px;
          border-radius: 30px;
          border: 1.5px solid rgba(99,130,201,0.25);
          background: rgba(240,244,252,0.7);
          font-size: 12px; font-weight: 500;
          color: #5a6a80; cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Montserrat', sans-serif;
        }
        .sp-style-pill:hover {
          border-color: #4a6fa5; background: rgba(74,111,165,0.08);
          color: #4a6fa5;
        }
        .sp-style-selected {
          background: linear-gradient(120deg, #4a6fa5, #764ba2);
          border-color: transparent; color: white;
          box-shadow: 0 4px 14px rgba(74,111,165,0.3);
        }

        /* Fields */
        .sp-field-wrapper { display: flex; flex-direction: column; gap: 7px; }
        .sp-field-label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.08em; color: #4a5a70;
          text-transform: uppercase;
        }
        .sp-field-box {
          display: flex; align-items: center; gap: 10px;
          background: rgba(240,244,252,0.7);
          border: 1.5px solid rgba(99,130,201,0.2);
          border-radius: 12px; padding: 13px 16px;
          transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
        }
        .sp-field-focused {
          border-color: #4a6fa5; background: rgba(255,255,255,0.9);
          box-shadow: 0 0 0 3px rgba(74,111,165,0.12);
        }
        .sp-field-icon { color: #8a9ab8; flex-shrink: 0; display: flex; }
        .sp-input {
          flex: 1; border: none; background: transparent;
          font-size: 14px; color: #1C2E4A;
          font-family: 'Montserrat', sans-serif; outline: none;
        }
        .sp-input::placeholder { color: #b0bdd0; }
        .sp-field-hint { font-size: 11px; color: #9aaabe; }

        /* Confirm step */
        .sp-confirm-step { align-items: center; text-align: center; }
        .sp-confirm-ring {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(74,111,165,0.1), rgba(118,75,162,0.1));
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4px;
        }
        .sp-confirm-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px; color: #1C2E4A; margin-bottom: 4px;
        }
        .sp-confirm-sub { font-size: 13px; color: #7a8aa0; margin-bottom: 4px; }
        .sp-confirm-list {
          width: 100%; background: rgba(240,244,252,0.6);
          border-radius: 16px; padding: 16px 20px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .sp-confirm-row {
          display: flex; justify-content: space-between;
          font-size: 13px;
        }
        .sp-confirm-key { color: #7a8aa0; font-weight: 500; }
        .sp-confirm-val { color: #1C2E4A; font-weight: 600; }
        .sp-terms-label {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 12px; color: #5a6a80; cursor: pointer;
          text-align: left; width: 100%; margin-top: 4px;
          user-select: none;
        }
        .sp-terms-check { display: none; }
        .sp-terms-custom {
          width: 17px; height: 17px; min-width: 17px; border-radius: 5px;
          border: 1.5px solid rgba(99,130,201,0.4);
          background: rgba(255,255,255,0.8);
          display: inline-block; margin-top: 1px;
          transition: all 0.2s;
        }
        .sp-terms-check:checked + .sp-terms-custom {
          background: linear-gradient(135deg, #4a6fa5, #764ba2);
          border-color: transparent;
        }
        .sp-terms-link { color: #4a6fa5; text-decoration: none; }
        .sp-terms-link:hover { text-decoration: underline; }

        /* Error box */
        .sp-error-box {
          margin-top: 20px;
          padding: 12px 16px;
          background: rgba(220, 38, 38, 0.06);
          border: 1px solid rgba(220, 38, 38, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 500;
          animation: spShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes spShake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* Buttons */
        .sp-btn-row {
          display: flex; align-items: center; gap: 12px;
          margin-top: 28px;
        }
        .sp-back-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 13px 20px; border-radius: 12px;
          border: 1.5px solid rgba(99,130,201,0.25);
          background: rgba(240,244,252,0.7);
          font-size: 12px; font-weight: 600; color: #5a6a80;
          cursor: pointer; font-family: 'Montserrat', sans-serif;
          transition: all 0.25s;
        }
        .sp-back-btn:hover {
          border-color: #4a6fa5; color: #4a6fa5;
          background: rgba(74,111,165,0.08);
        }
        .sp-next-btn {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 15px 24px; border-radius: 14px;
          background: linear-gradient(120deg, #1C2E4A 0%, #4a6fa5 60%, #764ba2 100%);
          color: white; border: none;
          font-size: 12px; letter-spacing: 0.15em;
          text-transform: uppercase; font-weight: 700;
          cursor: pointer; font-family: 'Montserrat', sans-serif;
          position: relative; overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .sp-next-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(120deg, #764ba2, #4a6fa5, #1C2E4A);
          opacity: 0; transition: opacity 0.4s;
        }
        .sp-next-btn:hover::before { opacity: 1; }
        .sp-next-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(28,46,74,0.3);
        }
        .sp-next-btn > * { position: relative; z-index: 1; }
        .sp-next-btn:disabled { opacity: 0.75; cursor: not-allowed; }
        .sp-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: white;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .sp-login-row {
          text-align: center; font-size: 13px; color: #7a8aa0;
        }
        .sp-login-link {
          color: #4a6fa5; font-weight: 600;
          text-decoration: none; transition: color 0.2s;
        }
        .sp-login-link:hover { color: #1C2E4A; }

        /* Success */
        .sp-success {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 16px; padding: 20px 0;
        }
        .sp-success-icon {
          animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .sp-success-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px; color: #1C2E4A;
          background: linear-gradient(120deg, #1C2E4A, #4a6fa5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sp-success-sub { font-size: 14px; color: #7a8aa0; max-width: 300px; }
        .sp-success-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 14px;
          background: linear-gradient(120deg, #1C2E4A, #4a6fa5);
          color: white; text-decoration: none;
          font-size: 12px; letter-spacing: 0.14em;
          text-transform: uppercase; font-weight: 700;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .sp-success-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(28,46,74,0.3);
        }
      `}</style>
    </div>
  );
}
