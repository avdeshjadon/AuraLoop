import { useState, useEffect } from 'react';
import {
  updateUserProfileName,
  setUserPassword,
  signOutUser,
  markFreePremiumNotifiedWeb
} from '../lib/firebase.js';
import { usePricing } from '../lib/pricingService.js';
import { startCashfreeCheckout, startCashfreeDonation } from '../lib/paymentService.js';
import FreePremiumModal from './FreePremiumModal.jsx';

export default function AccountPage({
  user,
  onBackToHome,
  onNavigateToAdmin,
  onUserUpdated,
  onSignOutSuccess
}) {
  // Name editing state
  const [editName, setEditName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Desktop Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Payment & Donation status state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [donateAmount, setDonateAmount] = useState(199);
  const [donateLoading, setDonateLoading] = useState(false);
  const [showDonateForm, setShowDonateForm] = useState(false);

  // Free Premium Celebration Modal
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Feedback states
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pricing = usePricing();

  useEffect(() => {
    if (user?.displayName) {
      setEditName(user.displayName);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Check if user was granted Free Premium and hasn't seen the popup yet
    if (user?.isGiftedPro || user?.proTier === 'lifetime') {
      const alreadySeen = localStorage.getItem(`auraloop_gifted_pro_seen_${user.uid}`) === 'true';
      if (!alreadySeen && !user?.freePremiumNotifiedWeb) {
        setShowGiftModal(true);
      }
    }
  }, [user]);

  const handleDismissGiftModal = async () => {
    setShowGiftModal(false);
    if (user?.uid) {
      await markFreePremiumNotifiedWeb(user.uid);
      if (onUserUpdated) {
        onUserUpdated({ ...user, freePremiumNotifiedWeb: true });
      }
    }
  };

  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'theavdeshjadon@gmail.com').toLowerCase();
  const isAdmin = user?.email?.toLowerCase() === adminEmail || sessionStorage.getItem('auraloop_admin_session') === 'authenticated';
  const isPro = user?.proTier === 'lifetime' || user?.isGiftedPro || (user?.proTier && user?.proTier !== 'none');
  const avatarLetter = (user?.displayName || user?.email || 'A')[0].toUpperCase();

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setError('');
    setBusy(true);
    try {
      const updated = await updateUserProfileName(editName);
      if (onUserUpdated && updated) onUserUpdated(updated);
      setIsEditingName(false);
      setSuccess('Display name updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update name.');
    } finally {
      setBusy(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await setUserPassword(newPassword);
      setSuccess('macOS desktop password saved! You can now use your email & password to sign into the native macOS app.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    setBusy(true);
    try {
      await signOutUser();
      if (onSignOutSuccess) onSignOutSuccess();
    } catch (err) {
      setError(err.message || 'Failed to sign out.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eeeae4', fontFamily: 'var(--ta-font, sans-serif)' }}>
        <p style={{ color: '#5f564e', fontWeight: 600 }}>Loading your AuraLoop account…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#eeeae4',
        color: '#17130f',
        fontFamily: 'var(--ta-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        paddingBottom: '80px',
        boxSizing: 'border-box',
      }}
    >
      {/* Free Premium Celebration Popup */}
      <FreePremiumModal
        isOpen={showGiftModal}
        onClose={handleDismissGiftModal}
        user={user}
      />

      {/* Top Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(238, 234, 228, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(23, 19, 15, 0.08)',
          padding: '12px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Back to Wallpapers button */}
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '999px',
              background: 'rgba(23, 19, 15, 0.05)',
              border: '1px solid rgba(23, 19, 15, 0.1)',
              color: '#17130f',
              fontSize: '13px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(23, 19, 15, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(23, 19, 15, 0.05)')}
          >
            <span style={{ fontSize: '14px' }}>←</span>
            <span>Wallpapers</span>
          </button>

          {/* AuraLoop Wordmark Logo */}
          <div onClick={onBackToHome} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg
              width="125"
              height="22"
              viewBox="0 0 1200 220"
              role="img"
              aria-label="AuraLoop"
              style={{ display: 'block', height: '22px', width: 'auto' }}
            >
              <g fill="#0A0C10" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif" fontSize="128" fontWeight="700" letterSpacing="0.08em" textAnchor="middle">
                <text x="110" y="152">A</text>
                <text x="240" y="152">U</text>
                <text x="360" y="152">R</text>
                <text x="480" y="152">A</text>
                <text x="605" y="152">L</text>
                <text x="1015" y="152">P</text>
              </g>
              <path
                d="M 695,111 C 728,58 768,58 807,111 C 846,164 886,164 919,111 C 886,58 846,58 807,111 C 768,164 728,164 695,111 Z"
                fill="none"
                stroke="#0A0C10"
                strokeWidth="26"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAdmin && (
              <button
                type="button"
                onClick={onNavigateToAdmin}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '999px',
                  background: '#17130f',
                  border: '1px solid rgba(23, 19, 15, 0.2)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#2a241f')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#17130f')}
              >
                Admin Panel
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '999px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#b91c1c',
                fontSize: '13px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '820px', margin: '32px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Notifications */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '16px',
              padding: '12px 18px',
              color: '#991b1b',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '16px',
              padding: '12px 18px',
              color: '#166534',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(22, 101, 52, 0.08)',
            }}
          >
            <span>✨</span>
            <span>{success}</span>
          </div>
        )}

        {/* 1. Redesigned User Profile Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(23, 19, 15, 0.08)',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 4px 20px -2px rgba(23, 19, 15, 0.04), 0 1px 3px rgba(23, 19, 15, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              {/* Sleek Avatar Ring */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: isPro
                    ? 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)'
                    : '#17130f',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '24px',
                  flexShrink: 0,
                  boxShadow: isPro ? '0 4px 16px rgba(228,87,46,0.35)' : '0 2px 8px rgba(0,0,0,0.15)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                }}
              >
                {avatarLetter}
              </div>

              <div>
                {isEditingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your Name"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #e4572e',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#17130f',
                        outline: 'none',
                        width: '180px',
                        background: '#ffffff',
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={busy}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#17130f',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(user.displayName || '');
                        setIsEditingName(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #dcd5cc',
                        background: '#fff',
                        color: '#5f564e',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#17130f', letterSpacing: '-0.4px' }}>
                      {user.displayName || 'AuraLoop User'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      title="Edit Name"
                      style={{
                        background: 'rgba(23, 19, 15, 0.05)',
                        border: 'none',
                        color: '#8c827a',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✎
                    </button>
                  </div>
                )}
                <p style={{ margin: '3px 0 0', fontSize: '13.5px', color: '#6e655d', fontWeight: 500 }}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {isAdmin && (
                <span
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#17130f',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>🛡️</span>
                  <span>Super Admin</span>
                </span>
              )}

              {isPro ? (
                <span
                  style={{
                    padding: '5px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: user.isGiftedPro
                      ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                      : 'linear-gradient(135deg, #fde8dd 0%, #fed7aa 100%)',
                    color: user.isGiftedPro ? '#92400e' : '#b93c18',
                    border: user.isGiftedPro ? '1px solid #fbbf24' : '1px solid rgba(228,87,46,0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: '0 2px 6px rgba(228, 87, 46, 0.12)',
                  }}
                >
                  <span>👑</span>
                  <span>{user.isGiftedPro ? 'Free Lifetime Pro' : 'Lifetime Pro'}</span>
                </span>
              ) : (
                <span
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: '#f5f2ed',
                    color: '#6e655d',
                    border: '1px solid #dcd5cc',
                  }}
                >
                  Free Tier
                </span>
              )}
            </div>
          </div>

          {/* User Quick Stats Ribbon */}
          <div
            style={{
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid rgba(23, 19, 15, 0.06)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '11.5px', color: '#8c827a', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Access Tier
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#17130f', marginTop: 2 }}>
                {isPro ? (user.isGiftedPro ? 'Gifted Lifetime Pro' : 'Lifetime Pro') : 'Free Tier'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11.5px', color: '#8c827a', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Desktop Client
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#17130f', marginTop: 2 }}>
                {user.hasPassword ? 'macOS App Ready' : 'Password Needed'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11.5px', color: '#8c827a', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Cloud Sync
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0e8044', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                <span>Active & Synced</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Admin Portal Shortcut (If Admin) */}
        {isAdmin && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(23, 19, 15, 0.08)',
              borderRadius: '24px',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 4px 20px -2px rgba(23, 19, 15, 0.04)',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#17130f' }}>
                Admin Console & User Manager
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6e655d' }}>
                Grant Free Lifetime Pro to users, manage Cloudflare R2 bucket & live wallpapers.
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToAdmin}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '999px',
                background: '#17130f',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a241f')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#17130f')}
            >
              <span>Open Admin Panel</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* 3. Redesigned Lifetime Pro Plan Card */}
        {isPro ? (
          <div
            style={{
              background: 'linear-gradient(145deg, #181512 0%, #26201b 100%)',
              color: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              border: '1.5px solid rgba(228, 87, 46, 0.4)',
              boxShadow: '0 12px 36px -8px rgba(228, 87, 46, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '28px' }}>👑</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                    AuraLoop Lifetime Pro Active
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {user.isGiftedPro
                      ? 'Complimentary Lifetime Pro Granted by Super Admin • Never Expires'
                      : 'Lifetime Pro Pass Verified & Synced'}
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '5px 12px',
                  borderRadius: '999px',
                }}
              >
                ✓ All 1,582+ Wallpapers Unlocked
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.85)',
              }}
            >
              <div>✨ 4K 60fps Native Playback</div>
              <div>🖥️ Lock Screen & Screensaver Sync</div>
              <div>⚡ Audio Reactive Visualizer</div>
              <div>♾️ Zero Subscription Fees Forever</div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'linear-gradient(145deg, #181512 0%, #26201b 100%)',
              color: '#ffffff',
              borderRadius: '26px',
              padding: '30px',
              border: '1.5px solid rgba(228, 87, 46, 0.45)',
              boxShadow: '0 16px 40px -10px rgba(228, 87, 46, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient Radial Glow */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(228, 87, 46, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'rgba(228, 87, 46, 0.2)',
                    border: '1px solid rgba(228, 87, 46, 0.4)',
                    color: '#ff8a65',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  ✨ LIFETIME ACCESS • 60% OFF
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>
                  Upgrade to {pricing.planTitle}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
                  Unlock 1,582+ 4K live wallpapers & audio sync across macOS & Web forever.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff' }}>
                  {pricing.currency}{pricing.price}
                </div>
                {pricing.originalPrice > pricing.price && (
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'line-through' }}>
                    {pricing.currency}{pricing.originalPrice}
                  </div>
                )}
              </div>
            </div>

            {/* Feature Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
              <div>✓ Unlimited 4K 60fps Loops</div>
              <div>✓ Lock Screen Dynamic Sync</div>
              <div>✓ Circadian Time Tracking</div>
              <div>✓ Offline Playback & Zero Overhead</div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              disabled={paymentLoading}
              onClick={async () => {
                setPaymentLoading(true);
                setError('');
                setSuccess('');
                setPaymentStatus('Preparing secure checkout...');
                try {
                  await startCashfreeCheckout({
                    user,
                    pricing,
                    onStatusChange: ({ message }) => {
                      setPaymentStatus(message);
                    },
                    onSuccess: ({ orderId, profile }) => {
                      setSuccess(`Payment successful! Welcome to Lifetime Pro (Order: ${orderId})`);
                      setPaymentStatus('');
                      if (onUserUpdated && profile) onUserUpdated(profile);
                    },
                    onError: (err) => {
                      setError(err.message || 'Payment could not be completed.');
                      setPaymentStatus('');
                    }
                  });
                } catch (err) {
                  setError(err.message || 'Checkout initiation error.');
                } finally {
                  setPaymentLoading(false);
                }
              }}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '14px',
                border: 'none',
                background: paymentLoading
                  ? '#a8a29e'
                  : 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                cursor: paymentLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: paymentLoading ? 'none' : '0 6px 20px rgba(228,87,46,0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>
                {paymentLoading ? (paymentStatus || 'Connecting to Cashfree...') : `Upgrade to Lifetime Pro (${pricing.currency}${pricing.price})`}
              </span>
            </button>
          </div>
        )}

        {/* 4. macOS Desktop App Password Section */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(23, 19, 15, 0.08)',
            borderRadius: '24px',
            padding: '24px 28px',
            boxShadow: '0 4px 20px -2px rgba(23, 19, 15, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#f5f2ed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  border: '1px solid #dcd5cc',
                }}
              >
                💻
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#17130f' }}>
                  macOS Desktop App Access
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6e655d' }}>
                  {user.hasPassword
                    ? 'Your account has a password configured for signing into the macOS native client.'
                    : 'Configure a password to sign into the native macOS app with your email.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setError('');
              }}
              style={{
                height: '36px',
                padding: '0 18px',
                borderRadius: '999px',
                border: '1px solid #dcd5cc',
                background: '#ffffff',
                color: '#17130f',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {showPasswordForm ? 'Cancel' : user.hasPassword ? 'Change Password' : 'Set Password'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0eae1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="New Password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid #dcd5cc',
                    fontSize: '13.5px',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid #dcd5cc',
                    fontSize: '13.5px',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                style={{
                  height: '36px',
                  padding: '0 20px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#17130f',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                {busy ? 'Saving…' : 'Save Password'}
              </button>
            </form>
          )}
        </div>

        {/* 5. Support AuraLoop Engineering (Optional) */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: (user?.isSupporter || (user?.totalDonated > 0)) ? '1px solid #fbcfe8' : '1px solid rgba(23, 19, 15, 0.08)',
            borderRadius: '24px',
            padding: '24px 28px',
            boxShadow: '0 4px 20px -2px rgba(23, 19, 15, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#fdf2f8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                {(user?.isSupporter || (user?.totalDonated > 0)) ? '❤️' : '☕'}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#17130f' }}>
                  {(user?.isSupporter || (user?.totalDonated > 0)) ? 'Proud AuraLoop Supporter' : 'Support AuraLoop Engineering (Optional)'}
                </div>
                <div style={{ fontSize: '13px', color: '#6e655d', marginTop: '2px' }}>
                  {(user?.isSupporter || (user?.totalDonated > 0))
                    ? `You have generously contributed ₹${user.totalDonated} to support solo craft and CDN bandwidth. Thank you!`
                    : 'Over 80% of wallpapers are free forever. Optional voluntary contributions fund high-speed R2 CDN bandwidth.'}
                </div>
              </div>
            </div>

            {(user?.isSupporter || (user?.totalDonated > 0)) && (
              <button
                type="button"
                onClick={() => setShowDonateForm(!showDonateForm)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '999px',
                  border: '1px solid #dcd5cc',
                  background: '#ffffff',
                  color: '#17130f',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {showDonateForm ? 'Cancel' : 'Donate More'}
              </button>
            )}
          </div>

          {(!(user?.isSupporter || (user?.totalDonated > 0)) || showDonateForm) && (
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(23, 19, 15, 0.06)' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {[99, 199, 499].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDonateAmount(amt)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '999px',
                      border: donateAmount === amt ? '2px solid #17130f' : '1px solid #dcd5cc',
                      background: donateAmount === amt ? '#17130f' : '#ffffff',
                      color: donateAmount === amt ? '#ffffff' : '#17130f',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={donateLoading}
                onClick={async () => {
                  setDonateLoading(true);
                  setError('');
                  setSuccess('');
                  try {
                    await startCashfreeDonation({
                      user,
                      amount: donateAmount,
                      onSuccess: ({ orderId, amount: paidAmt, profile }) => {
                        setSuccess(`Thank you for your generous contribution of ₹${paidAmt}! (Order: ${orderId})`);
                        setShowDonateForm(false);
                        if (onUserUpdated && profile) onUserUpdated(profile);
                      },
                      onError: (err) => {
                        setError(err.message || 'Contribution could not be processed.');
                      }
                    });
                  } catch (err) {
                    setError(err.message || 'Contribution error.');
                  } finally {
                    setDonateLoading(false);
                  }
                }}
                style={{
                  padding: '11px 22px',
                  borderRadius: '999px',
                  border: 'none',
                  background: donateLoading ? '#a8a29e' : '#17130f',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: donateLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {donateLoading ? 'Connecting to Cashfree...' : `Contribute ₹${donateAmount} via UPI/Card`}
              </button>
            </div>
          )}
        </div>

        {/* 6. Quick Shortcuts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              padding: '16px 22px',
              borderRadius: '20px',
              border: '1px solid rgba(23, 19, 15, 0.08)',
              background: 'rgba(255, 255, 255, 0.88)',
              color: '#17130f',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>Explore 4K Catalog</span>
            <span style={{ fontSize: '15px' }}>↓</span>
          </button>

          <a
            href="https://github.com/avdeshjadon/AuraLoop/releases/latest/download/AuraLoop.dmg"
            download
            style={{
              padding: '16px 22px',
              borderRadius: '20px',
              border: '1px solid rgba(23, 19, 15, 0.08)',
              background: 'rgba(255, 255, 255, 0.88)',
              color: '#17130f',
              fontSize: '14px',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>Download macOS App (.dmg)</span>
            <span style={{ fontSize: '15px' }}>↓</span>
          </a>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '16px', color: '#8c827a', fontSize: '12.5px' }}>
          AuraLoop Native Engine v6.12.0 • © 2026 Avdesh Jadon
        </div>
      </main>
    </div>
  );
}
