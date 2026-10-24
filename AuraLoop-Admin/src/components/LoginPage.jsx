import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess, showToast }) {
  const [email, setEmail] = useState('theavdeshjadon@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const savedEmail =
      localStorage.getItem('auraloop_custom_admin_email') ||
      import.meta.env.VITE_ADMIN_EMAIL ||
      'theavdeshjadon@gmail.com';
    const savedPassword =
      localStorage.getItem('auraloop_custom_admin_password') ||
      import.meta.env.VITE_ADMIN_PASSWORD ||
      'Avdesh@6201979695';
    const altPassword = import.meta.env.VITE_ADMIN_PASSWORD_ALT || 'Avdesh@6201979695';

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanTarget = savedEmail.trim().toLowerCase();

      if (cleanEmail === cleanTarget && (password === savedPassword || password === altPassword || password === 'Avdesh@6201979695')) {
        sessionStorage.setItem('auraloop_admin_session', 'authenticated');
        sessionStorage.setItem('auraloop_admin_email', cleanEmail);
        showToast('Welcome back, Avdesh!');
        onLoginSuccess();
      } else {
        setError('Invalid email or password. Please verify credentials.');
      }
      setLoading(false);
    }, 350);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        background: '#FFFFFF',
        color: '#1F2937',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
      }}
    >
      {/* LEFT 50%: AUTHENTICATION FORM (Centered) */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 60px',
          background: '#FFFFFF',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Top Brand Wordmark */}
        <div style={{ position: 'absolute', top: '40px', left: '60px' }}>
          <img
            src="/svg/auraloop-wordmark-dark.svg"
            alt="AuraLoop"
            style={{ height: 28, width: 'auto', display: 'block' }}
          />
        </div>

        {/* Center Form Container */}
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#111827',
              textAlign: 'center',
              marginBottom: '28px',
              letterSpacing: '-0.5px',
            }}
          >
            Sign in to AuraLoop
          </h1>

          {/* Direct Credentials Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: 14,
                  color: '#111827',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: error ? '1px solid #DC2626' : '1px solid #D1D5DB',
                  borderRadius: 8,
                  padding: '0 12px',
                  background: '#FFFFFF',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    border: 'none',
                    outline: 'none',
                    fontSize: 14,
                    color: '#111827',
                    background: 'transparent',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#FEE2E2',
                    color: '#B91C1C',
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: '#2563EB',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: 13, color: '#4B5563', cursor: 'pointer' }}>
                Save email and login method on this device
              </label>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                background: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                marginTop: 8,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1D4ED8';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2563EB';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.25)';
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT 50%: VIBRANT ORANGE DISPLAY (Screenshot 5 exact style) */}
      <div
        style={{
          flex: '1 1 50%',
          background: 'linear-gradient(135deg, #FF5B26 0%, #F04B15 100%)',
          color: '#FFFFFF',
          padding: '40px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Halftone Globe Background Effect */}
        <div
          style={{
            position: 'absolute',
            right: '-10%',
            bottom: '-10%',
            width: '800px',
            height: '800px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.02) 60%, transparent 70%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            pointerEvents: 'none',
          }}
        />

        {/* Center Display Headline matching SS5 */}
        <div style={{ maxWidth: 480, position: 'relative', zIndex: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.9, marginBottom: 12 }}>
            AuraLoop Connect 2026
          </div>

          <h2
            style={{
              fontSize: '46px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-1px',
              marginBottom: '20px',
            }}
          >
            Where the 4K Live Wallpapers connect.
          </h2>

          <p style={{ fontSize: 14, opacity: 0.85 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • macOS Sonoma & Sequoia
          </p>
        </div>
      </div>
    </div>
  );
}
