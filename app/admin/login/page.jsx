"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminLogin } from '@/services/adminApi';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: apiError, success } = await adminLogin({ email, password });
      
      if (success && data) {
        // Save token to localStorage for adminApi service
        localStorage.setItem('admin_token', data.access_token);
        
        // Update AuthContext (uses 'fylexx_user' key internally)
        login(data.user);
        
        // Redirect to dashboard
        router.push('/admin/dashboard');
      } else {
        setError(apiError || 'Invalid administrative credentials');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="admin-login-page">
      <div className="login-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="brand-logo">
            <img src="/fylex_logo.png" alt="Fylex" />
          </div>
          <h1>Fylex Admin</h1>
          <p>Secure Administrative Access</p>
        </div>

        {error && (
          <div className="error-alert animate-shake">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fylex.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <span>Sign In</span>
                <i className="fas fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="/" className="back-link">
            <i className="fas fa-chevron-left"></i>
            Back to Website
          </a>
        </div>
      </div>

      <style jsx>{`
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 20px;
          color: #fff;
        }

        .login-background {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .blob {
          position: absolute;
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(2, 132, 199, 0.2) 100%);
          filter: blur(80px);
          border-radius: 50%;
          animation: float 20s infinite alternate;
        }

        .blob-1 {
          top: -100px;
          right: -100px;
        }

        .blob-2 {
          bottom: -150px;
          left: -150px;
          background: linear-gradient(135deg, rgba(82, 121, 111, 0.15) 0%, rgba(53, 79, 82, 0.15) 100%);
          animation-duration: 25s;
          animation-delay: -5s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 30px) scale(1.1); }
          100% { transform: translate(-20px, 60px) scale(0.9); }
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 48px 40px;
          position: relative;
          z-index: 1;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-logo {
          width: 64px;
          height: 64px;
          background: #fff;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.3);
        }

        .brand-logo img {
          width: 40px;
          height: auto;
        }

        .login-header h1 {
          color: #fff;
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.025em;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          margin-left: 4px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-wrapper i {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-size: 14px;
        }

        .input-wrapper input {
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 14px 16px 14px 46px;
          color: #fff;
          font-size: 15px;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #0ea5e9;
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
        }

        .submit-btn {
          width: 100%;
          background: #0ea5e9;
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 16px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 32px;
        }

        .submit-btn:hover {
          background: #0284c7;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.4);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 24px;
        }

        .back-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #0ea5e9;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
