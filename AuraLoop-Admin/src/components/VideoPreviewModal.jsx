import React, { useState } from 'react';
import { X, Play, Download, Copy, Check, ExternalLink, Film, Sparkles } from 'lucide-react';
import { formatBytes } from '../services/catalogService';

export default function VideoPreviewModal({ wallpaper, onClose, showToast }) {
  const [copied, setCopied] = useState(false);

  if (!wallpaper) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(wallpaper.video);
    setCopied(true);
    showToast('Video URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720, padding: 24 }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--accent-orange-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-orange)',
              }}
            >
              <Film size={18} />
            </div>
            <div>
              <h3 className="modal-title">{wallpaper.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {wallpaper.category} • {wallpaper.fps || 60} FPS • {wallpaper.duration || 15}s
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Video Player */}
        <div
          style={{
            background: '#050709',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            maxHeight: 380,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            border: '1px solid var(--border-color)',
          }}
        >
          <video
            src={wallpaper.video}
            poster={wallpaper.thumbnail}
            controls
            autoPlay
            loop
            playsInline
            style={{ width: '100%', maxHeight: 380, objectFit: 'contain' }}
          />
        </div>

        {/* Wallpaper Specs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 20,
            background: 'var(--bg-card-subtle)',
            padding: 14,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Resolution</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {wallpaper.width && wallpaper.height ? `${wallpaper.width}x${wallpaper.height}` : '3840x2160 (4K)'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>File Size</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatBytes(wallpaper.sizeBytes)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Frame Rate</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {wallpaper.fps || 60} fps smooth
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Duration</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {wallpaper.duration ? `${wallpaper.duration}s` : '15s'} seamless loop
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn-light-pill" onClick={handleCopy}>
            {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied URL' : 'Copy CDN URL'}</span>
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={wallpaper.video}
              target="_blank"
              rel="noreferrer"
              className="btn-light-pill"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={14} />
              <span>Open in New Tab</span>
            </a>
            <button className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
