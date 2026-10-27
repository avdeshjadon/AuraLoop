import { useState, useEffect } from 'react';
import {
  updateUserProfileName,
  setUserPassword,
  signOutUser
} from '../lib/firebase.js';
import { usePricing } from '../lib/pricingService.js';

export default function ProfileModal({ isOpen, onClose, user, onUserUpdated, onSignOutSuccess, initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'upgrade' | 'password'

  // Name editing
  const [editName, setEditName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Payment notice state
  const [paymentNotice, setPaymentNotice] = useState(false);

  // Feedback states
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pricing = usePricing();

  useEffect(() => {
    if (user?.displayName) {
      setEditName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isPro = user.proTier && user.proTier !== 'none';
  const avatarLetter = (user.displayName || user.email || 'A')[0].toUpperCase();


  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setError('');
    setBusy(true);
    try {
      const updated = await updateUserProfileName(editName);
      if (onUserUpdated && updated) onUserUpdated(updated);
      setIsEditingName(false);
      setSuccess('Name updated successfully!');
      setTimeout(() => setSuccess(''), 2500);
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
      setSuccess('macOS Desktop App password updated! You can now log into the macOS app with your email and this password.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(''), 4000);
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
      onClose();
      if (onSignOutSuccess) onSignOutSuccess();
    } catch (err) {
      setError(err.message || 'Failed to sign out.');
    } finally {
      setBusy(false);
    }
  };

  const scrollToWallpapers = () => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById('wallpapers') || document.getElementById('main');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 12, 10, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(23, 19, 15, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--ta-font, sans-serif)',
          color: '#17130f',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(23, 19, 15, 0.08)',
            background: '#faf8f5'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isPro ? '#e4572e' : '#10b981',
                boxShadow: isPro ? '0 0 8px #e4572e' : '0 0 8px #10b981'
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#5f564e' }}>
              AuraLoop Account
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Profile"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(23, 19, 15, 0.06)',
              color: '#5f564e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(23, 19, 15, 0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(23, 19, 15, 0.06)')}
          >
            ✕
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Notifications */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#991b1b',
                fontSize: '13px',
                lineHeight: '1.45'
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#166534',
                fontSize: '13px',
                lineHeight: '1.45'
              }}
            >
              {success}
            </div>
          )}

          {/* User Profile Card */}
          <div
            style={{
              background: '#f6f3ee',
              border: '1px solid #e5ded6',
              borderRadius: '18px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: isPro
                    ? 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)'
                    : '#17130f',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '20px',
                  flexShrink: 0,
                  boxShadow: isPro ? '0 4px 14px rgba(228, 87, 46, 0.4)' : '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {avatarLetter}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your Name"
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid #dcd5cc',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#17130f',
                        outline: 'none',
                        width: '160px'
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={busy}
                      style={{
                        padding: '5px 10px',
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
                        padding: '5px 8px',
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
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#17130f',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {user.displayName || 'AuraLoop User'}
                    </h3>
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
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#6e655d',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.02em',
                  background: isPro
                    ? 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)'
                    : '#e8e2d8',
                  color: isPro ? '#ffffff' : '#574e46',
                  boxShadow: isPro ? '0 2px 10px rgba(228,87,46,0.3)' : 'none'
                }}
              >
                {isPro ? '✦ Lifetime VIP' : 'Free Tier'}
              </span>
            </div>
          </div>

          {/* Desktop App Password Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5ded6',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', color: '#17130f' }}>
                  Desktop App Password
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#6e655d' }}>
                  {user.hasPassword
                    ? 'Your account has a password for logging into the macOS app.'
                    : 'Create a password to sign in directly inside the AuraLoop macOS app.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setError('');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: '1px solid #dcd5cc',
                  background: '#faf8f5',
                  color: '#17130f',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {showPasswordForm ? 'Cancel' : user.hasPassword ? 'Change Password' : 'Set Password'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <input
                  type="password"
                  placeholder="New Password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #dcd5cc',
                    fontSize: '13.5px',
                    outline: 'none'
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
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#17130f',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    alignSelf: 'flex-start'
                  }}
                >
                  {busy ? 'Saving…' : 'Save Desktop Password'}
                </button>
              </form>
            )}
          </div>

          {/* Membership Tier / Upgrade to Pro */}
          {isPro ? (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(228,87,46,0.08) 0%, rgba(245,158,11,0.08) 100%)',
                border: '1.5px solid rgba(228,87,46,0.3)',
                borderRadius: '18px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>✦</span>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#b93c18' }}>
                  Lifetime Pro Membership Active
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#5f564e', lineHeight: '1.5' }}>
                You have unrestricted VIP access to all 1,582+ 4K HDR live wallpapers across both the Web catalog and the native macOS app with multi-display lock-screen sync.
              </p>

            </div>
          ) : (
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e4572e',
                borderRadius: '18px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 24px -6px rgba(228,87,46,0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#17130f' }}>
                    Upgrade to {pricing.planTitle}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6e655d' }}>
                    {pricing.description || 'Unlock all 1,582+ 4K wallpapers in the macOS app & Web'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#e4572e' }}>
                    {pricing.currency}{pricing.price}
                  </div>
                  {pricing.originalPrice > pricing.price && (
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#8c827a', textDecoration: 'line-through' }}>
                      {pricing.currency}{pricing.originalPrice}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e4572e',
                borderRadius: '18px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 8px 24px -6px rgba(228,87,46,0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#17130f' }}>
                    Upgrade to {pricing.planTitle}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6e655d' }}>
                    {pricing.description || 'Unlock all 1,582+ 4K wallpapers in the macOS app & Web'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#e4572e' }}>
                    {pricing.currency}{pricing.price}
                  </div>
                  {pricing.originalPrice > pricing.price && (
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#8c827a', textDecoration: 'line-through' }}>
                      {pricing.currency}{pricing.originalPrice}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentNotice(true)}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)',
                    color: '#ffffff',
                    fontSize: '14.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(228,87,46,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Upgrade to Lifetime Pro ({pricing.currency}{pricing.price})</span>
                </button>

                {paymentNotice && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      color: '#92400e',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <span>This feature is coming soon! Direct online checkout via Cashfree Gateway is in progress.</span>
                    <button
                      type="button"
                      onClick={() => setPaymentNotice(false)}
                      style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={scrollToWallpapers}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #dcd5cc',
                background: '#faf8f5',
                color: '#17130f',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>Explore 4K Wallpapers</span>
              <span style={{ fontSize: '11px' }}>↓</span>
            </button>

            <a
              href="https://github.com/avdeshjadon/AuraLoop"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #dcd5cc',
                background: '#faf8f5',
                color: '#17130f',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>Download macOS App</span>
              <span style={{ fontSize: '11px' }}>↗</span>
            </a>
          </div>

          {/* Sign Out Button */}
          <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(23,19,15,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#8c827a' }}>
              AuraLoop Native Engine v6.7.8
            </span>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#b91c1c',
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
