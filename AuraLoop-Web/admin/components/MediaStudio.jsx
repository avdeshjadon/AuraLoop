import React, { useState, useRef } from 'react';
import {
  Video,
  Camera,
  Download,
  Upload,
  Sparkles,
  Sliders,
  Check,
  Copy,
  Info,
  Terminal,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

export default function MediaStudio({ showToast, onTriggerConfirmation }) {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoMeta, setVideoMeta] = useState({
    width: 0,
    height: 0,
    duration: 0,
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [capturedThumbnail, setCapturedThumbnail] = useState(null);
  const [thumbnailBlob, setThumbnailBlob] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('hevc_22');
  const [copiedCmd, setCopiedCmd] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle Video File Drop / Selection
  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setCapturedThumbnail(null);
    setThumbnailBlob(null);
  };

  const onLoadedMetadata = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    setVideoMeta({
      width: v.videoWidth,
      height: v.videoHeight,
      duration: v.duration,
    });
    // Seek to 1s by default for a nice frame
    v.currentTime = Math.min(1.0, v.duration / 2);
    setCurrentTime(v.currentTime);
  };

  // Capture Frame from Video using HTML5 Canvas at Full Native Resolution
  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to full native resolution
    canvas.width = v.videoWidth || 3840;
    canvas.height = v.videoHeight || 2160;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedThumbnail(dataUrl);

    canvas.toBlob((blob) => {
      setThumbnailBlob(blob);
    }, 'image/jpeg', 0.92);

    showToast('4K Thumbnail extracted successfully!');
  };

  const handleDownloadThumbnail = () => {
    if (!capturedThumbnail) return;
    const a = document.createElement('a');
    a.href = capturedThumbnail;
    const baseName = videoFile ? videoFile.name.replace(/\.[^/.]+$/, '') : 'wallpaper';
    a.download = `${baseName}_thumb.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Thumbnail downloaded!');
  };

  // Preset FFmpeg Commands for compression
  const presets = {
    hevc_22: {
      name: 'AuraLoop Ultra (H.265 / HEVC, CRF 22)',
      desc: 'Optimal 4K quality & high compression ratio for Apple Silicon macOS.',
      cli: `ffmpeg -i "${videoFile ? videoFile.name : 'input.mov'}" -c:v libx265 -crf 22 -preset slow -tag:v hvc1 -an -movflags +faststart output_4k.mp4`,
      script: 'node scripts/compress_wallpapers.mjs --compress',
    },
    h264_balanced: {
      name: 'AuraLoop Universal (H.264, CRF 23)',
      desc: 'Maximum cross-browser and older hardware compatibility.',
      cli: `ffmpeg -i "${videoFile ? videoFile.name : 'input.mov'}" -c:v libx264 -crf 23 -preset medium -an -movflags +faststart output_4k.mp4`,
      script: 'node scripts/compress_wallpapers.mjs --skip-thumbs',
    },
    batch_thumbnails: {
      name: 'AuraLoop Thumbnail Batch Generator',
      desc: 'Automatically scans missing thumbnails across all folders.',
      cli: 'node scripts/generate_thumbnails.mjs',
      script: 'node scripts/generate_thumbnails.mjs --concurrency 4',
    },
  };

  const handleCopyCli = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    showToast('Command copied to clipboard!');
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="media-studio-page">
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>
          Media Studio: 4K Thumbnail Extractor & Compression
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Extract high-resolution 4K frames natively in the browser, optimize video loops, and run CLI presets for Cloudflare R2 deployment.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* LEFT COLUMN: REAL-TIME FRAME EXTRACTOR */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera size={18} color="var(--accent-orange)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Client-Side 4K Frame Extractor
              </h2>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: 'var(--status-completed-bg)',
                color: 'var(--status-completed-text)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              100% In-Browser (No Server)
            </span>
          </div>

          {/* Video Dropzone / Player */}
          {!videoUrl ? (
            <label
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                cursor: 'pointer',
                background: 'var(--bg-card-subtle)',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'var(--accent-orange-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-orange)',
                }}
              >
                <Video size={24} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Click to select or drop a wallpaper video
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Supports .mov, .mp4, .webm (Up to 4K / 8K UHD)
                </p>
              </div>
              <input
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleVideoSelect}
              />
            </label>
          ) : (
            <div>
              <div
                style={{
                  position: 'relative',
                  background: '#000',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  maxHeight: 320,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  onLoadedMetadata={onLoadedMetadata}
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }}
                />
              </div>

              {/* Scrubber & Metadata */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>
                    Timestamp: {currentTime.toFixed(2)}s / {videoMeta.duration.toFixed(2)}s
                  </span>
                  <span>
                    Native: {videoMeta.width} x {videoMeta.height}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={videoMeta.duration || 10}
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    setCurrentTime(time);
                    if (videoRef.current) videoRef.current.currentTime = time;
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent-orange)' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="primary-cta-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleCaptureFrame}
                >
                  <Camera size={16} />
                  <span>Capture 4K Frame at {currentTime.toFixed(2)}s</span>
                </button>
                <label className="btn-light-pill" style={{ cursor: 'pointer' }}>
                  <span>Change Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    onChange={handleVideoSelect}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Off-screen canvas for native resolution rendering */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Captured Preview Section */}
          {capturedThumbnail && (
            <div
              style={{
                marginTop: 20,
                paddingTop: 18,
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Extracted Thumbnail Preview ({videoMeta.width}x{videoMeta.height})
                </span>
                <button
                  className="btn-light-pill"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                  onClick={handleDownloadThumbnail}
                >
                  <Download size={14} />
                  <span>Download JPG</span>
                </button>
              </div>
              <img
                src={capturedThumbnail}
                alt="Captured frame"
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  maxHeight: 220,
                  objectFit: 'cover',
                }}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: VIDEO COMPRESSION PRESETS & CLI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sliders size={18} color="var(--accent-orange)" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                AuraLoop Compression Presets
              </h3>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Select an optimization target for your 4K wallpapers. For web hosting on Vercel or Cloudflare, high-efficiency HEVC reduces bandwidth by over 65% with zero visual quality loss.
            </p>

            {/* Presets List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {Object.entries(presets).map(([key, item]) => (
                <div
                  key={key}
                  onClick={() => setSelectedPreset(key)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${selectedPreset === key ? 'var(--accent-orange)' : 'var(--border-color)'}`,
                    background: selectedPreset === key ? 'var(--accent-orange-light)' : 'var(--bg-card-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                    {selectedPreset === key && <Check size={15} color="var(--accent-orange)" />}
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Command Generator */}
            <div style={{ background: 'var(--card-dark-bg)', borderRadius: 'var(--radius-md)', padding: '16px', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <Terminal size={14} />
                  <span>Terminal FFmpeg Command</span>
                </div>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: 'var(--accent-orange)',
                    fontWeight: 600,
                  }}
                  onClick={() => handleCopyCli(presets[selectedPreset].cli)}
                >
                  {copiedCmd ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11.5,
                  color: '#A7F3D0',
                  wordBreak: 'break-all',
                  lineHeight: 1.5,
                }}
              >
                {presets[selectedPreset].cli}
              </div>
            </div>

            {/* AuraLoop Script Helper */}
            <div
              style={{
                marginTop: 14,
                padding: '12px',
                background: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                Local Automation Script Included:
              </div>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-orange)' }}>
                {presets[selectedPreset].script}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
