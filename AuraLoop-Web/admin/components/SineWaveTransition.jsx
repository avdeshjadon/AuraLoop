import React, { useEffect, useRef } from 'react';

/**
 * SineWaveTransition
 * Authentic fluid sinusoidal wave transition for theme switching.
 * Reveals the live new theme behind the wave while the old theme is clipped out in front.
 * 3 layered sine waves with uneven magnitudes and wavelengths wash diagonally across the screen.
 * Zero orange border, smooth majestic speed, zero lag.
 */
export default function SineWaveTransition({
  origin = { x: 38, y: 44 },
  fromTheme = 'light',
  targetTheme = 'dark',
  snapshotEl = null,
  scrollY = 0,
  onComplete,
}) {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);
  const clipPathRef = useRef(null);

  // Mount the snapshot into the overlay container with strict fromTheme variables
  useEffect(() => {
    if (overlayRef.current && snapshotEl) {
      overlayRef.current.innerHTML = '';
      overlayRef.current.setAttribute('data-theme', fromTheme);
      overlayRef.current.style.backgroundColor = fromTheme === 'dark' ? '#0C0E12' : '#eeeae4';
      overlayRef.current.style.color = fromTheme === 'dark' ? '#F3F4F6' : '#17130f';

      snapshotEl.setAttribute('data-theme', fromTheme);
      snapshotEl.style.backgroundColor = fromTheme === 'dark' ? '#0C0E12' : '#eeeae4';
      snapshotEl.style.color = fromTheme === 'dark' ? '#F3F4F6' : '#17130f';
      snapshotEl.style.marginTop = `-${scrollY}px`;
      snapshotEl.style.width = '100vw';
      snapshotEl.style.pointerEvents = 'none';
      overlayRef.current.appendChild(snapshotEl);
    }
  }, [snapshotEl, scrollY, fromTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const x0 = origin.x ?? 38;
    const y0 = origin.y ?? 44;

    // Angle of travel from click origin to bottom-right corner
    const theta = Math.atan2(height - y0, width - x0);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    // Calculate maximum forward distance and lateral span
    const corners = [
      [0, 0],
      [width, 0],
      [0, height],
      [width, height],
    ];

    let maxForward = -Infinity;
    let minLateral = Infinity;
    let maxLateral = -Infinity;

    corners.forEach(([cx, cy]) => {
      const dx = cx - x0;
      const dy = cy - y0;
      const forward = dx * cos + dy * sin;
      const lateral = -dx * sin + dy * cos;
      if (forward > maxForward) maxForward = forward;
      if (lateral < minLateral) minLateral = lateral;
      if (lateral > maxLateral) maxLateral = lateral;
    });

    // Expand bounds with generous margins to guarantee complete coverage
    const Dmax = maxForward + 220;
    const Ymin = minLateral - 250;
    const Ymax = maxLateral + 250;
    const Xfront = Dmax + 700; // Far beyond the bottom-right corner

    // Screen coordinate converter: from local (forward, lateral) to screen (x, y)
    const toScreen = (fwd, lat) => [
      Math.round((x0 + fwd * cos - lat * sin) * 10) / 10,
      Math.round((y0 + fwd * sin + lat * cos) * 10) / 10,
    ];

    const isDark = targetTheme === 'dark';

    // Crest ripple colors (Clean theme-matched water mist, NO ORANGE)
    const crestStyles = {
      // Wave 1: Leading crest (largest swell)
      wave1Stroke: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)',
      wave1Width: 3,

      // Wave 2: Middle crest (medium swell)
      wave2Stroke: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      wave2Width: 2,

      // Wave 3: Trailing crest (subtle ripple)
      wave3Stroke: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      wave3Width: 1.5,
    };

    // Smooth, majestic duration (860ms as requested)
    const duration = 860;
    let startTime = null;
    let animationFrameId = null;

    // Fluid launch and gentle settle curve
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const renderFrame = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(1, elapsed / duration);
      const progress = easeInOutCubic(rawProgress);

      // Current distance along diagonal forward
      const currentForward = -120 + progress * (Dmax + 240);
      const timePhase = rawProgress * 7; // Smooth organic ripple phase

      // --- UNEVEN SINE WAVE PARAMETERS ---
      // Wave 1: Big magnitude, longer wavelength
      const amp1 = 52;
      const freq1 = 0.012; // ~520px cycle

      // Wave 2: Medium magnitude, offset frequency
      const amp2 = 26;
      const freq2 = 0.024; // ~260px cycle

      // Wave 3: Small fine harmonic
      const amp3 = 12;
      const freq3 = 0.038;

      // 1. UPDATE THE SVG CLIP PATH ON THE OLD THEME OVERLAY
      // The polygon covers the area IN FRONT of the wave (from wave line to Xfront)
      const pathPts = [];
      const [p1x, p1y] = toScreen(Xfront, Ymin);
      const [p2x, p2y] = toScreen(Xfront, Ymax);
      pathPts.push(`M ${p1x} ${p1y}`);
      pathPts.push(`L ${p2x} ${p2y}`);

      // Trace the undulating sine wave from Ymax down to Ymin
      const step = 8;
      for (let y = Ymax; y >= Ymin; y -= step) {
        const waveOffset =
          amp1 * Math.sin(y * freq1 + timePhase) +
          amp2 * Math.cos(y * freq2 - timePhase * 0.7);
        const fwd = currentForward + waveOffset;
        const [sx, sy] = toScreen(fwd, y);
        pathPts.push(`L ${sx} ${sy}`);
      }

      pathPts.push('Z');
      const pathD = pathPts.join(' ');

      if (clipPathRef.current) {
        clipPathRef.current.setAttribute('d', pathD);
      }
      if (overlayRef.current) {
        overlayRef.current.style.clipPath = `path('${pathD}')`;
        overlayRef.current.style.webkitClipPath = `path('${pathD}')`;
      }

      // 2. DRAW 3 LAYERED SINUSOIDAL WAVE CRESTS ON CANVAS (OVER THE BOUNDARY)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(x0, y0);
      ctx.rotate(theta);

      // Helper to draw a sine wave crest line
      const drawCrestLine = (distOffset, a1, f1, a2, f2, pOffset, strokeStyle, lineWidth) => {
        const base = currentForward + distOffset;
        ctx.beginPath();
        for (let y = Ymin; y <= Ymax; y += step) {
          const waveX =
            base +
            a1 * Math.sin(y * f1 + timePhase + pOffset) +
            a2 * Math.cos(y * f2 - timePhase * 0.6 + pOffset);
          if (y === Ymin) ctx.moveTo(waveX, y);
          else ctx.lineTo(waveX, y);
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      };

      if (rawProgress > 0.02 && rawProgress < 0.98) {
        // Wave 3 (Trailing fine ripple)
        drawCrestLine(-16, amp3, freq3, 6, 0.05, 0.8, crestStyles.wave3Stroke, crestStyles.wave3Width);

        // Wave 2 (Middle crest)
        drawCrestLine(0, amp2, freq2, 10, 0.03, 1.6, crestStyles.wave2Stroke, crestStyles.wave2Width);

        // Wave 1 (Leading main wave crest - large swell)
        drawCrestLine(18, amp1, freq1, amp2, freq2, 0, crestStyles.wave1Stroke, crestStyles.wave1Width);
      }

      ctx.restore();

      if (rawProgress < 1) {
        animationFrameId = requestAnimationFrame(renderFrame);
      } else {
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [origin.x, origin.y, targetTheme, onComplete]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* SVG ClipPath Definition for Old Theme Overlay */}
      <svg
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      >
        <defs>
          <clipPath id="sine-wave-clip" clipPathUnits="userSpaceOnUse">
            <path ref={clipPathRef} d="" />
          </clipPath>
        </defs>
      </svg>

      {/* Old Theme Snapshot Overlay (Clipped to area in front of wave) */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          pointerEvents: 'none',
          clipPath: 'url(#sine-wave-clip)',
          WebkitClipPath: 'url(#sine-wave-clip)',
        }}
      />

      {/* Water Wave Crest Ripples (Drawn along the wave boundary) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99995,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
