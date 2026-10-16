import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import * as I from '../icons.jsx';

export const APP_WALLPAPERS = [
  {
    id: 'waterfall',
    title: 'Waterfall Behind the Pines',
    category: 'Nature',
    res: '3840×2160',
    duration: '0:02',
    size: '2 MB',
    fps: 25,
    photo: '1432401990419-f50e835c415b',
  },
  {
    id: 'moonlit',
    title: 'Moonlit Night Lake',
    category: 'Minimalist',
    res: '3840×2160',
    duration: '0:03',
    size: '3 MB',
    fps: 60,
    photo: '1507525428034-b723cf961d3e',
  },
  {
    id: 'aurora',
    title: 'Aurora Reflections',
    category: 'Dynamic Solar',
    res: '3840×2160',
    duration: '0:04',
    size: '4 MB',
    fps: 60,
    photo: '1531366936337-7c912a4589a7',
  },
  {
    id: 'patagonia',
    title: 'Mountain Lake & Clouds',
    category: 'Aerial',
    res: '3840×2160',
    duration: '0:05',
    size: '5 MB',
    fps: 60,
    photo: '1464822759023-fed622ff2c3b',
  },
  {
    id: 'sakura',
    title: 'Sakura Blossoms',
    category: 'Nature',
    res: '3840×2160',
    duration: '0:03',
    size: '3 MB',
    fps: 60,
    photo: '1522383225653-ed111181a951',
  },
  {
    id: 'cabin',
    title: 'Starry Night Cabin',
    category: 'Night',
    res: '3840×2160',
    duration: '0:04',
    size: '4 MB',
    fps: 30,
    photo: '1518241353330-0f7941c2d9b5',
  },
  {
    id: 'fireplace',
    title: 'Forest Balcony Fireplace',
    category: 'Cozy',
    res: '3840×2160',
    duration: '0:03',
    size: '3 MB',
    fps: 30,
    photo: '1542314831-068cd1dbfeeb',
  },
  {
    id: 'ocean',
    title: 'Ocean Sunset Surf',
    category: 'Cinematic',
    res: '3840×2160',
    duration: '0:02',
    size: '2 MB',
    fps: 60,
    photo: '1509316975850-ff9c5deb0cd9',
  },
  {
    id: 'snowfall',
    title: 'Snowy Mountain Peaks',
    category: 'Alpine',
    res: '3840×2160',
    duration: '0:05',
    size: '4 MB',
    fps: 60,
    photo: '1517299321609-52687d1bc55a',
  },
  {
    id: 'fuji',
    title: 'Milky Way Over Fuji',
    category: 'Liquid Retina XDR',
    res: '3840×2160',
    duration: '0:04',
    size: '3 MB',
    fps: 60,
    photo: '1578637387939-43c525550085',
  },
];

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'explore', label: 'Explore' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'library', label: 'Library' },
];

export default function InboxWindow({ inbox, regionRef }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedId, setSelectedId] = useState('waterfall');
  const [favorite, setFavorite] = useState(false);
  const [appliedToast, setAppliedToast] = useState(false);

  // Sync with Hero floating card clicks if matched
  const selectedFromInbox = inbox?.selected;
  useEffect(() => {
    if (selectedFromInbox) {
      const match = APP_WALLPAPERS.find(w => w.id === selectedFromInbox);
      if (match) setSelectedId(match.id);
    }
  }, [selectedFromInbox]);

  const current = APP_WALLPAPERS.find(w => w.id === selectedId) || APP_WALLPAPERS[0];

  const handleApply = () => {
    setAppliedToast(true);
    setTimeout(() => setAppliedToast(false), 3200);
  };

  const bgUrl = `https://images.unsplash.com/photo-${current.photo}?auto=format&fit=crop&w=1400&q=85`;

  return (
    <div
      className="ta-win"
      ref={regionRef}
      role="region"
      aria-label="AuraLoop macOS Native Application"
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '670px',
        borderRadius: '18px',
        overflow: 'hidden',
        background: '#0a0d12',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow:
          '0 32px 100px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 60px -10px rgba(23, 30, 42, 0.6)',
        position: 'relative',
        userSelect: 'none',
        textAlign: 'left',
      }}
    >
      {/* ---------------- Top macOS Chrome Header ---------------- */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: 'linear-gradient(180deg, rgba(10, 13, 18, 0.75) 0%, rgba(10, 13, 18, 0) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Left: macOS Stoplights & App Squircle + Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Traffic Lights */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56', border: '1px solid #e0443e', display: 'inline-block' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e', border: '1px solid #dea123', display: 'inline-block' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f', border: '1px solid #1aab29', display: 'inline-block' }} />
          </div>

          {/* Squircle App Icon + Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginLeft: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: 'linear-gradient(145deg, #253347 0%, #101824 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 5px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <img
                src="/assets/svg/auraloop.svg"
                alt=""
                width="16"
                height="9"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
              />
            </div>
            <img
              src="/assets/svg/auraloop-wordmark.svg"
              alt="AuraLoop"
              height="11"
              style={{ height: '11px', width: 'auto', opacity: 0.9, letterSpacing: '0.1em' }}
            />
          </div>
        </div>

        {/* Center: Glass Pill Segmented Control */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px',
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          {TABS.map(t => {
            const on = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '5px 16px',
                  fontSize: '12.5px',
                  fontWeight: on ? 600 : 500,
                  cursor: 'pointer',
                  color: on ? '#0c0f14' : 'rgba(255, 255, 255, 0.7)',
                  background: on ? '#ffffff' : 'transparent',
                  boxShadow: on ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.2, 0.7, 0.2, 1)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Right: Glass Circle Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[
            { id: 'search', icon: '🔍', title: 'Search Catalog' },
            { id: 'sun', icon: '☀️', title: 'Appearance / Solar' },
            { id: 'plus', icon: '＋', title: 'Import Wallpaper' },
            { id: 'gear', icon: '⚙️', title: 'Preferences' },
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              title={btn.title}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(255, 255, 255, 0.09)',
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '12px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'background 0.2s',
              }}
            >
              <span>{btn.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- Main Content Body ---------------- */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          paddingTop: '60px',
        }}
      >
        {/* Full-bleed Wallpaper Hero Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            transition: 'background-image 0.5s ease',
          }}
        />

        {/* Film Vignette & Gradient Overlays (exact fade curve from macOS app) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(8,11,16,0.35) 0%, rgba(8,11,16,0) 30%, rgba(8,11,16,0.5) 65%, rgba(8,11,16,0.92) 88%, #080b10 100%)',
          }}
        />

        {/* Hero Content Overlay: FEATURED, Title, Meta, Buttons */}
        <div
          style={{
            position: 'relative',
            zIndex: 4,
            padding: '24px 44px 0',
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: '#38bdf8',
              textTransform: 'uppercase',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              marginBottom: 8,
            }}
          >
            FEATURED
          </div>

          {/* Heading */}
          <h2
            style={{
              margin: '0 0 10px 0',
              color: '#ffffff',
              fontSize: '38px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            {current.title}
          </h2>

          {/* Meta line & Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <span style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
              {current.category} · {current.res} · {current.duration} · {current.size}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                backdropFilter: 'blur(8px)',
              }}
            >
              4K · {current.fps}
            </span>
          </div>

          {/* Action Buttons: View Wallpaper & Heart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={handleApply}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 999,
                border: '1px solid rgba(255, 255, 255, 0.22)',
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(16px)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              <span>View Wallpaper</span>
              <span style={{ fontSize: '11px' }}>↗</span>
            </button>

            <button
              type="button"
              onClick={() => setFavorite(f => !f)}
              aria-label="Add to Favorites"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                background: favorite ? 'rgba(239, 68, 68, 0.28)' : 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(16px)',
                color: favorite ? '#ef4444' : '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span>{favorite ? '♥' : '♡'}</span>
            </button>
          </div>
        </div>

        {/* Applied Toast alert */}
        <AnimatePresence>
          {appliedToast && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              style={{
                position: 'absolute',
                top: '190px',
                left: '44px',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 10,
                background: 'rgba(12, 16, 22, 0.9)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                color: '#4ade80',
                fontSize: '12.5px',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <I.Check size={14} />
              <span>Applied "{current.title}" to Desktop Displays</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------------- Bottom Carousel & Shelf ---------------- */}
        <div
          style={{
            position: 'relative',
            zIndex: 4,
            padding: '0 44px 20px',
            background: 'linear-gradient(180deg, rgba(8,11,16,0) 0%, rgba(8,11,16,0.92) 28%, #080b10 100%)',
          }}
        >
          {/* Horizontal Wallpaper Thumbnails Strip (10 items) */}
          <div
            style={{
              display: 'flex',
              gap: 9,
              overflowX: 'auto',
              paddingBottom: 16,
              scrollbarWidth: 'none',
            }}
          >
            {APP_WALLPAPERS.map(wp => {
              const on = wp.id === selectedId;
              const thumb = `https://images.unsplash.com/photo-${wp.photo}?auto=format&fit=crop&w=180&q=75`;
              return (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setSelectedId(wp.id)}
                  style={{
                    flex: '0 0 68px',
                    height: '42px',
                    borderRadius: 7,
                    overflow: 'hidden',
                    border: on ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: on ? '0 0 14px rgba(255, 255, 255, 0.5), 0 2px 8px rgba(0,0,0,0.8)' : 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: '#151a22',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  title={wp.title}
                >
                  <img
                    src={thumb}
                    alt={wp.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      filter: on ? 'brightness(1.08)' : 'brightness(0.85)',
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* New Live Wallpapers Shelf Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 2px 0',
                  color: '#ffffff',
                  fontSize: '17px',
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                }}
              >
                New Live Wallpapers
              </h3>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.48)', fontSize: '11.5px' }}>
                The latest wallpapers added to the catalog
              </p>
            </div>

            {/* Paging Arrow Buttons (< >) */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                aria-label="Previous batch"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <span>❮</span>
              </button>
              <button
                type="button"
                aria-label="Next batch"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <span>❯</span>
              </button>
            </div>
          </div>

          {/* Two Shelf Preview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div
              style={{
                height: '76px',
                borderRadius: 10,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundImage: 'url(https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 8, left: 12, color: '#fff', fontSize: '11.5px', fontWeight: 600 }}>
                Cozy Hearth Glow · 4K 60fps
              </div>
            </div>

            <div
              style={{
                height: '76px',
                borderRadius: 10,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundImage: 'url(https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 8, left: 12, color: '#fff', fontSize: '11.5px', fontWeight: 600 }}>
                Tokyo Rain Reflections · Dynamic 24h
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
