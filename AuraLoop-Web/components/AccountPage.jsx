import { useState, useEffect } from 'react';
import {
  updateUserProfileName,
  setUserPassword,
  signOutUser
} from '../lib/firebase.js';
import { usePricing } from '../lib/pricingService.js';
import { startCashfreeCheckout, startCashfreeDonation } from '../lib/paymentService.js';

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
  }, [user]);

  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'theavdeshjadon@gmail.com').toLowerCase();
  const isAdmin = user?.email?.toLowerCase() === adminEmail || sessionStorage.getItem('auraloop_admin_session') === 'authenticated';
  const isPro = user?.proTier && user?.proTier !== 'none';
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
      setSuccess('Desktop app password saved! You can now use your email & this password to sign into the macOS app.');
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
        <p>Loading your profile…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#eeeae4',
        color: '#17130f',
        fontFamily: 'var(--ta-font, sans-serif)',
        paddingBottom: '80px',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(238, 234, 228, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(23, 19, 15, 0.08)',
          padding: '14px 24px'
        }}
      >
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Back to Wallpapers button (Equal 36px height) */}
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '999px',
              background: 'rgba(23, 19, 15, 0.06)',
              border: '1px solid rgba(23, 19, 15, 0.12)',
              color: '#17130f',
              fontSize: '13px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(23, 19, 15, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(23, 19, 15, 0.06)')}
          >
            <span style={{ fontSize: '14px' }}>←</span>
            <span>Wallpapers</span>
          </button>

          {/* AuraLoop Wordmark Logo */}
          <div onClick={onBackToHome} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg
              width="130"
              height="24"
              viewBox="0 0 1200 220"
              role="img"
              aria-label="AuraLoop"
              style={{ display: 'block', height: '24px', width: 'auto' }}
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

          {/* Right Header Actions (All equal 36px height) */}
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
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#2a241f')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#17130f')}
              >
                Admin Dashboard
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
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '820px', margin: '36px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Notifications */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '14px',
              padding: '12px 18px',
              color: '#991b1b',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
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
              borderRadius: '14px',
              padding: '12px 18px',
              color: '#166534',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>✨</span>
            <span>{success}</span>
          </div>
        )}

        {/* 1. Cohesive User Profile Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #dcd5cc',
            borderRadius: '20px',
            padding: '24px 28px',
            boxShadow: '0 2px 12px rgba(40, 25, 15, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: isPro
                    ? 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)'
                    : '#17130f',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '22px',
                  flexShrink: 0,
                  boxShadow: isPro ? '0 4px 14px rgba(228,87,46,0.3)' : '0 2px 8px rgba(0,0,0,0.15)'
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
                        borderRadius: '8px',
                        border: '1px solid #dcd5cc',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#17130f',
                        outline: 'none',
                        width: '180px'
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
                        cursor: 'pointer'
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
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#17130f' }}>
                      {user.displayName || 'AuraLoop User'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      title="Edit Name"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#8c827a',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        fontSize: '13px'
                      }}
                    >
                      ✎
                    </button>
                  </div>
                )}
                <p style={{ margin: '2px 0 0', fontSize: '13.5px', color: '#6e655d' }}>
                  {user.email}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAdmin && (
                <span
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: '#17130f',
                    color: '#ffffff'
                  }}
                >
                  Admin
                </span>
              )}
              <span
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: isPro ? '#fde8dd' : '#f5f2ed',
                  color: isPro ? '#b93c18' : '#6e655d',
                  border: isPro ? '1px solid rgba(228,87,46,0.3)' : '1px solid #dcd5cc'
                }}
              >
                {isPro ? 'Pro Member' : 'Free Tier'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Admin Portal Shortcut (Only if Admin) */}
        {isAdmin && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #dcd5cc',
              borderRadius: '20px',
              padding: '22px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 2px 12px rgba(40, 25, 15, 0.04)'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#17130f' }}>
                Admin Dashboard
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6e655d' }}>
                Manage Cloudflare R2 bucket, live wallpaper catalog, and users.
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToAdmin}
              style={{
                height: '36px',
                padding: '0 18px',
                borderRadius: '999px',
                background: '#17130f',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a241f')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#17130f')}
            >
              <span>Open Dashboard</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* 3. macOS Desktop App Password Section */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #dcd5cc',
            borderRadius: '20px',
            padding: '22px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 12px rgba(40, 25, 15, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#17130f' }}>
                macOS Desktop App Password
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6e655d' }}>
                {user.hasPassword
                  ? 'Your account has a password configured for logging into the macOS app.'
                  : 'Set a password to sign into the native macOS app with your email.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setError('');
              }}
              style={{
                height: '34px',
                padding: '0 16px',
                borderRadius: '999px',
                border: '1px solid #dcd5cc',
                background: '#faf8f5',
                color: '#17130f',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPasswordForm ? 'Cancel' : user.hasPassword ? 'Change Password' : 'Set Password'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid #f0eae1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="New Password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #dcd5cc',
                    fontSize: '13.5px',
                    outline: 'none',
                    background: '#faf8f5'
                  }}
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #dcd5cc',
                    fontSize: '13.5px',
                    outline: 'none',
                    background: '#faf8f5'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                style={{
                  height: '34px',
                  padding: '0 18px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#17130f',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                  marginTop: '4px'
                }}
              >
                {busy ? 'Saving…' : 'Save Password'}
              </button>
            </form>
          )}
        </div>

        {/* 4. Membership / Pro Plan Card */}
        {isPro ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #dcd5cc',
              borderRadius: '20px',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 2px 12px rgba(40, 25, 15, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#17130f' }}>
                Lifetime Pro Active
              </h3>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#0e8044', background: '#e2f5ea', padding: '4px 10px', borderRadius: '999px' }}>
                Active & Synced
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#5f564e', lineHeight: '1.5' }}>
              You have unlocked all 1,582+ 4K live wallpapers across both the Web catalog and the native macOS app with lock-screen sync.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e4572e',
              borderRadius: '20px',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 4px 20px rgba(228,87,46,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#17130f' }}>
                  Upgrade to {pricing.planTitle}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#6e655d' }}>
                  {pricing.description || 'Unlock all 1,582+ 4K wallpapers in the macOS app & Web'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#e4572e' }}>
                  {pricing.currency}{pricing.price}
                </div>
                {pricing.originalPrice > pricing.price && (
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#8c827a', textDecoration: 'line-through' }}>
                    {pricing.currency}{pricing.originalPrice}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
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
                  padding: '13px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: paymentLoading
                    ? '#a8a29e'
                    : 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  cursor: paymentLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: paymentLoading ? 'none' : '0 4px 14px rgba(228,87,46,0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>
                  {paymentLoading ? (paymentStatus || 'Connecting to Cashfree...') : `Upgrade to Lifetime Pro (${pricing.currency}${pricing.price})`}
                </span>
              </button>

              {paymentStatus && paymentLoading && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></span>
                  <span>{paymentStatus}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Voluntary Supporter Section */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', border: (user?.isSupporter || (user?.totalDonated > 0)) ? '1px solid #fbcfe8' : '1px solid #e8e2d9', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '26px' }}>{(user?.isSupporter || (user?.totalDonated > 0)) ? '❤️' : '☕'}</span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#17130f' }}>
                  {(user?.isSupporter || (user?.totalDonated > 0)) ? 'Proud AuraLoop Supporter' : 'Support AuraLoop Engineering (Optional)'}
                </div>
                <div style={{ fontSize: '13px', color: '#685f58', marginTop: '2px' }}>
                  {(user?.isSupporter || (user?.totalDonated > 0))
                    ? `You have generously contributed ₹${user.totalDonated} to keep solo engineering alive. Thank you deeply!`
                    : 'Over 80% of wallpapers are free forever. Optional voluntary contributions fund server CDN bandwidth and keep AuraLoop alive.'}
                </div>
              </div>
            </div>

            {(user?.isSupporter || (user?.totalDonated > 0)) && (
              <button
                type="button"
                onClick={() => setShowDonateForm(!showDonateForm)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #dcd5cc',
                  background: '#faf8f5',
                  color: '#17130f',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {showDonateForm ? 'Cancel' : 'Donate More'}
              </button>
            )}
          </div>

          {(!(user?.isSupporter || (user?.totalDonated > 0)) || showDonateForm) && (
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #eeeae4' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {[99, 199, 499].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDonateAmount(amt)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: donateAmount === amt ? '2px solid #17130f' : '1px solid #dcd5cc',
                      background: donateAmount === amt ? '#17130f' : '#faf8f5',
                      color: donateAmount === amt ? '#ffffff' : '#17130f',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
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
                  borderRadius: '10px',
                  border: 'none',
                  background: donateLoading ? '#a8a29e' : '#17130f',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: donateLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {donateLoading ? 'Connecting to Cashfree...' : `Contribute ₹${donateAmount} via UPI/Card`}
              </button>
            </div>
          )}
        </div>

        {/* 6. Shortcuts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid #dcd5cc',
              background: '#ffffff',
              color: '#17130f',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Explore 4K Wallpapers</span>
            <span style={{ fontSize: '14px' }}>↓</span>
          </button>

          <a
            href="https://github.com/avdeshjadon/AuraLoop/releases/latest/download/AuraLoop.dmg"
            download
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid #dcd5cc',
              background: '#ffffff',
              color: '#17130f',
              fontSize: '13.5px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Download macOS App (.DMG)</span>
            <span style={{ fontSize: '13px' }}>↓</span>
          </a>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '12px', color: '#8c827a', fontSize: '12.5px' }}>
          AuraLoop Native Engine v6.7.8 • © 2026 Avdesh Jadon
        </div>
      </main>
    </div>
  );
}
