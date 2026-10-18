import { useState, useEffect } from 'react';
import { signIn, signUp, signOut, upgradeUserToPro, onAuthStateChanged } from '../lib/auth.js';
import { Close } from '../icons.jsx';

export default function AuthModal({ isOpen, onClose, initialTab = 'signin' }) {
  const [tab, setTab] = useState(initialTab); // 'signin' | 'signup' | 'upgrade'
  const [user, setUser] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [utr, setUtr] = useState('');

  // UI status
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedUPI, setCopiedUPI] = useState(false);

  const upiID = 'avdeshjadon@ptaxis';

  useEffect(() => {
    return onAuthStateChanged(u => {
      setUser(u);
      if (u && initialTab === 'upgrade') {
        setTab('upgrade');
      }
    });
  }, [initialTab]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
    setError('');
    setSuccess('');
  }, [initialTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const u = await signIn(email, password);
      setSuccess(`Welcome back, ${u.displayName}!`);
      setTimeout(() => {
        setTab('upgrade');
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const u = await signUp(name, email, password);
      setSuccess(`Account created! Welcome to AuraLoop, ${u.displayName}!`);
      setTimeout(() => {
        setTab('upgrade');
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to register account.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpgrade = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await upgradeUserToPro('lifetime', utr);
      setSuccess('✦ Lifetime Pro Activated! Open AuraLoop on your Mac to access all 4K wallpapers immediately.');
    } catch (err) {
      setError(err.message || 'Failed to upgrade account.');
    } finally {
      setBusy(false);
    }
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(upiID);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `upi://pay?pa=${upiID}&pn=AuraLoop&am=199&cu=INR&tn=AuraLoop%20Lifetime%20Pro`
  )}`;

  return (
    <div
      className="ta-auth-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 10, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '20px',
        animation: 'taFadeIn 0.2s ease-out'
      }}
    >
      <div
        className="ta-auth-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(180deg, rgba(22, 26, 34, 0.96) 0%, rgba(13, 16, 22, 0.98) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          padding: '28px',
          color: '#F3F4F6',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow accent */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(169, 196, 255, 0.15) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Header & Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #A9C4FF 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#0A0C10',
                fontSize: '15px'
              }}
            >
              ∞
            </div>
            <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
              AuraLoop Cloud
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#9CA3AF',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          >
            <Close />
          </button>
        </div>

        {/* Tab Switcher (if not logged in) */}
        {!user && (
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '4px',
              borderRadius: '14px',
              marginBottom: '22px'
            }}
          >
            <button
              onClick={() => { setTab('signin'); setError(''); }}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '11px',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                background: tab === 'signin' ? '#FFFFFF' : 'transparent',
                color: tab === 'signin' ? '#0A0C10' : '#9CA3AF',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setError(''); }}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '11px',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                background: tab === 'signup' ? '#FFFFFF' : 'transparent',
                color: tab === 'signup' ? '#0A0C10' : '#9CA3AF',
                transition: 'all 0.15s ease'
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '11px 14px',
              marginBottom: '18px',
              fontSize: '12.5px',
              color: '#F87171',
              lineHeight: '1.4'
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.14)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '11px 14px',
              marginBottom: '18px',
              fontSize: '12.5px',
              color: '#4ADE80',
              lineHeight: '1.4'
            }}
          >
            {success}
          </div>
        )}

        {/* View 1: Sign In */}
        {!user && tab === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#9CA3AF', marginBottom: '6px' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#9CA3AF', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{
                ...primaryBtnStyle,
                marginTop: '8px',
                opacity: busy ? 0.6 : 1
              }}
            >
              {busy ? 'Signing In…' : 'Sign In to Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                Don’t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('signup'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#A9C4FF', cursor: 'pointer', fontWeight: '600' }}
                >
                  Create one now
                </button>
              </span>
            </div>
          </form>
        )}

        {/* View 2: Sign Up */}
        {!user && tab === 'signup' && (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#9CA3AF', marginBottom: '6px' }}>
                FULL NAME
              </label>
              <input
                type="text"
                required
                placeholder="Steve Jobs"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#9CA3AF', marginBottom: '6px' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#9CA3AF', marginBottom: '6px' }}>
                PASSWORD (6+ chars)
              </label>
              <input
                type="password"
                required
                placeholder="Create a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#9CA3AF', marginBottom: '6px' }}>
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{
                ...primaryBtnStyle,
                marginTop: '8px',
                opacity: busy ? 0.6 : 1
              }}
            >
              {busy ? 'Creating Account…' : 'Create AuraLoop Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('signin'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#A9C4FF', cursor: 'pointer', fontWeight: '600' }}
                >
                  Sign in
                </button>
              </span>
            </div>
          </form>
        )}

        {/* View 3: Logged In Account & Pro Upgrade Section */}
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* User Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: user.proTier !== 'none'
                      ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                      : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    color: '#fff',
                    fontSize: '15px'
                  }}
                >
                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{user.displayName}</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{user.email}</div>
                </div>
              </div>

              <div>
                {user.proTier !== 'none' ? (
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.16)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#F59E0B',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 9px',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ✦ Lifetime VIP
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#9CA3AF',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '4px 9px',
                      borderRadius: '999px'
                    }}
                  >
                    Free Plan
                  </span>
                )}
              </div>
            </div>

            {/* Pro Upgrade Section */}
            {user.proTier === 'none' ? (
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '18px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#FDE68A' }}>
                      Upgrade to AuraLoop Lifetime Pro
                    </div>
                    <div style={{ fontSize: '12px', color: '#D1D5DB', marginTop: '2px' }}>
                      Unlock 1,582+ 4K Wallpapers & macOS Sync
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#F59E0B' }}>
                    ₹199
                  </div>
                </div>

                {/* QR Code & UPI instructions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '12px',
                    borderRadius: '12px'
                  }}
                >
                  <img
                    src={qrImageUrl}
                    alt="Scan UPI QR"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '8px',
                      background: '#fff',
                      padding: '4px'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>PAY VIA ANY UPI APP</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: '4px 0' }}>
                      {upiID}
                    </div>
                    <button
                      type="button"
                      onClick={copyUPI}
                      style={{
                        background: copiedUPI ? '#22C55E' : 'rgba(255, 255, 255, 0.12)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {copiedUPI ? 'Copied!' : 'Copy UPI ID'}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#9CA3AF', marginBottom: '4px' }}>
                      ENTER 12-DIGIT UTR / REFERENCE NO.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 428938192831"
                      value={utr}
                      onChange={e => setUtr(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    style={{
                      ...primaryBtnStyle,
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#000',
                      fontWeight: '700'
                    }}
                  >
                    {busy ? 'Activating Pro…' : '✦ Activate Pro Membership'}
                  </button>
                </form>
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '16px',
                  padding: '18px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>👑</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#4ADE80' }}>
                  Lifetime Pro Active!
                </div>
                <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '6px', lineHeight: '1.5' }}>
                  All 1,582+ dynamic 4K wallpapers, audio synchronization, and VIP categories are unlocked on your Mac.
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => { signOut(); setTab('signin'); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '6px 12px'
                }}
              >
                Sign Out of Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '12px',
  color: '#FFFFFF',
  fontSize: '13.5px',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  boxSizing: 'border-box'
};

const primaryBtnStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '14px',
  border: 'none',
  background: '#FFFFFF',
  color: '#0A0C10',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
};
