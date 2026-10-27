import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Save,
  Lock,
  Mail,
} from 'lucide-react';
import { getR2Config, saveR2Config, testR2Connection } from '../services/r2Service';
import { getPricingConfig, savePricingConfig } from '../../lib/pricingService';

export default function Settings({ showToast, theme, setTheme }) {
  const [config, setConfig] = useState(getR2Config());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Admin Security State
  const [adminEmail, setAdminEmail] = useState(
    () => localStorage.getItem('auraloop_custom_admin_email') || import.meta.env.VITE_ADMIN_EMAIL || ''
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Pricing & UPI Membership Settings State
  const [pricing, setPricing] = useState(getPricingConfig);
  const [savingPricing, setSavingPricing] = useState(false);

  const handleSavePricing = async (e) => {
    e.preventDefault();
    setSavingPricing(true);
    await savePricingConfig({
      price: Number(pricing.price) || 0,
      originalPrice: Number(pricing.originalPrice) || 0,
      currency: pricing.currency || '₹',
      upiId: (pricing.upiId || '').trim(),
      planTitle: (pricing.planTitle || '').trim(),
      description: (pricing.description || '').trim(),
    });
    setSavingPricing(false);
    showToast('Pricing updated! Reflecting live on the website in real-time.');
  };

  const handleSaveR2 = (e) => {
    e.preventDefault();
    saveR2Config(config);
    showToast('R2 Cloudflare configuration saved!');
  };

  const handleUpdateSecurity = (e) => {
    e.preventDefault();
    const existingPassword =
      localStorage.getItem('auraloop_custom_admin_password') ||
      import.meta.env.VITE_ADMIN_PASSWORD ||
      '';

    if (existingPassword && currentPassword !== existingPassword) {
      showToast('Current password does not match.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }

    localStorage.setItem('auraloop_custom_admin_email', adminEmail.trim().toLowerCase());
    localStorage.setItem('auraloop_custom_admin_password', newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Admin email & password updated successfully!');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testR2Connection(config);
    setTesting(false);
    setTestResult(result);
    if (result.success) {
      showToast('Cloudflare R2 Bucket verified!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="settings-page"
    >
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
          System Configuration & Admin Security
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* LEFT COLUMN: PRICING, SECURITY & R2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* MEMBERSHIP PRICING CONTROL CARD */}
          <div className="admin-card">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Membership Pricing
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Configure the subscription price and plan title shown to users.
              </p>
            </div>

            <form onSubmit={handleSavePricing} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                    Active Selling Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={pricing.price}
                    onChange={(e) => setPricing({ ...pricing, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                    Original Strikethrough Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={pricing.originalPrice}
                    onChange={(e) => setPricing({ ...pricing, originalPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 13, color: 'var(--text-muted)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                  Plan Title / Display Name
                </label>
                <input
                  type="text"
                  required
                  value={pricing.planTitle}
                  onChange={(e) => setPricing({ ...pricing, planTitle: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 13, color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={savingPricing}
                  className="primary-cta-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: savingPricing ? 0.7 : 1 }}
                >
                  <Save size={15} />
                  <span>{savingPricing ? 'Saving...' : 'Save Pricing'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* ADMIN CREDENTIALS CARD */}
          <div className="admin-card">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Admin Security & Password
              </h2>
            </div>

            <form onSubmit={handleUpdateSecurity} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                  Admin Email / Username
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                  <Mail size={16} color="var(--text-muted)" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    style={{ background: 'transparent', width: '100%', fontSize: 13, color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                  Current Password
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                  <Lock size={16} color="var(--text-muted)" />
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{ background: 'transparent', width: '100%', fontSize: 13, color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 13, color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 13, color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="submit" className="primary-cta-btn">
                  <Save size={15} />
                  <span>Update Admin Password</span>
                </button>
              </div>
            </form>
          </div>

          {/* R2 CONFIG FORM */}
          <div className="admin-card">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Cloudflare R2 Bucket Credentials
              </h2>
            </div>

            <form onSubmit={handleSaveR2} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                  Cloudflare Account ID
                </label>
                <input
                  type="text"
                  value={config.accountId}
                  onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                  R2 Bucket Name
                </label>
                <input
                  type="text"
                  value={config.bucket}
                  onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                  Public CDN Base URL
                </label>
                <input
                  type="text"
                  value={config.cdnBaseUrl}
                  onChange={(e) => setConfig({ ...config, cdnBaseUrl: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button type="submit" className="primary-cta-btn">
                  <Save size={15} />
                  <span>Save R2 Config</span>
                </button>
                <button
                  type="button"
                  className="btn-light-pill"
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  <RefreshCw size={14} className={testing ? 'spinning' : ''} />
                  <span>{testing ? 'Verifying...' : 'Test Connection'}</span>
                </button>
              </div>
            </form>

            {testResult && (
              <div
                style={{
                  marginTop: 18,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: testResult.success ? 'var(--status-completed-bg)' : 'var(--status-failed-bg)',
                  color: testResult.success ? 'var(--status-completed-text)' : 'var(--status-failed-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <CheckCircle size={18} />
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: APPEARANCE & SYSTEM LINKS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="admin-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
              Theme & Appearance
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Switch between the crisp SaaS light mode and sleek dark mode with circular water wave transition.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className={`btn-light-pill ${theme === 'light' ? 'btn-dark-pill' : ''}`}
                onClick={() => setTheme('light')}
                style={{ flex: 1 }}
              >
                Light Theme
              </button>
              <button
                className={`btn-light-pill ${theme === 'dark' ? 'btn-dark-pill' : ''}`}
                onClick={() => setTheme('dark')}
                style={{ flex: 1 }}
              >
                Dark Theme
              </button>
            </div>
          </div>

          <div className="admin-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
              Cloudflare & Live Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href={config.cdnBaseUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-light-pill"
                style={{ justifyContent: 'space-between', textDecoration: 'none' }}
              >
                <span>Cloudflare R2 Public CDN</span>
                <ExternalLink size={14} color="var(--text-muted)" />
              </a>
              <a
                href="https://dash.cloudflare.com"
                target="_blank"
                rel="noreferrer"
                className="btn-light-pill"
                style={{ justifyContent: 'space-between', textDecoration: 'none' }}
              >
                <span>Cloudflare Dashboard</span>
                <ExternalLink size={14} color="var(--text-muted)" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
