import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import * as I from '../icons.jsx';
import EXPLORE_DATA from '../explore_wallpapers.json';

// Authentic 10 Featured wallpapers directly from AuraLoop catalog
export const FEATURED_WALLPAPERS = [
  {
    id: '0c68cfdf-0de9-4629-a8a6-51fd6d72ee92',
    title: 'Waterfall Behind the Pines',
    category: 'Nature',
    res: '3840×2160',
    duration: '0:02',
    size: '2 MB',
    fps: 25,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Waterfall_Behind_the_Pines_thumb.jpg',
  },
  {
    id: '7f22ad52-9228-4de9-aa57-c15e93ed619e',
    title: 'Moonlit Shore',
    category: 'Nature',
    res: '3840×2160',
    duration: '0:21',
    size: '40 MB',
    fps: 30,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Moonlit_Shore_thumb.jpg',
  },
  {
    id: 'e4163448-3c37-4b25-bd12-a881af70bed4',
    title: 'Aurora Lake',
    category: 'Dynamic Solar',
    res: '3840×2160',
    duration: '0:30',
    size: '55 MB',
    fps: 25,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Aurora_Lake_thumb.jpg',
  },
  {
    id: '27413b79-8ee3-4c29-ab50-9f7fb9943289',
    title: 'Moonlight Lake',
    category: 'Nature',
    res: '3840×2160',
    duration: '0:30',
    size: '119 MB',
    fps: 30,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Moonlight_Lake_thumb.jpg',
  },
  {
    id: 'b09bb416-5cb6-4607-b611-c85a5e3edf15',
    title: 'Sakura Light',
    category: 'Nature',
    res: '3840×2160',
    duration: '0:30',
    size: '31 MB',
    fps: 30,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Sakura_Light_thumb.jpg',
  },
  {
    id: '77d3b04d-2d42-4870-9ef1-738b9faed0fb',
    title: 'Comet Night',
    category: 'Night',
    res: '3840×2160',
    duration: '0:18',
    size: '88 MB',
    fps: 30,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Comet_Night_thumb.jpg',
  },
  {
    id: '4b24a85f-6aa4-4bde-b446-eec9e24f2d71',
    title: 'Jungle Fireplace Porch',
    category: 'Cozy',
    res: '3840×2160',
    duration: '0:50',
    size: '193 MB',
    fps: 37,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Jungle_Fireplace_Porch_thumb.jpg',
  },
  {
    id: '6fe051c0-67f6-4593-ac90-2f21ac715ee9',
    title: 'Night Shore',
    category: 'Nature',
    res: '3840×2160',
    duration: '0:27',
    size: '50 MB',
    fps: 30,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Night_Shore_thumb.jpg',
  },
  {
    id: '60679567-7008-4f7b-81c3-7369f3e9871d',
    title: 'Flight Over Snowy Peaks',
    category: 'Aerial',
    res: '3840×2160',
    duration: '0:27',
    size: '186 MB',
    fps: 60,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Flight_Over_Snowy_Peaks_thumb.jpg',
  },
  {
    id: 'df6d9998-abe2-47f6-9c59-724d541228a4',
    title: 'Milky Way Over Fuji',
    category: 'Liquid Retina XDR',
    res: '3840×2160',
    duration: '0:23',
    size: '26 MB',
    fps: 60,
    thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Milky_Way_Over_Fuji_thumb.jpg',
  },
];

// New Live Wallpapers (First Shelf - 6 items preloaded)
export const NEW_WALLPAPERS = [
  [
    {
      id: '1879b526-bec4-4a56-951c-c34abc7ef6ae',
      title: 'Zenitsu Agatsuma (Demon Slayer)',
      category: 'Anime',
      fps: 30,
      res: '3840×2160',
      duration: '0:16',
      size: '41 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Anime/Zenitsu_Agatsuma_(Demon_Slayer)_thumb.jpg',
    },
    {
      id: '4378ed93-d644-41f3-8624-19c5c2e14e20',
      title: 'Ghost Face (Dead by Daylight)',
      category: 'Video Games',
      fps: 30,
      res: '3840×2160',
      duration: '0:05',
      size: '9 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Video_Games/Ghost_Face_(Dead_by_Daylight)_thumb.jpg',
    },
    {
      id: '21ed9728-6eeb-4c06-b108-5ffe5748a473',
      title: 'Lamborghini Revuelto',
      category: 'Cars',
      fps: 50,
      res: '3840×2160',
      duration: '0:05',
      size: '18 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Cars/Lamborghini_Revuelto_thumb.jpg',
    },
  ],
  [
    {
      id: 'a26bb5af-f9e4-48b1-806f-dd9a498c6e81',
      title: 'Watercolor Island',
      category: 'Nature',
      fps: 60,
      res: '3840×2160',
      duration: '0:22',
      size: '80 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Nature/Watercolor_Island_thumb.jpg',
    },
    {
      id: '311953c1-eec1-47e7-af4d-4d7b600626fc',
      title: 'Cyberpunk Soldiers',
      category: 'Sci-fi',
      fps: 30,
      res: '3840×2160',
      duration: '0:10',
      size: '25 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Sci-fi/Cyberpunk_Soldiers_thumb.jpg',
    },
    {
      id: '7eff1a50-72fc-4e04-9a7f-37ba36a04a22',
      title: 'Murder Drones',
      category: 'Movies',
      fps: 30,
      res: '3840×2160',
      duration: '0:08',
      size: '19 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Movies/Murder_Drones_thumb.jpg',
    },
  ],
];

// AuraLoop's Pick (Second Shelf - 6 items preloaded, matches Screenshot 2)
export const PICKS_WALLPAPERS = [
  [
    {
      id: 'a7b055f8-2fce-4cff-8220-11768ac3307d',
      title: 'Simon Riley (Call of Duty)',
      category: 'Video Games',
      fps: 60,
      res: '3840×2160',
      duration: '0:14',
      size: '34 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Video_Games/Simon_Riley_(Call_of_Duty)_thumb.jpg',
    },
    {
      id: 'c6a5c560-f510-40f4-b189-f95707432d3f',
      title: 'Supra Nights',
      category: 'Anime',
      fps: 30,
      res: '3840×2160',
      duration: '0:10',
      size: '28 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Anime/Supra_Nights_thumb.jpg',
    },
    {
      id: '78ae0a32-1980-4302-a073-77ee2fc6581c',
      title: 'Silver Surfer in Deep Space',
      category: 'Movies',
      fps: 30,
      res: '3840×2160',
      duration: '0:12',
      size: '22 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Movies/Silver_Surfer_in_Deep_Space_thumb.jpg',
    },
  ],
  [
    {
      id: 'a9193ba6-eb4b-4937-9de6-62de88071850',
      title: 'Pixelwave Horizon',
      category: 'Abstract',
      fps: 60,
      res: '3840×2160',
      duration: '0:18',
      size: '64 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Abstract/Pixelwave_Horizon_thumb.jpg',
    },
    {
      id: '6bdd2301-fc78-43fd-b4ce-40725de2d07f',
      title: 'Naruto Uzumaki',
      category: 'Anime',
      fps: 60,
      res: '3840×2160',
      duration: '0:24',
      size: '93 MB',
      thumb: 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Anime/Naruto_Uzumaki_(Naruto)_thumb.jpg',
    },
    {
      id: '7ce30b4b-bbe5-4655-a4c9-30b6ed6dacd9',
      title: 'Symbiote Spider-Man',
      category: 'Video Games',
      fps: 60,
      res: '3840×2160',
      duration: '0:15',
      size: '42 MB',
      thumb:
        "https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/Video_Games/Symbiote_Spider-Man_(Marvel's_Spider-Man_2)_thumb.jpg",
    },
  ],
];

// Preload all shelf and featured images in browser cache
const ALL_THUMBS = [
  ...FEATURED_WALLPAPERS.map(w => w.thumb),
  ...NEW_WALLPAPERS.flat().map(w => w.thumb),
  ...PICKS_WALLPAPERS.flat().map(w => w.thumb),
];

if (typeof window !== 'undefined') {
  ALL_THUMBS.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'explore', label: 'Explore' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'library', label: 'Library' },
];

export default function InboxWindow({ inbox, regionRef }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedId, setSelectedId] = useState(FEATURED_WALLPAPERS[0].id);
  const [likedMap, setLikedMap] = useState({
    '0c68cfdf-0de9-4629-a8a6-51fd6d72ee92': true,
  });
  const [downloadModal, setDownloadModal] = useState(null); // title string
  const [appliedToast, setAppliedToast] = useState(null);
  const [newPage, setNewPage] = useState(0);
  const [picksPage, setPicksPage] = useState(0);
  const [exploreCategory, setExploreCategory] = useState('All');

  const scrollContainerRef = useRef(null);

  // Sync with hero selection if any
  useEffect(() => {
    if (inbox?.selected) {
      const match = FEATURED_WALLPAPERS.find(w => w.id === inbox.selected);
      if (match) setSelectedId(match.id);
    }
  }, [inbox?.selected]);

  // Lookup current active wallpaper
  const allKnown = [
    ...FEATURED_WALLPAPERS,
    ...NEW_WALLPAPERS.flat(),
    ...PICKS_WALLPAPERS.flat(),
    ...EXPLORE_DATA,
  ];
  const current = allKnown.find(w => w.id === selectedId) || FEATURED_WALLPAPERS[0];
  const isCurrentLiked = !!likedMap[current.id];

  const handleApply = () => {
    setAppliedToast(`Applied "${current.title}" to Desktop Displays`);
    setTimeout(() => setAppliedToast(null), 3200);
  };

  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setLikedMap(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const showDownloadPrompt = featureName => {
    setDownloadModal(featureName);
  };

  // Filter explore catalog
  const exploreList = EXPLORE_DATA.filter(item => {
    if (exploreCategory === 'Premium') {
      return item.category === 'Premium';
    }
    if (exploreCategory === 'All') {
      return item.category !== 'Premium';
    }
    return item.category === exploreCategory;
  });

  // Filter favorites catalog
  const favoriteItems = allKnown.filter(item => likedMap[item.id]);

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
        color: '#ffffff',
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
          zIndex: 25,
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: 'linear-gradient(180deg, rgba(10, 13, 18, 0.85) 0%, rgba(10, 13, 18, 0) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
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
                  boxShadow: on ? '0 2px 8px rgba(0,0,0,0.22)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.2, 0.7, 0.2, 1)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Right: Glass Bubble Action Buttons (Magnifier, Sun, Plus, Gear) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 1. Search Button (Prompts DMG download) */}
          <button
            type="button"
            title="Search catalog"
            onClick={() => showDownloadPrompt('Search Catalog & Filters')}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              background: 'rgba(255, 255, 255, 0.09)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
          >
            <I.Search size={14} />
          </button>

          {/* 2. Theme Toggle (Prompts DMG download) */}
          <button
            type="button"
            title="Appearance & Dynamic Solar Engine"
            onClick={() => showDownloadPrompt('Appearance & Dynamic Solar Engine')}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              background: 'rgba(255, 255, 255, 0.09)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
          >
            <I.Sun size={14} />
          </button>

          {/* 3. Add / Import Button (Prompts DMG download) */}
          <button
            type="button"
            title="Import custom wallpaper (.mov, .mp4)"
            onClick={() => showDownloadPrompt('Importing Custom Wallpapers')}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              background: 'rgba(255, 255, 255, 0.09)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1, fontWeight: 400 }}>+</span>
          </button>

          {/* 4. Settings Gear (Prompts DMG download) */}
          <button
            type="button"
            title="Settings & Display Preferences"
            onClick={() => showDownloadPrompt('Display & Hardware Automation Settings')}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              background: 'rgba(255, 255, 255, 0.09)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
          >
            <I.Gear size={14} />
          </button>
        </div>
      </div>

      {/* ---------------- Scrollable App Body ---------------- */}
      <div
        ref={scrollContainerRef}
        style={{
          position: 'relative',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.2) transparent',
        }}
      >
        {/* ================= TAB 1: HOME ================= */}
        {activeTab === 'home' && (
          <div>
            {/* HERO (560px) */}
            <div
              style={{
                position: 'relative',
                height: '560px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '0 44px 34px',
                overflow: 'hidden',
              }}
            >
              {/* Full-bleed Wallpaper Hero Background Image */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${current.thumb})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 40%',
                  transition: 'background-image 0.4s ease',
                }}
              />

              {/* Film Vignette & Scrim Gradient */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(8,11,16,0.35) 0%, rgba(8,11,16,0) 30%, rgba(8,11,16,0.5) 65%, rgba(8,11,16,0.95) 88%, #0a0d12 100%)',
                }}
              />

              {/* Hero Content Overlay: FEATURED, Title, Meta, Buttons */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 4,
                  maxWidth: '680px',
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
                    fontSize: '40px',
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.1,
                    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                  }}
                >
                  {current.title}
                </h2>

                {/* Meta line & Chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span
                    style={{
                      fontSize: '12.5px',
                      color: 'rgba(255, 255, 255, 0.75)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                    }}
                  >
                    {current.category} · {current.res || '3840×2160'} · {current.duration || '0:15'} · {current.size || '35 MB'}
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
                    4K · {current.fps || 30}
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
                      padding: '11px 24px',
                      borderRadius: 999,
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      background: 'rgba(0, 0, 0, 0.5)',
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
                    onClick={e => toggleFavorite(current.id, e)}
                    aria-label="Add to Favorites"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      background: isCurrentLiked ? 'rgba(239, 68, 68, 0.32)' : 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(16px)',
                      color: isCurrentLiked ? '#ef4444' : '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>{isCurrentLiked ? '♥' : '♡'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 10 THUMBNAIL SELECTOR STRIP */}
            <div style={{ padding: '0 44px 34px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  overflowX: 'auto',
                  paddingBottom: 8,
                  scrollbarWidth: 'none',
                }}
              >
                {FEATURED_WALLPAPERS.map(wp => {
                  const on = wp.id === selectedId;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => setSelectedId(wp.id)}
                      style={{
                        flex: on ? '0 0 100px' : '0 0 92px',
                        height: on ? '62px' : '56px',
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: on ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: on
                          ? '0 0 16px rgba(255, 255, 255, 0.6), 0 4px 12px rgba(0,0,0,0.5)'
                          : 'none',
                        padding: 0,
                        cursor: 'pointer',
                        background: '#151a22',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                      }}
                      title={wp.title}
                    >
                      <img
                        src={wp.thumb}
                        alt={wp.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          filter: on ? 'brightness(1.08)' : 'brightness(0.78)',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NEW LIVE WALLPAPERS SHELF */}
            <div style={{ padding: '0 44px 34px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: '0 0 4px 0',
                      color: '#ffffff',
                      fontSize: '20px',
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    New Live Wallpapers
                  </h3>
                  <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.5)', fontSize: '12.5px' }}>
                    The latest wallpapers added to the catalog
                  </p>
                </div>

                {/* Paging Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    aria-label="Previous batch"
                    onClick={() => setNewPage(p => Math.max(0, p - 1))}
                    disabled={newPage === 0}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#fff',
                      opacity: newPage === 0 ? 0.35 : 1,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      cursor: newPage === 0 ? 'default' : 'pointer',
                    }}
                  >
                    <span>❮</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Next batch"
                    onClick={() => setNewPage(p => Math.min(NEW_WALLPAPERS.length - 1, p + 1))}
                    disabled={newPage === NEW_WALLPAPERS.length - 1}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#fff',
                      opacity: newPage === NEW_WALLPAPERS.length - 1 ? 0.35 : 1,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      cursor: newPage === NEW_WALLPAPERS.length - 1 ? 'default' : 'pointer',
                    }}
                  >
                    <span>❯</span>
                  </button>
                </div>
              </div>

              {/* Shelf 1 Grid: 3 cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {NEW_WALLPAPERS[newPage].map(card => {
                  const isCardLiked = !!likedMap[card.id];
                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        setSelectedId(card.id);
                        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="auraloop-card"
                      style={{
                        height: '140px',
                        borderRadius: 14,
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        backgroundImage: `url(${card.thumb})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)',
                        }}
                      />

                      {/* Favorite Button on Card */}
                      <button
                        type="button"
                        onClick={e => toggleFavorite(card.id, e)}
                        title={isCardLiked ? 'Remove from favorites' : 'Add to favorites'}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isCardLiked ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '13px',
                          cursor: 'pointer',
                          backdropFilter: 'blur(8px)',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        {isCardLiked ? '♥' : '♡'}
                      </button>

                      {/* Download icon */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      >
                        ↓
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 12,
                          right: 40,
                          color: '#fff',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        }}
                      >
                        {card.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AURALOOP'S PICK SHELF */}
            <div style={{ padding: '0 44px 44px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: '0 0 4px 0',
                      color: '#ffffff',
                      fontSize: '20px',
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    AuraLoop's Pick
                  </h3>
                  <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.5)', fontSize: '12.5px' }}>
                    A different twelve every day
                  </p>
                </div>

                {/* Paging Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    aria-label="Previous batch"
                    onClick={() => setPicksPage(p => Math.max(0, p - 1))}
                    disabled={picksPage === 0}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#fff',
                      opacity: picksPage === 0 ? 0.35 : 1,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      cursor: picksPage === 0 ? 'default' : 'pointer',
                    }}
                  >
                    <span>❮</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Next batch"
                    onClick={() => setPicksPage(p => Math.min(PICKS_WALLPAPERS.length - 1, p + 1))}
                    disabled={picksPage === PICKS_WALLPAPERS.length - 1}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#fff',
                      opacity: picksPage === PICKS_WALLPAPERS.length - 1 ? 0.35 : 1,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      cursor: picksPage === PICKS_WALLPAPERS.length - 1 ? 'default' : 'pointer',
                    }}
                  >
                    <span>❯</span>
                  </button>
                </div>
              </div>

              {/* Shelf 2 Grid: 3 cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {PICKS_WALLPAPERS[picksPage].map(card => {
                  const isCardLiked = !!likedMap[card.id];
                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        setSelectedId(card.id);
                        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="auraloop-card"
                      style={{
                        height: '140px',
                        borderRadius: 14,
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        backgroundImage: `url(${card.thumb})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)',
                        }}
                      />

                      {/* Favorite Button on Card */}
                      <button
                        type="button"
                        onClick={e => toggleFavorite(card.id, e)}
                        title={isCardLiked ? 'Remove from favorites' : 'Add to favorites'}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isCardLiked ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '13px',
                          cursor: 'pointer',
                          backdropFilter: 'blur(8px)',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        {isCardLiked ? '♥' : '♡'}
                      </button>

                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      >
                        ↓
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 12,
                          right: 40,
                          color: '#fff',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        }}
                      >
                        {card.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: EXPLORE ================= */}
        {activeTab === 'explore' && (
          <div style={{ padding: '80px 44px 44px' }}>
            {/* Category Segmented Pills + Separate Oval Premium Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                overflowX: 'auto',
                paddingBottom: 22,
                scrollbarWidth: 'none',
              }}
            >
              {/* Main Categories Segmented Oval */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '3px 4px',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.25)',
                }}
              >
                {['All', 'Anime', 'Nature', 'Cars', 'Video Games', 'Sci-fi', 'Abstract', 'Movies'].map(cat => {
                  const on = exploreCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setExploreCategory(cat)}
                      style={{
                        border: 'none',
                        borderRadius: 999,
                        padding: '6px 16px',
                        fontSize: '12.5px',
                        fontWeight: on ? 600 : 500,
                        cursor: 'pointer',
                        color: on ? '#0c0f14' : 'rgba(255, 255, 255, 0.72)',
                        background: on ? '#ffffff' : 'transparent',
                        boxShadow: on ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s cubic-bezier(0.2, 0.7, 0.2, 1)',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Dedicated Oval Shaped Div for Premium */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 4px',
                  borderRadius: 999,
                  background: exploreCategory === 'Premium' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                  border: exploreCategory === 'Premium' ? '1px solid rgba(255, 255, 255, 0.28)' : '1px solid rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.25)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExploreCategory(prev => prev === 'Premium' ? 'All' : 'Premium')}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '6px 18px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: exploreCategory === 'Premium' ? '#0c0f14' : 'rgba(255, 255, 255, 0.88)',
                    background: exploreCategory === 'Premium' ? '#ffffff' : 'transparent',
                    boxShadow: exploreCategory === 'Premium' ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s cubic-bezier(0.2, 0.7, 0.2, 1)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: exploreCategory === 'Premium' ? '#0c0f14' : '#e2b34a' }}>✦</span>
                  <span>Premium</span>
                </button>
              </div>
            </div>

            {/* Explore Grid: 3 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {exploreList.map(item => {
                const isLiked = !!likedMap[item.id];
                const isItemPremium = item.category === 'Premium';
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setActiveTab('home');
                      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      height: '140px',
                      borderRadius: 14,
                      overflow: 'hidden',
                      position: 'relative',
                      border: isItemPremium ? '1px solid rgba(226, 179, 74, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundImage: `url(${item.thumb})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                      boxShadow: isItemPremium ? '0 6px 20px rgba(0,0,0,0.4), 0 0 15px rgba(226, 179, 74, 0.1)' : '0 6px 18px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)',
                      }}
                    />
                    {isItemPremium && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: 'rgba(0, 0, 0, 0.75)',
                          border: '1px solid rgba(226, 179, 74, 0.45)',
                          color: '#e2b34a',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          backdropFilter: 'blur(8px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>✦</span>
                        <span>PRO</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={e => toggleFavorite(item.id, e)}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isLiked ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '13px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {isLiked ? '♥' : '♡'}
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 12,
                        right: 12,
                        color: '#fff',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      }}
                    >
                      {item.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: FAVORITES ================= */}
        {activeTab === 'favorites' && (
          <div style={{ padding: '80px 44px 44px' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 700 }}>
                Favorites
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>
                {favoriteItems.length} {favoriteItems.length === 1 ? 'wallpaper' : 'wallpapers'} saved to your favorites collection
              </p>
            </div>

            {favoriteItems.length === 0 ? (
              <div
                style={{
                  height: '280px',
                  borderRadius: 16,
                  border: '1px dashed rgba(255,255,255,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.5)',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: '32px' }}>♡</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>No favorites yet</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  Click the heart icon on any wallpaper in Home or Explore to save it here.
                </span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                {favoriteItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setActiveTab('home');
                      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      height: '140px',
                      borderRadius: 14,
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundImage: `url(${item.thumb})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={e => toggleFavorite(item.id, e)}
                      title="Remove from favorites"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.85)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '13px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      ♥
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 12,
                        right: 12,
                        color: '#fff',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      }}
                    >
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: LIBRARY ================= */}
        {activeTab === 'library' && (
          <div style={{ padding: '80px 44px 44px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 700 }}>
                  Library & Downloads
                </h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>
                  Offline cached 4K master files and imported loops
                </p>
              </div>

              {/* Import Custom Wallpaper Button */}
              <button
                type="button"
                onClick={() => showDownloadPrompt('Import Custom Wallpapers (.mov, .mp4)')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>+ Import Video</span>
              </button>
            </div>

            {/* Library Grid: Downloaded default wallpapers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {FEATURED_WALLPAPERS.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setActiveTab('home');
                    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    height: '140px',
                    borderRadius: 14,
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundImage: `url(${item.thumb})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'rgba(74, 222, 128, 0.25)',
                      border: '1px solid rgba(74, 222, 128, 0.4)',
                      color: '#4ade80',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    Downloaded
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      left: 12,
                      right: 12,
                      color: '#fff',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                    }}
                  >
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------------- Applied Toast Notification ---------------- */}
      <AnimatePresence>
        {appliedToast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              borderRadius: 999,
              background: 'rgba(12, 16, 22, 0.92)',
              border: '1px solid rgba(74, 222, 128, 0.4)',
              color: '#4ade80',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <I.Check size={16} />
            <span>{appliedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Download App Modal Prompt ---------------- */}
      <AnimatePresence>
        {downloadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDownloadModal(null)}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'grid',
              placeItems: 'center',
              padding: '24px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '420px',
                borderRadius: 20,
                background: 'linear-gradient(180deg, #1b202a 0%, #10141d 100%)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)',
                padding: '28px',
                textAlign: 'center',
                color: '#fff',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(145deg, #2d3b52 0%, #161e2c 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 16px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <img src="/assets/svg/auraloop.svg" alt="" width="28" height="16" />
              </div>

              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>
                {downloadModal}
              </h4>
              <p
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '13.5px',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.5,
                }}
              >
                Please download the AuraLoop native macOS app to unlock full catalog search, custom video imports, appearance schedules, and hardware engine automations.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setDownloadModal(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <a
                  href="#waitlist"
                  onClick={() => setDownloadModal(null)}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#e4572e',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(228,87,46,0.5)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Download .DMG</span>
                  <span>↓</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
