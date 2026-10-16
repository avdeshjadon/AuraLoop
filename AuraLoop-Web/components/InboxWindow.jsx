import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GROUPS, PEOPLE } from '../data.js';
import * as I from '../icons.jsx';

const SOLAR_PRESETS = [
  { id: 'dawn', label: 'Dawn', time: '06:45', elev: '+4.2°', filter: 'sepia(0.2) saturate(1.15) brightness(0.94)' },
  { id: 'noon', label: 'Solar Noon', time: '12:30', elev: '+62.8°', filter: 'brightness(1.05) contrast(1.02)' },
  { id: 'dusk', label: 'Sunset & Dusk', time: '18:15', elev: '+1.5°', filter: 'hue-rotate(-18deg) saturate(1.35) brightness(0.9)' },
  { id: 'night', label: 'Astronomical Night', time: '23:00', elev: '-24.0°', filter: 'hue-rotate(185deg) contrast(1.18) brightness(0.65)' },
];

const TABS = [
  { id: 'home', label: 'Home', icon: I.Inbox },
  { id: 'explore', label: 'Explore', icon: I.Compass },
  { id: 'favorites', label: 'Favorites', icon: I.Heart },
  { id: 'library', label: 'Library', icon: I.Layers },
];

export default function InboxWindow({ inbox, dispatch, regionRef }) {
  const { convos, order, selected, collapsed } = inbox;
  const current = selected ? convos[selected] : convos.snowfall || convos[order[0]];
  const person = current ? PEOPLE[current.person] : PEOPLE.snowfall;

  const [tab, setTab] = useState('home');
  const [solar, setSolar] = useState('noon');
  const [applied, setApplied] = useState(false);
  const [screensaver, setScreensaver] = useState(false);
  const [audio, setAudio] = useState(false);
  const [displayTarget, setDisplayTarget] = useState('main'); // 'main' | 'dual'

  const activeSolar = SOLAR_PRESETS.find(s => s.id === solar) || SOLAR_PRESETS[1];

  const handleApply = () => {
    setApplied(true);
    setTimeout(() => setApplied(false), 3800);
  };

  const handleScreensaver = () => {
    setScreensaver(true);
    setTimeout(() => setScreensaver(false), 3800);
  };

  const groups = GROUPS.map(g => ({
    ...g,
    items: order.filter(id => convos[id].group === g.id),
  }));

  const bgUrl = person?.photo
    ? `https://images.unsplash.com/photo-${person.photo}?auto=format&fit=crop&w=1280&q=85`
    : '/assets/png/icon.png';

  return (
    <div
      className="ta-win"
      ref={regionRef}
      role="region"
      aria-label="AuraLoop Native macOS Player"
      tabIndex={0}
      style={{
        display: 'grid',
        gridTemplateRows: '38px minmax(0, 1fr) 30px',
        height: '630px',
        background: '#181412',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 30px 90px -20px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* ---------------- macOS Window Titlebar ---------------- */}
      <div
        className="ta-win__bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          background: 'linear-gradient(180deg, #2a2420 0%, #1e1916 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#fff',
        }}
      >
        {/* Left: macOS Stoplights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '120px' }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56', border: '1px solid #e0443e', display: 'inline-block' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e', border: '1px solid #dea123', display: 'inline-block' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f', border: '1px solid #1aab29', display: 'inline-block' }} />
        </div>

        {/* Center: App Tabs */}
        <nav style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.3)', padding: 2, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 11px',
                  borderRadius: 6,
                  fontSize: '12px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  color: on ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                  background: on ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                  boxShadow: on ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                  transition: 'all 0.18s',
                }}
              >
                <Icon size={12} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Hardware Telemetry Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 9px',
              borderRadius: 999,
              background: 'rgba(40, 200, 64, 0.12)',
              border: '1px solid rgba(40, 200, 64, 0.25)',
              color: '#4ade80',
              fontSize: '11px',
              fontFamily: 'var(--ta-mono)',
              fontWeight: 500,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
            AVFoundation · 0.28% CPU
          </span>
          <button
            type="button"
            onClick={() => setAudio(!audio)}
            title={audio ? 'Ambient Audio On' : 'Ambient Audio Muted'}
            style={{
              border: 'none',
              background: audio ? 'rgba(228, 87, 46, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              color: audio ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
              borderRadius: 6,
              width: 24,
              height: 24,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            {audio ? <I.Volume size={13} /> : <I.VolumeX size={13} />}
          </button>
        </div>
      </div>

      {/* ---------------- Window Body ---------------- */}
      <div
        className="ta-win__body"
        style={{
          display: 'grid',
          gridTemplateColumns: '46px 210px minmax(0, 1fr)',
          minHeight: 0,
          background: '#15110f',
        }}
      >
        {/* Left Icon Rail */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            paddingTop: 12,
            background: '#1a1614',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span style={{ width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'rgba(228,87,46,0.2)', color: '#f97316' }}>
            <I.Monitor size={15} />
          </span>
          <span style={{ width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}>
            <I.Sun size={15} />
          </span>
          <span style={{ width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}>
            <I.Shield size={15} />
          </span>
          <span style={{ width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}>
            <I.Sliders size={15} />
          </span>
        </div>

        {/* Sidebar: Wallpaper Library */}
        <nav
          style={{
            minHeight: 0,
            overflowY: 'auto',
            padding: '12px 8px',
            background: 'linear-gradient(180deg, #1f1a17 0%, #171311 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            scrollbarWidth: 'none',
          }}
          aria-label="Wallpapers Catalog"
        >
          <div style={{ marginBottom: 10, padding: '0 4px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: '11px',
              }}
            >
              <span>🔍</span>
              <span>Search 4K Library…</span>
            </div>
          </div>

          {groups.map(g => {
            const isOpen = !collapsed[g.id];
            return (
              <div key={g.id} style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'toggle', group: g.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '4px 6px',
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.45)',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                  }}
                >
                  <span>{g.label}</span>
                  <I.Chevron size={11} style={{ transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                </button>

                {isOpen && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '3px 0 0 0', display: 'grid', gap: 2 }}>
                    {g.items.map(id => {
                      const c = convos[id];
                      const p = PEOPLE[c.person];
                      const on = id === (selected || 'snowfall');
                      const thumbUrl = p.photo
                        ? `https://images.unsplash.com/photo-${p.photo}?auto=format&fit=crop&w=80&q=75`
                        : '';
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => dispatch({ type: 'select', id })}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              padding: '5px 7px',
                              borderRadius: 7,
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              background: on ? 'rgba(228, 87, 46, 0.22)' : 'transparent',
                              borderLeft: on ? '2px solid #e4572e' : '2px solid transparent',
                              color: on ? '#fff' : 'rgba(255, 255, 255, 0.75)',
                              transition: 'background 0.15s',
                            }}
                          >
                            <img
                              src={thumbUrl}
                              alt=""
                              style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }}
                            />
                            <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: '12px', fontWeight: on ? 550 : 450 }}>
                              {p.name}
                            </span>
                            {on && (
                              <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 4px', borderRadius: 3, background: '#e4572e', color: '#fff' }}>
                                LIVE
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Main Stage: 4K Live Wallpaper Viewport & Controls */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            padding: 16,
          }}
        >
          {/* Background Wallpaper Image with Solar Atmosphere Grade */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: activeSolar.filter,
              transition: 'filter 0.8s ease',
              transform: 'scale(1.03)',
            }}
          />
          {/* Subtle Ambient Vignette / Scrim */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(15,12,10,0.65) 0%, rgba(15,12,10,0.1) 40%, rgba(15,12,10,0.75) 100%)',
            }}
          />

          {/* Top HUD: Wallpaper Title, Metadata, Multi-Display Pill */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                  {person.name}
                </h3>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#ffc107',
                    fontSize: '10.5px',
                    fontWeight: 600,
                  }}
                >
                  4K 60FPS
                </span>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '12px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {person.role} · AVFoundation Zero-Copy GPU Decode
              </p>
            </div>

            {/* Display Target Selector */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setDisplayTarget(d => (d === 'main' ? 'dual' : 'main'))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
              >
                <I.Monitor size={12} />
                <span>{displayTarget === 'main' ? 'Pro Display XDR (Primary)' : 'Spanned Dual Displays'}</span>
                <I.Chevron size={11} />
              </button>
            </div>
          </div>

          {/* Toast / Notification when action triggered */}
          <AnimatePresence>
            {(applied || screensaver) && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                style={{
                  position: 'relative',
                  zIndex: 4,
                  alignSelf: 'center',
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'rgba(20, 20, 20, 0.88)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#4ade80',
                  fontSize: '13px',
                  fontWeight: 550,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                <I.Check size={14} />
                <span>
                  {applied
                    ? `Set "${person.name}" as active desktop wallpaper!`
                    : `Synchronized "${person.name}" with Lock Screen & Screensaver!`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Controls HUD */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              background: 'rgba(18, 14, 12, 0.75)',
              backdropFilter: 'blur(16px)',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Top row: 24h Solar Scrubber */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 550 }}>
                <I.Sun size={12} style={{ color: '#f97316' }} />
                <span>SOLAR EPHEMERIS:</span>
                <span style={{ color: '#fff', fontFamily: 'var(--ta-mono)' }}>{activeSolar.time} ({activeSolar.elev})</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {SOLAR_PRESETS.map(s => {
                  const on = solar === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSolar(s.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 5,
                        fontSize: '11px',
                        border: 'none',
                        cursor: 'pointer',
                        background: on ? '#e4572e' : 'rgba(255,255,255,0.08)',
                        color: on ? '#fff' : 'rgba(255,255,255,0.65)',
                        fontWeight: on ? 600 : 450,
                        transition: 'all 0.15s',
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom row: Primary Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleApply}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 7,
                    border: 'none',
                    background: '#e4572e',
                    color: '#fff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(228,87,46,0.4)',
                  }}
                >
                  <I.Check size={13} />
                  <span>Set as Desktop Wallpaper</span>
                </button>

                <button
                  type="button"
                  onClick={handleScreensaver}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 7,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <I.Layers size={13} />
                  <span>Sync with Screensaver</span>
                </button>
              </div>

              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--ta-mono)' }}>
                ExtensionKit Sandbox: Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Window Telemetry Footer ---------------- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          background: '#120f0d',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '10.5px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'var(--ta-mono)',
        }}
      >
        <div style={{ display: 'flex', gap: 14 }}>
          <span>● Engine: VideoToolbox Hardware Decoder</span>
          <span>● Occlusion Sentry: Standby</span>
          <span>● Lock Screen: Synchronized</span>
        </div>
        <div>
          <span>CPU: 0.28% · Memory: 42 MB · Fan: 0 RPM</span>
        </div>
      </div>
    </div>
  );
}
