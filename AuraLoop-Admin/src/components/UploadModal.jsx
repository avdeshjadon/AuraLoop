import React, { useState, useRef } from 'react';
import { X, Upload, Film, Image as ImageIcon, Camera, Folder, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function UploadModal({
  isOpen,
  onClose,
  categories = [],
  onTriggerConfirmation,
  onUploadSuccess,
  showToast,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Abstract');
  const [customCategory, setCustomCategory] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoDuration, setVideoDuration] = useState(15);
  const [fps, setFps] = useState(60);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  if (!isOpen) return null;

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }

    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setVideoDuration(Math.round(tempVideo.duration) || 15);
      // Automatically grab a frame at 1s for the thumbnail
      tempVideo.currentTime = Math.min(1.0, tempVideo.duration / 2);
    };
    tempVideo.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = tempVideo.videoWidth || 3840;
      canvas.height = tempVideo.videoHeight || 2160;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
      const thumbData = canvas.toDataURL('image/jpeg', 0.9);
      setThumbnailPreview(thumbData);
    };
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnailPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide a wallpaper title.');
      return;
    }

    const targetFolder = category === '__custom__' ? customCategory.trim() : category;
    if (!targetFolder) {
      showToast('Please specify a folder category.');
      return;
    }

    const fileName = videoFile ? videoFile.name : `${title.replace(/\s+/g, '_')}_4k.mov`;

    // Trigger confirmation modal
    onTriggerConfirmation({
      title: 'Confirm Wallpaper Upload to R2',
      message: `Are you sure you want to upload "${title}" to Cloudflare R2 bucket under folder "${targetFolder}/"?`,
      targetName: `auraloop-wallpapers/${targetFolder}/${fileName}`,
      actionType: 'primary',
      confirmText: 'Upload to R2',
      onConfirm: () => {
        const newWallpaper = {
          id: `wp_${Date.now()}`,
          title: title.trim(),
          category: targetFolder,
          width: 3840,
          height: 2160,
          fps: Number(fps) || 60,
          duration: Number(videoDuration) || 15,
          sizeBytes: videoFile ? videoFile.size : 45200000,
          video: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${targetFolder}/${fileName}`,
          thumbnail: thumbnailPreview || `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${targetFolder}/thumb_${fileName}.jpg`,
          preview720: `https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/${targetFolder}/${fileName}`,
          publishedAt: new Date().toISOString(),
        };

        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } catch {}

        onUploadSuccess(newWallpaper);
        showToast(`"${title}" uploaded to R2 successfully!`);
        onClose();
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Upload Wallpaper</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Wallpaper Video File Dropzone - Clickable, Spacious & Centered with Video Camera Icon */}
          <div>
            <label
              style={{
                border: '1.5px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '32px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-input)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-orange)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--accent-orange-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-orange)',
                  marginBottom: 12,
                }}
              >
                <Camera size={24} />
              </div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 4 }}>
                {videoFile ? videoFile.name : 'Click to browse or drop video file'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {videoFile ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB` : 'Supports .mov, .mp4, .webm loops'}
              </p>
              <input
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleVideoChange}
              />
            </label>
          </div>

          {/* Title input (Automatically populated from video file name, editable) */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
              Wallpaper Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Neon Horizon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                fontSize: 13.5,
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Folder Category - Full Width, proper right padding/gap, no trailing slash */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
              Category Folder
            </label>
            <div style={{ paddingRight: 4 }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="__custom__">+ New Folder...</option>
              </select>
            </div>
          </div>

          {category === '__custom__' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                New Folder Name in R2
              </label>
              <input
                type="text"
                placeholder="e.g. Cyberpunk"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          {/* Thumbnail Preview / Auto-extracted badge */}
          {thumbnailPreview && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--bg-card-subtle)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <img
                src={thumbnailPreview}
                alt="Thumbnail"
                style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 'var(--radius-xs)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Auto-Extracted 4K Thumbnail
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Generated client-side via HTML5 canvas
                </div>
              </div>
              <label className="btn-light-pill" style={{ cursor: 'pointer', padding: '4px 10px', fontSize: 11 }}>
                <span>Custom Image</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleThumbnailChange}
                />
              </label>
            </div>
          )}

          {/* Modal Footer */}
          <div className="modal-footer" style={{ marginTop: 12 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-cta-btn">
              <Upload size={14} />
              <span>Continue to Upload</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
