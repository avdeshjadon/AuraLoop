import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useDialog, useReduced } from '../lib.jsx';
import { CheckIcon, CloseIcon, DownloadIcon, AppleIcon } from '../icons.jsx';

export default function DownloadModal({ onClose }) {
  const ref = useRef(null);
  const reduce = useReduced();
  const [downloaded, setDownloaded] = useState(false);
  useDialog(ref, onClose);

  const handleDownload = () => {
    setDownloaded(true);
    if (!reduce) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#c9822a', '#b5482a', '#7f9b7d', '#221f1a'],
        });
      } catch (_) {}
    }
    // Trigger download
    const link = document.createElement('a');
    link.href = 'https://github.com/avdeshjadon/AuraLoop/releases/latest/download/AuraLoop-6.6.0.dmg';
    link.setAttribute('download', 'AuraLoop-6.6.0.dmg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <motion.div
        className="ch-scrim"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        ref={ref}
        className="ch-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ch-download-title"
        aria-describedby="ch-download-desc"
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduce ? 0 : 8 }}
        transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ maxWidth: '520px' }}
      >
        <button
          type="button"
          className="ch-iconbtn ch-modal__close"
          onClick={onClose}
          aria-label="Close download modal"
        >
          <CloseIcon size={18} />
        </button>
        <span className="ch-modal__icon" aria-hidden="true">
          <AppleIcon size={22} />
        </span>
        <h2 className="ch-modal__title" id="ch-download-title">
          Download AuraLoop for macOS
        </h2>
        <p className="ch-modal__text" id="ch-download-desc">
          Universal binary for <strong>Apple Silicon (M1/M2/M3/M4)</strong> and <strong>Intel</strong> Macs running macOS 14 Sonoma or macOS 15+ Sequoia.
        </p>

        <div
          style={{
            margin: '20px 0',
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--ch-paper-2)',
            border: '1px solid var(--ch-line)',
            fontSize: '13.5px',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 600 }}>
            <span>AuraLoop-6.6.0.dmg</span>
            <span style={{ color: 'var(--ch-muted-text)' }}>~125 MB (with 4K Master)</span>
          </div>
          <p style={{ color: 'var(--ch-muted-text)', margin: 0 }}>
            Pre-bundled with the 4K 60fps &ldquo;Snowfall in Forest&rdquo; master. Ready for instant offline playback.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            className="ch-btn ch-btn--raised ch-btn--block"
            onClick={handleDownload}
            style={{ fontSize: '15px', padding: '12px 20px', justifyContent: 'center' }}
          >
            <DownloadIcon size={17} style={{ marginRight: 8 }} />
            {downloaded ? 'Downloading AuraLoop-6.6.0.dmg…' : 'Download Disk Image (.DMG)'}
          </button>

          {downloaded && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="ch-notice"
              style={{ margin: '8px 0 0' }}
            >
              <CheckIcon size={16} />
              <span>Download initiated. Open the .dmg and drag AuraLoop to /Applications.</span>
            </motion.div>
          )}

          <div style={{ marginTop: 8, borderTop: '1px solid var(--ch-line)', paddingTop: 14 }}>
            <p className="ch-kicker" style={{ marginBottom: 6 }}>Installation Steps</p>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: '12.5px', color: 'var(--ch-muted-text)', lineHeight: 1.6 }}>
              <li>Double-click the downloaded <code>AuraLoop-6.6.0.dmg</code>.</li>
              <li>Drag <strong>AuraLoop.app</strong> into your <strong>Applications</strong> shortcut.</li>
              <li>Launch from Spotlight or Launchpad and pick your live wallpaper!</li>
            </ol>
          </div>
        </div>
      </motion.div>
    </>
  );
}
