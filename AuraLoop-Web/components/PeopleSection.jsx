import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Monitor,
  Sun,
  Moon,
  Clock,
  Bolt,
  Check,
  Play,
  Pause,
  Shield,
  Sliders,
  ArrowRight,
} from '../icons.jsx';

const move = { type: 'spring', bounce: 0, duration: 0.65 };

const MODES = [
  { id: 'classic', label: 'Static Desktop' },
  { id: 'grouped', label: 'AuraLoop 4K Motion' },
];

const COPY = {
  classic:
    'A static desktop leaves you staring at frozen pixels all day, disconnected from natural light cycles, circadian rhythms, and multi-display pacing.',
  grouped:
    'AuraLoop animates your Mac with cinematic 4K 60fps dynamic atmospheres, tracking solar elevation with zero fan noise or CPU overhead.',
};

const ATMOSPHERES = [
  {
    id: 'aurora',
    name: 'Aurora Lake',
    category: 'Dynamic Solar 24h',
    location: 'Jökulsárlón, Iceland',
    fps: '60.00 fps',
    res: '4K Ultra-HD',
    codec: 'HEVC 10-bit P3 HDR',
    cpu: '0.28%',
    solarCapable: true,
    thumb: 'https://cdn.murowallpaper.com/thumbs/e4163448-3c37-4b25-bd12-a881af70bed4.jpg',
    desc: 'Transitions seamlessly from daytime glacial reflections into dancing emerald aurora curtains.',
    phases: {
      dawn: {
        time: '06:30 AM',
        elevation: '+2.4°',
        label: 'Dawn Mist',
        desc: 'Soft 3200K golden sunrise creeping through glacial ridges',
        img: 'https://cdn.murowallpaper.com/thumbs/0c68cfdf-0de9-4629-a8a6-51fd6d72ee92.jpg',
      },
      noon: {
        time: '12:45 PM',
        elevation: '+62.1°',
        label: 'Solar Noon',
        desc: 'High-noon clarity, crystal alpine reflections & vibrant azure sky',
        img: 'https://cdn.murowallpaper.com/thumbs/b09bb416-5cb6-4607-b611-c85a5e3edf15.jpg',
      },
      dusk: {
        time: '06:15 PM',
        elevation: '+5.8°',
        label: 'Golden Hour',
        desc: 'Deep ember sunset casting long violet shadows over the water',
        img: 'https://cdn.murowallpaper.com/thumbs/7f22ad52-9228-4de9-aa57-c15e93ed619e.jpg',
      },
      night: {
        time: '11:45 PM',
        elevation: '-24.6°',
        label: 'Night Aurora',
        desc: 'Pitch OLED black sky with glowing emerald aurora borealis waves',
        img: 'https://cdn.murowallpaper.com/thumbs/e4163448-3c37-4b25-bd12-a881af70bed4.jpg',
      },
    },
  },
  {
    id: 'snowfall',
    name: 'Snowfall in Forest',
    category: 'Ambient Serenity',
    location: 'Hokkaido, Japan',
    fps: '60.00 fps',
    res: '4K Ultra-HD',
    codec: 'HEVC 10-bit P3',
    cpu: '0.26%',
    solarCapable: false,
    thumb: 'https://cdn.murowallpaper.com/thumbs/c0b0484f-80b9-40f3-bf02-03cd0886ba82.jpg',
    desc: 'Whisper-quiet infinite snowfall loop optimized for zero-distraction deep work.',
  },
  {
    id: 'fuji',
    name: 'Milky Way Over Fuji',
    category: 'Mini-LED XDR Night',
    location: 'Mount Fuji, Japan',
    fps: '60.00 fps',
    res: '4K Ultra-HD',
    codec: 'Apple ProRes HDR',
    cpu: '0.31%',
    solarCapable: false,
    thumb: 'https://cdn.murowallpaper.com/thumbs/df6d9998-abe2-47f6-9c59-724d541228a4.jpg',
    desc: 'Calibrated for Liquid Retina XDR backlights with 0.00 nits true black levels.',
  },
  {
    id: 'patagonia',
    name: 'Patagonia Glacial Aerial',
    category: 'Dual XDR Spanned',
    location: 'Los Glaciares, Andes',
    fps: '60.00 fps',
    res: '4K Ultra-HD',
    codec: 'Zero-Copy Metal HEVC',
    cpu: '0.29%',
    solarCapable: false,
    thumb: 'https://cdn.murowallpaper.com/thumbs/27413b79-8ee3-4c29-ab50-9f7fb9943289.jpg',
    desc: 'High-altitude panoramic drift frame-locked across external Studio Displays.',
  },
];

const SOLAR_PHASES = [
  { id: 'dawn', label: 'Dawn', icon: '🌅', time: '06:30 AM', angle: '+2.4°' },
  { id: 'noon', label: 'Noon', icon: '☀️', time: '12:45 PM', angle: '+62.1°' },
  { id: 'dusk', label: 'Dusk', icon: '🌇', time: '06:15 PM', angle: '+5.8°' },
  { id: 'night', label: 'Night', icon: '🌌', time: '11:45 PM', angle: '-24.6°' },
];

export default function PeopleSection() {
  const [mode, setMode] = useState('grouped');
  const [activeAtmosphereId, setActiveAtmosphereId] = useState('aurora');
  const [solarPhase, setSolarPhase] = useState('night');

  const activeAtmosphere =
    ATMOSPHERES.find(a => a.id === activeAtmosphereId) || ATMOSPHERES[0];

  // Resolve active image based on mode and solar phase
  let currentImage = activeAtmosphere.thumb;
  let currentTime = '11:42 PM';
  let currentSolarAngle = '-24.6°';

  if (mode === 'classic') {
    // Static desktop is stuck in harsh midday light even at 11:42 PM!
    currentImage = 'https://cdn.murowallpaper.com/thumbs/b09bb416-5cb6-4607-b611-c85a5e3edf15.jpg';
    currentTime = '11:42 PM';
  } else {
    if (activeAtmosphere.solarCapable && activeAtmosphere.phases) {
      const p = activeAtmosphere.phases[solarPhase] || activeAtmosphere.phases.night;
      currentImage = p.img;
      currentTime = p.time;
      currentSolarAngle = p.elevation;
    } else {
      currentTime = '09:15 PM';
    }
  }

  return (
    <section id="wallpapers" className="ta-sec ta-people" aria-labelledby="ta-people-title" tabIndex={-1}>
      <div className="ta-wrap">
        {/* Section Header */}
        <div className="ta-sec__head" data-reveal>
          <div className="ta-sec__title">
            <p className="ta-eyebrow">
              <span>01</span> Atmosphere
            </p>
            <h2 id="ta-people-title" className="ta-h2">
              Sorted by atmosphere, not by static pixels.
            </h2>
          </div>
          <div className="ta-sec__aside">
            <p className="ta-lead ta-people__copy" aria-live="polite">
              {COPY[mode]}
            </p>
            <div className="ta-seg" role="group" aria-label="Compare desktop layouts">
              {MODES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={`ta-seg__btn${mode === m.id ? ' is-on' : ''}`}
                  aria-pressed={mode === m.id}
                  onClick={() => setMode(m.id)}
                >
                  {mode === m.id && <motion.span layoutId="ta-seg-hl" className="ta-seg__hl" transition={move} />}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Interactive Showcase */}
        <div className="ta-atm-container" data-reveal>
          {/* Apple Studio / Pro Display Frame */}
          <div className="ta-mac-frame">
            {/* macOS Menu Bar */}
            <div className="ta-mac-menubar">
              <div className="ta-mac-menubar__left">
                <span className="ta-mac-apple"></span>
                <span className="ta-mac-app-title">AuraLoop</span>
                <span className="ta-mac-menu-item">Atmosphere</span>
                <span className="ta-mac-menu-item">Displays</span>
                <span className="ta-mac-menu-item">Solar</span>
                <span className="ta-mac-menu-item">Window</span>
              </div>
              <div className="ta-mac-menubar__right">
                <span className="ta-mac-status-chip">
                  <span className={`ta-mac-dot ${mode === 'grouped' ? 'is-live' : 'is-frozen'}`} />
                  {mode === 'grouped' ? '4K 60fps' : 'Frozen SDR'}
                </span>
                <span className="ta-mac-icon-sym" title="Connected Display">
                  <Monitor size={13} />
                </span>
                <span className="ta-mac-clock">{currentTime}</span>
              </div>
            </div>

            {/* Display Viewport Screen */}
            <div className={`ta-mac-screen ${mode === 'classic' ? 'is-static' : 'is-dynamic'}`}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${mode}-${currentImage}`}
                  src={currentImage}
                  alt={mode === 'classic' ? 'Frozen static wallpaper' : activeAtmosphere.name}
                  className="ta-mac-screen__bg"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              </AnimatePresence>

              {/* Static Mode Watermark & Overlay */}
              {mode === 'classic' && (
                <div className="ta-mac-overlay ta-mac-overlay--static">
                  <div className="ta-mac-hud ta-mac-hud--alert">
                    <div className="ta-mac-hud__badge">
                      <span className="ta-mac-hud__dot is-frozen" />
                      <span>STATIC DESKTOP · FROZEN</span>
                    </div>
                    <div className="ta-mac-hud__rows">
                      <div className="ta-mac-hud__row">
                        <span>Format:</span>
                        <strong>Single 8-bit SDR JPEG</strong>
                      </div>
                      <div className="ta-mac-hud__row">
                        <span>Frame Rate:</span>
                        <strong>0.00 fps (Frozen)</strong>
                      </div>
                      <div className="ta-mac-hud__row">
                        <span>Solar Sync:</span>
                        <strong className="is-danger">Disconnected</strong>
                      </div>
                      <div className="ta-mac-hud__row">
                        <span>Time Disconnect:</span>
                        <strong className="is-warning">Midday 12:00 PM sun at 11:42 PM</strong>
                      </div>
                    </div>
                  </div>

                  <div className="ta-mac-static-banner">
                    <span className="ta-mac-static-icon">⚠️</span>
                    <div className="ta-mac-static-text">
                      <strong>Static Pixels Cause Mental & Visual Fatigue</strong>
                      <p>Stuck at midday glare while working late at 11:42 PM with zero circadian adaptation.</p>
                    </div>
                  </div>

                  <div className="ta-mac-locked-bar">
                    <span>🔒 Solar Progression Locked</span>
                    <small>Static image files cannot respond to sunrise, sunset, or geographic sun coordinates.</small>
                  </div>
                </div>
              )}

              {/* AuraLoop Motion Mode HUD & Controls */}
              {mode === 'grouped' && (
                <div className="ta-mac-overlay ta-mac-overlay--dynamic">
                  {/* Top-Left Telemetry HUD */}
                  <div className="ta-mac-hud ta-mac-hud--dynamic">
                    <div className="ta-mac-hud__badge">
                      <span className="ta-mac-hud__dot is-live" />
                      <span>AURALOOP ENGINE · 4K 60.00 FPS</span>
                    </div>
                    <div className="ta-mac-hud__rows">
                      <div className="ta-mac-hud__row">
                        <span>Decoder:</span>
                        <strong>Apple Silicon AVFoundation</strong>
                      </div>
                      <div className="ta-mac-hud__row">
                        <span>CPU Overhead:</span>
                        <strong className="is-good">{activeAtmosphere.cpu} (Whisper Quiet)</strong>
                      </div>
                      <div className="ta-mac-hud__row">
                        <span>Color Gamut:</span>
                        <strong>10-bit Apple Wide P3 HDR</strong>
                      </div>
                      <div className="ta-mac-hud__row">
                        <span>Lock Screen:</span>
                        <strong className="is-good">ExtensionKit Synced</strong>
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Solar Angle Chip */}
                  {activeAtmosphere.solarCapable && (
                    <div className="ta-mac-solar-chip">
                      <Sun size={14} />
                      <span>Sun Elevation: <strong>{currentSolarAngle}</strong></span>
                    </div>
                  )}

                  {/* Bottom Interactive Solar Keyframe Bar (if dynamic solar) */}
                  {activeAtmosphere.solarCapable && (
                    <div className="ta-mac-solar-bar">
                      <div className="ta-mac-solar-bar__label">
                        <Clock size={13} />
                        <span>24-Hour Solar Keyframes:</span>
                      </div>
                      <div className="ta-mac-solar-bar__pills">
                        {SOLAR_PHASES.map(ph => (
                          <button
                            key={ph.id}
                            type="button"
                            className={`ta-solar-pill ${solarPhase === ph.id ? 'is-active' : ''}`}
                            onClick={() => setSolarPhase(ph.id)}
                            title={`Switch to ${ph.label} (${ph.time})`}
                          >
                            <span className="ta-solar-pill__icon">{ph.icon}</span>
                            <span className="ta-solar-pill__name">{ph.label}</span>
                            <span className="ta-solar-pill__time">{ph.time}</span>
                            <span className="ta-solar-pill__angle">{ph.angle}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Apple Monitor Chin & Stand */}
            <div className="ta-mac-chin">
              <span className="ta-mac-chin__logo"></span>
            </div>
          </div>

          <div className="ta-mac-stand" aria-hidden="true">
            <div className="ta-mac-stand__stem" />
            <div className="ta-mac-stand__base" />
          </div>

          {/* Under-Display Section: Mode-Specific Insights & Controls */}
          {mode === 'classic' ? (
            <div className="ta-static-insights">
              <div className="ta-static-insights__grid">
                <div className="ta-static-card">
                  <div className="ta-static-card__icon is-frozen">🧊</div>
                  <h3 className="ta-static-card__title">Frozen Pixels vs. Living Motion</h3>
                  <p className="ta-static-card__desc">
                    Staring at the same still image for 8+ hours causes subconscious visual stagnation. AuraLoop
                    provides continuous 60fps organic loops that keep your workspace calm and alive without distraction.
                  </p>
                  <div className="ta-static-card__tag">Static: 0.00 fps · AuraLoop: 60.00 fps</div>
                </div>

                <div className="ta-static-card">
                  <div className="ta-static-card__icon is-warning">🌓</div>
                  <h3 className="ta-static-card__title">Night Glare vs. Solar Ephemeris</h3>
                  <p className="ta-static-card__desc">
                    Working late with a static midday desktop blares blinding light into your dark room. AuraLoop computes
                    real-world solar elevation from your coordinates, gently shifting into deep night tones.
                  </p>
                  <div className="ta-static-card__tag">Static: Disconnected · AuraLoop: 24h Solar</div>
                </div>

                <div className="ta-static-card">
                  <div className="ta-static-card__icon is-ember">⚡</div>
                  <h3 className="ta-static-card__title">Legacy Drain vs. 0.28% Apple Silicon</h3>
                  <p className="ta-static-card__desc">
                    Old live wallpaper software spun laptop fans and drained battery. AuraLoop bypasses CPU decoding
                    completely, streaming directly through the Apple Silicon Media Engine with 0.28% footprint.
                  </p>
                  <div className="ta-static-card__tag">Legacy: 15–30% CPU · AuraLoop: 0.28% CPU</div>
                </div>
              </div>

              {/* Instant Switch CTA Banner */}
              <div className="ta-static-cta">
                <div className="ta-static-cta__text">
                  <strong>Ready to experience cinematic 4K motion on your Mac?</strong>
                  <p>Preview AuraLoop's living atmospheres with zero fan noise.</p>
                </div>
                <button
                  type="button"
                  className="ta-static-cta__btn"
                  onClick={() => setMode('grouped')}
                >
                  <span>Switch to AuraLoop 4K Motion</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="ta-dynamic-catalog">
              <div className="ta-dynamic-catalog__header">
                <div className="ta-dynamic-catalog__titles">
                  <span className="ta-dynamic-catalog__eyebrow">Interactive Selection</span>
                  <h3 className="ta-dynamic-catalog__title">Explore Curated Living Atmospheres</h3>
                </div>
                <div className="ta-dynamic-catalog__note">
                  Click any card to preview in real-time on the Mac display above.
                </div>
              </div>

              {/* 4 Interactive Atmosphere Cards */}
              <div className="ta-atm-grid">
                {ATMOSPHERES.map(atm => {
                  const isActive = activeAtmosphereId === atm.id;
                  return (
                    <button
                      key={atm.id}
                      type="button"
                      className={`ta-atm-card ${isActive ? 'is-active' : ''}`}
                      onClick={() => {
                        setActiveAtmosphereId(atm.id);
                        if (atm.solarCapable && !solarPhase) setSolarPhase('night');
                      }}
                      aria-pressed={isActive}
                    >
                      <div className="ta-atm-card__thumb-wrap">
                        <img
                          src={atm.thumb}
                          alt={atm.name}
                          className="ta-atm-card__thumb"
                          loading="lazy"
                        />
                        <div className="ta-atm-card__overlay">
                          <span className="ta-atm-card__play">
                            <Play size={14} />
                          </span>
                        </div>
                        <span className="ta-atm-card__badge">{atm.category}</span>
                        {isActive && (
                          <span className="ta-atm-card__live-pill">
                            <span className="ta-atm-card__live-dot" />
                            Active on Display
                          </span>
                        )}
                      </div>

                      <div className="ta-atm-card__content">
                        <div className="ta-atm-card__top">
                          <strong className="ta-atm-card__name">{atm.name}</strong>
                          <span className="ta-atm-card__location">{atm.location}</span>
                        </div>
                        <p className="ta-atm-card__desc">{atm.desc}</p>
                        <div className="ta-atm-card__specs">
                          <span className="ta-atm-spec">{atm.fps}</span>
                          <span className="ta-atm-spec">{atm.res}</span>
                          <span className="ta-atm-spec is-ember">{atm.cpu} CPU</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="ta-dynamic-summary">
                <span className="ta-dynamic-summary__icon">✨</span>
                <p>
                  <strong>4 Curated Master Atmospheres</strong> synchronized across your primary desktop, multi-display array, and macOS Lock Screen with <strong>0.28% CPU</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
