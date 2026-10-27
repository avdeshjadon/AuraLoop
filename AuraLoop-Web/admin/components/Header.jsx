import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Settings,
  LogOut,
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  onRefresh,
  refreshing = false,
  uploadProgress = null, // { progress: number, fileName: string } | null
  theme = 'light',
  onLogout,
  onNavigateManage,
  onBackToSite,
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'manage', label: 'Manage' },
    { id: 'activity', label: 'Activity' },
    { id: 'users', label: 'Users' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header
      className="top-header"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {/* Left: Real AuraLoop Wordmark Logo (no extra icon or ADMIN text) */}
      <div className="header-left">
        <div
          onClick={() => setActiveTab('overview')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <img
            src={theme === 'dark' ? '/svg/auraloop-wordmark.svg' : '/svg/auraloop-wordmark-dark.svg'}
            alt="AuraLoop"
            style={{ height: 28, width: 'auto', display: 'block' }}
          />
        </div>
      </div>

      {/* Center: Oval Navigation Container */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <div className="nav-pills">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === 'manage' && activeTab === 'bucket');
            return (
              <button
                key={tab.id}
                className={`nav-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (tab.id === 'manage') {
                    if (onNavigateManage) {
                      onNavigateManage(null);
                    } else {
                      setActiveTab('manage');
                    }
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="nav-pill-active-bg"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                      mass: 0.8,
                    }}
                  />
                )}
                <span
                  style={{
                    position: 'relative',
                    zIndex: 3,
                    color: isActive ? '#FFFFFF' : 'inherit',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Upload Progress Pill + Refresh + Profile Icon */}
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Real-time Upload Progress Oval Pill in Navbar */}
        <AnimatePresence>
          {uploadProgress && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-pill)',
                padding: '6px 14px',
                height: 38,
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
              }}
              title={uploadProgress.fileName ? `Uploading: ${uploadProgress.fileName}` : 'Uploading video...'}
            >
              {/* Internal Progress fill track */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${uploadProgress.progress || 0}%`,
                  background: 'linear-gradient(90deg, rgba(228, 87, 46, 0.18) 0%, rgba(228, 87, 46, 0.3) 100%)',
                  transition: 'width 0.25s ease',
                  borderRadius: 'var(--radius-pill)',
                }}
              />
              <span
                className="spin-animation"
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid rgba(228, 87, 46, 0.3)',
                  borderTopColor: 'var(--accent-orange)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  position: 'relative',
                  zIndex: 2,
                }}
              />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--accent-orange)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                Uploading {uploadProgress.progress}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {onBackToSite && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onBackToSite}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '999px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              boxShadow: 'var(--shadow-sm)',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>←</span>
            <span>Public Site</span>
          </motion.button>
        )}

        {/* Animated Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={
            refreshing
              ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
              : { type: 'spring', stiffness: 300, damping: 20 }
          }
          className="header-action-btn"
          onClick={onRefresh}
          title="Refresh Catalog Data"
          disabled={refreshing}
          style={{
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <RefreshCw size={16} />
        </motion.button>

        {/* Clean Profile Icon with Dropdown Menu */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #222630 0%, #151820 100%)',
              border: '2px solid rgba(255, 91, 38, 0.45)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              boxSizing: 'border-box'
            }}
            title="Account Menu"
          >
            AJ
          </motion.button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 48,
                  width: 220,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-dropdown)',
                  padding: '8px',
                  zIndex: 100,
                }}
              >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                    Avdesh Jadon
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    theavdeshjadon@gmail.com
                  </div>
                </div>

                <div style={{ padding: '6px 0' }}>
                  <button
                    className="nav-pill-btn"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onClick={() => {
                      setActiveTab('settings');
                      setIsProfileMenuOpen(false);
                    }}
                  >
                    <Settings size={14} />
                    <span>Security & Settings</span>
                  </button>

                  <button
                    className="nav-pill-btn"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      color: '#DC2626',
                    }}
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
