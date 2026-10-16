// Content for the AuraLoop website.
// High-Performance Native Live Wallpapers & Screensavers for macOS.

export const NAV = [
  { id: 'wallpapers', label: 'Wallpapers' },
  { id: 'engine', label: 'Engine' },
  { id: 'anatomy', label: 'Architecture' },
  { id: 'automation', label: 'Automation' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export const CATEGORIES = ['All', 'Apple Aerials', 'Dynamic Solar', 'Cinematic', 'Minimalist'];

// High-resolution Unsplash photo IDs for wallpaper previews
export const PHOTOS = {
  snowfall: {
    id: '1517299321609-52687d1bc55a',
    fpY: 0.5,
    fpX: 0.5,
    alt: 'Dense pine trees covered in silent falling snow in winter',
  },
  aurora: {
    id: '1531366936337-7c912a4589a7',
    fpY: 0.45,
    fpX: 0.5,
    alt: 'Vibrant green northern lights aurora borealis reflected in a calm Arctic lake',
  },
  fuji: {
    id: '1578637387939-43c525550085',
    fpY: 0.55,
    fpX: 0.5,
    alt: 'Mount Fuji silhouette under deep starry night sky and milky way',
  },
  shore: {
    id: '1507525428034-b723cf961d3e',
    fpY: 0.5,
    fpX: 0.5,
    alt: 'Tranquil turquoise ocean waves gently breaking on clean white sand shore',
  },
  patagonia: {
    id: '1464822759023-fed622ff2c3b',
    fpY: 0.5,
    fpX: 0.5,
    alt: 'Dramatic jagged mountain peaks and rolling clouds flyover aerial',
  },
  sakura: {
    id: '1522383225653-ed111181a951',
    fpY: 0.45,
    fpX: 0.5,
    alt: 'Delicate pink Japanese cherry blossoms in soft golden morning sunlight',
  },
  dune: {
    id: '1509316975850-ff9c5deb0cd9',
    fpY: 0.55,
    fpX: 0.5,
    alt: 'Wind-carved desert sand dunes in golden sunset light',
  },
  space: {
    id: '1451187580459-43490279c0fa',
    fpY: 0.5,
    fpX: 0.5,
    alt: 'Planet Earth from orbit with glowing atmospheric horizon and stars',
  },
  misty: {
    id: '1506744038136-46273834b3fb',
    fpY: 0.4,
    fpX: 0.5,
    alt: 'Misty evergreen mountain valley with sunbeams cutting through haze',
  },
};

const RAW_ESSAYS = [
  {
    slug: 'snowfall-forest',
    title: 'Snowfall in Forest',
    category: 'Apple Aerials',
    photo: 'snowfall',
    overlay: { title: 'Snowfall in Forest', script: '4K · 60 FPS · HDR Master' },
    topics: ['4k', '60fps', 'bundled', 'hevc', 'ambient'],
    dek: 'Pre-bundled 4K 60fps master. Silent, hypnotic snowfall captured in pristine high dynamic range with perfectly continuous looping.',
    quoteAfter: 2,
    quote: 'Pre-bundled in AuraLoop so your Mac is breathtaking the very second you open the app.',
    sections: [
      {
        h: 'Hardware-Optimized HEVC Master',
        p: [
          'Pre-bundled directly into AuraLoop’s release DMG so your installation is ready for instant playback without downloading large files.',
          'Rendered in full 3840×2160 resolution at a rock-solid 60 frames per second, calibrated to Pro Display XDR and Liquid Retina XDR displays.',
        ],
      },
      {
        h: 'Zero CPU Overhead on Apple Silicon',
        p: [
          'By utilizing AVFoundation hardware decoders on Apple Silicon (M1/M2/M3/M4) and Intel T2 chips, CPU usage remains strictly below 0.4%.',
          'Your Mac stays whisper-quiet, battery drain is virtually undetectable, and temperatures remain at idle.',
        ],
      },
      {
        h: 'Seamless Desktop & Lock Screen Pairing',
        p: [
          'Pairs automatically with the macOS ExtensionKit Wallpaper service. Your lock screen transitions smoothly into your active desktop.',
        ],
      },
      {
        h: 'Automatic Occlusion Sleep',
        p: [
          'When you launch a full-screen Xcode project, Safari window, or game, the playback engine halts video decoding instantly until your desktop is revealed.',
        ],
      },
    ],
  },
  {
    slug: 'aurora-lake',
    title: 'Aurora Lake',
    category: 'Dynamic Solar',
    photo: 'aurora',
    overlay: { title: 'Aurora Lake', script: 'Dynamic Solar · 24-Hour Cycle' },
    topics: ['dynamic', 'solar', 'aurora', 'night', '4k'],
    dek: 'Astronomy-driven keyframes that shift between dusk, midnight green aurora curtains, and serene dawn reflections.',
    quoteAfter: 2,
    quote: 'The wallpaper breathes with the actual position of the sun outside your window.',
    sections: [
      {
        h: 'Astronomical Sun Elevation Tracking',
        p: [
          'AuraLoop calculates the sun’s exact angle above the horizon at your current geographic coordinates.',
          'As twilight approaches, the calm daytime lake transitions into rich emerald light waves dancing across the water.',
        ],
      },
      {
        h: 'High Precision Color Grading',
        p: [
          'Mastered in 10-bit P3 wide color gamut to take full advantage of Apple’s extreme dynamic range panels.',
        ],
      },
      {
        h: 'Smooth Keyframe Cross-Fading',
        p: [
          'Hardware-accelerated Metal crossfades ensure zero perceptible stutter or frame drops during time transitions.',
        ],
      },
    ],
  },
  {
    slug: 'fuji-dusk',
    title: 'Milky Way Over Fuji',
    category: 'Cinematic',
    photo: 'fuji',
    overlay: { title: 'Milky Way Over Fuji', script: '4K Ultra HD · Night Orbit' },
    topics: ['fuji', 'stars', 'night', 'japan', '4k'],
    dek: 'A majestic time-lapse of the Milky Way rotating above Mount Fuji’s snow-capped summit with deep inky blacks.',
    quoteAfter: 2,
    quote: 'OLED and Mini-LED backlights turn off completely on shadow areas, making the stars pop.',
    sections: [
      {
        h: 'True Black Level Calibration',
        p: [
          'Engineered for Mini-LED Liquid Retina XDR displays to prevent backlight blooming while preserving pinpoint star brightness.',
        ],
      },
      {
        h: 'Subtle Fluid Motion',
        p: [
          'Calculated 24-frame cadence for a cinematic, meditative aesthetic that inspires focus during long programming or writing sessions.',
        ],
      },
      {
        h: 'Low Power Sentry Integration',
        p: [
          'Automatically drops to 30 fps when macOS enters Low Power Mode to conserve maximum battery life.',
        ],
      },
    ],
  },
  {
    slug: 'patagonia-flight',
    title: 'Flight Over Patagonia',
    category: 'Apple Aerials',
    photo: 'patagonia',
    topics: ['aerial', 'apple', 'flyover', 'mountains', 'nature'],
    dek: 'Curated 4K Apple Aerial flyover drifting gracefully over glacial spires, turquoise fjords, and wind-carved granite peaks.',
    quoteAfter: 2,
    quote: 'Brings Apple’s legendary Apple TV aerial cinematography straight to your Mac desktop.',
    sections: [
      {
        h: 'Curated Apple Aerials Integration',
        p: [
          'Browse and download directly from Apple’s official 4K HDR catalog without manual links or scripts.',
        ],
      },
      {
        h: 'Lossless Local Cache',
        p: [
          'Cached in your offline application support library so it plays flawlessly anywhere without an internet connection.',
        ],
      },
    ],
  },
  {
    slug: 'moonlit-shore',
    title: 'Moonlit Shore',
    category: 'Minimalist',
    photo: 'shore',
    topics: ['ocean', 'waves', 'minimal', 'calm', 'relax'],
    dek: 'Soft ambient moonlight glinting over gentle, slow-motion coastal swells. Designed for deep concentration and quiet workspaces.',
    quoteAfter: 2,
    quote: 'Zero cognitive clutter — just the rhythmic pulse of natural waves.',
    sections: [
      {
        h: 'Infinite Loop Engineering',
        p: [
          'Every clip in AuraLoop features seamless looping with no jarring cuts, resets, or audio pops.',
        ],
      },
      {
        h: 'Adaptive Display Coverage',
        p: [
          'Fits widescreen, ultra-wide, and multi-monitor setups with intelligent crop preservation.',
        ],
      },
    ],
  },
  {
    slug: 'sakura-breeze',
    title: 'Sakura Light',
    category: 'Minimalist',
    photo: 'sakura',
    topics: ['sakura', 'spring', 'botanical', 'japanese', 'calm'],
    dek: 'Delicate pink cherry blossom petals drifting slowly against a warm pastel sky. Crisp, ethereal, and uplifting.',
    quoteAfter: 2,
    quote: 'Natural brightness that complements macOS Light Mode perfectly.',
    sections: [
      {
        h: 'Daylight Aesthetic',
        p: [
          'High luminance palette that complements bright studio environments and daylight working sessions.',
        ],
      },
    ],
  },
  {
    slug: 'arrakis-dune',
    title: 'Arrakis (Dune)',
    category: 'Cinematic',
    photo: 'dune',
    topics: ['desert', 'dune', 'warm', 'cinematic', 'gold'],
    dek: 'Golden desert ridges sculpted by desert wind with shifting shadows and radiant warmth.',
    quoteAfter: 2,
    quote: 'Rich amber gradients that evoke vast stillness and timeless elegance.',
    sections: [
      {
        h: 'Warm Earth Tones',
        p: [
          'Tuned for warmth and reduced eye strain during late evening editing or coding marathons.',
        ],
      },
    ],
  },
  {
    slug: 'earth-orbit',
    title: 'Cosmic Earth Orbit',
    category: 'Apple Aerials',
    photo: 'space',
    topics: ['space', 'earth', 'orbit', 'night', 'cosmic'],
    dek: 'Slow, majestic orbital pass over city lights, aurora rings, and the thin blue ribbon of Earth’s atmosphere.',
    quoteAfter: 2,
    quote: 'A humbling cosmic perspective every time you glance at your workspace.',
    sections: [
      {
        h: 'ISS & Apple Aerial Master',
        p: [
          'Ultra-high bitrate master sourced directly from satellite captures and orbital flybys.',
        ],
      },
    ],
  },
];

const words = a => [a.title, a.dek, a.quote, ...a.sections.flatMap(s => [s.h, ...s.p])].join(' ').split(/\s+/).length;

export const ARTICLES = RAW_ESSAYS.map((a, i) => ({
  ...a,
  index: i,
  minutes: Math.max(2, Math.round(words(a) / 180)),
}));

export const FEATURED = ['snowfall-forest', 'aurora-lake', 'fuji-dusk'];

export const SERVICES = [
  {
    id: 'gpu-engine',
    title: 'Direct AVFoundation GPU Pipeline',
    line: 'Hardware-decoded HEVC/H.265 playback with zero CPU impact.',
    includes: [
      'Zero-copy GPU texture streaming direct to CoreAnimation',
      'Sub-0.5% CPU utilization even on 4K 60fps streams',
      'Whisper-quiet fans and prolonged MacBook battery life',
      'Universal binary compiled natively for Apple Silicon (M1–M4) & Intel',
    ],
    bestFor: 'MacBook Pro, MacBook Air & Mac Studio users demanding max battery efficiency.',
  },
  {
    id: 'extension-kit',
    title: 'ExtensionKit Lock Screen Integration',
    line: 'System-level wallpaper appex for macOS 15 & macOS 26+.',
    includes: [
      'Separate process sandbox isolated from main app for rock-solid stability',
      'Synchronized lock screen and login window transitions',
      'Automatic recovery if system display configuration changes',
      'Native Apple WallpaperStore integration via private framework bridging',
    ],
    bestFor: 'Seamless desktop & lock screen wallpaper synchronization.',
  },
  {
    id: 'solar-engine',
    title: 'Dynamic Solar Astronomical Engine',
    line: 'Calculates sun elevation to blend 24-hour day/twilight/night cycles.',
    includes: [
      'Exact astronomical solar elevation algorithms based on coordinates',
      'Smooth keyframe interpolation between dawn, noon, golden hour & midnight',
      'Offline solar ephemeris calculation without network requests',
      'Supports custom 24-hour dynamic HEVC wallpapers and aerial playlists',
    ],
    bestFor: 'Creating dynamic, atmospheric workspaces that mirror the outdoors.',
  },
  {
    id: 'occlusion-sentry',
    title: 'Multi-Monitor Canvas & Occlusion Sentry',
    line: 'Independent or panoramic playback across all external displays.',
    includes: [
      'Pro Display XDR, Studio Display & multi-monitor support up to 4 screens',
      'Window occlusion detection: auto-pauses when desktop is covered',
      'Instant pause during full-screen apps, Xcode builds, and games',
      'ScreenSaver delay coordinator with native macOS system settings',
    ],
    bestFor: 'Multi-monitor workstations and creative desktop setups.',
  },
];

export const ANATOMY = [
  {
    id: 'premise',
    title: 'Direct GPU Decode',
    line: 'Zero-copy frames streaming straight to display hardware.',
    points: [
      'Delegates 100% of video decompression to Apple Silicon media engines.',
      'AVFoundation hardware pipeline with negligible RAM overhead.',
      'Zero fan noise and zero heat generation.',
    ],
  },
  {
    id: 'structure',
    title: 'Occlusion Sentry',
    line: 'Pauses the instant your desktop is hidden.',
    points: [
      'Monitors open windows and full-screen workspace state.',
      'Auto-pauses playback when apps obscure the desktop.',
      'Resumes immediately when you switch spaces or reveal desktop.',
    ],
  },
  {
    id: 'voice',
    title: 'Solar Elevation',
    line: '24-hour astronomical light tracking.',
    points: [
      'Calculates exact solar angle without online APIs.',
      'Coordinates day, golden hour, twilight, and starry night.',
      'Supports 24-hour dynamic HEVC and curated Apple Aerials.',
    ],
  },
  {
    id: 'ending',
    title: 'Lock Screen Appex',
    line: 'ExtensionKit system service integration.',
    points: [
      'Renders natively behind macOS 15+ lock screen clocks.',
      'Seamless transition from waking up to active desktop.',
      'Sandboxed architecture preventing any main app crash.',
    ],
  },
];

export const FORMATS = ['All', 'Apple Silicon', 'Intel 64-bit', 'Multi-Display'];

export const TALKS = [
  {
    id: 'solar-cycle',
    title: '24-Hour Astronomical Solar Clock',
    text: 'Sync your wallpaper keyframes with local sunrise, solar noon, golden hour, and midnight. Automatic location-based elevation calculation.',
    formats: ['Apple Silicon', 'Intel 64-bit'],
  },
  {
    id: 'dual-xdr',
    title: 'Multi-Display Synchronized Panorama',
    text: 'Span high-bitrate 8K drone aerials across dual Studio Displays or Pro Display XDR panels with frame-accurate timing synchronization.',
    formats: ['Multi-Display', 'Apple Silicon'],
  },
  {
    id: 'saver-sync',
    title: 'ScreenSaver to Desktop Seamless Transition',
    text: 'Configure custom idle screen saver delays that wake smoothly into your active live desktop with zero flicker or stutter.',
    formats: ['Apple Silicon', 'Intel 64-bit'],
  },
];

export const CONTACT_TOPICS = [
  'Feature Request',
  'Wallpaper Submission',
  'Bug Report',
  'General Feedback',
];
