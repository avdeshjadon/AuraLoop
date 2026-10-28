import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function FreePremiumModal({ isOpen, onClose, user }) {
  useEffect(() => {
    if (isOpen) {
      // Confetti burst on appearance
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e4572e', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
        const timeout = setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#e4572e', '#f59e0b', '#ffd700'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#e4572e', '#f59e0b', '#ffd700'],
          });
        }, 350);
        return () => clearTimeout(timeout);
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#e4572e', '#ffd700', '#10b981'],
      });
    } catch (e) {}
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgba(15, 12, 10, 0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        onClick={handleClaim}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '480px',
            background: 'linear-gradient(160deg, #ffffff 0%, #faf8f5 100%)',
            borderRadius: '28px',
            border: '1.5px solid rgba(228, 87, 46, 0.35)',
            boxShadow: '0 24px 64px -12px rgba(228, 87, 46, 0.28), 0 12px 32px rgba(0, 0, 0, 0.18)',
            padding: '36px 32px 30px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '260px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(228, 87, 46, 0.22) 0%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(20px)',
            }}
          />

          {/* Close button */}
          <button
            type="button"
            onClick={handleClaim}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid rgba(23, 19, 15, 0.1)',
              background: 'rgba(23, 19, 15, 0.04)',
              color: '#5f564e',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            ✕
          </button>

          {/* Golden Crown Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
            style={{
              width: '76px',
              height: '76px',
              margin: '0 auto 16px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              boxShadow: '0 8px 24px rgba(228, 87, 46, 0.45)',
            }}
          >
            👑
          </motion.div>

          {/* Shimmering Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #fbbf24',
              color: '#92400e',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            <span>✨</span>
            <span>Admin Gift • Free Premium</span>
          </div>

          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '24px',
              fontWeight: '800',
              color: '#17130f',
              letterSpacing: '-0.5px',
              lineHeight: 1.25,
            }}
          >
            You Got Free Premium! 🎉
          </h2>

          <p
            style={{
              margin: '0 0 24px',
              fontSize: '14.5px',
              color: '#5f564e',
              lineHeight: 1.5,
            }}
          >
            {user?.displayName ? `Congratulations ${user.displayName}! ` : 'Congratulations! '}
            The AuraLoop Super Admin has gifted your account complimentary <strong>Lifetime Pro</strong> access with zero payment required.
          </p>

          {/* Features Checklist Grid */}
          <div
            style={{
              background: 'rgba(23, 19, 15, 0.03)',
              border: '1px solid rgba(23, 19, 15, 0.08)',
              borderRadius: '18px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left',
              marginBottom: '26px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                ✓
              </div>
              <div style={{ fontSize: '13.5px', color: '#17130f', fontWeight: 600 }}>
                All 1,582+ 4K Live Wallpapers Unlocked Forever
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                ✓
              </div>
              <div style={{ fontSize: '13.5px', color: '#17130f', fontWeight: 600 }}>
                Native macOS App & ExtensionKit Lock Screen Sync
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                ✓
              </div>
              <div style={{ fontSize: '13.5px', color: '#17130f', fontWeight: 600 }}>
                Zero Recurring Subscription Fees or Renewals
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleClaim}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(228, 87, 46, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Start Exploring 4K Wallpapers</span>
            <span style={{ fontSize: '16px' }}>✨</span>
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

