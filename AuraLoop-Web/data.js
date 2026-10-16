// Data for AuraLoop Web.
// High-Performance Native Live Wallpapers & Screensavers for macOS.

/* ---------------------------------------------------------------- wallpapers */
// `photo` is an Unsplash id (the part after "photo-").
export const PEOPLE = {
  you: { name: 'Your Mac', full: 'MacBook Pro · M3 Max', initials: 'AP', letter: 'A', tone: 'ink' },
  snowfall: { name: 'Snowfall in Forest', photo: '1517299321609-52687d1bc55a', role: '4K 60fps · Bundled Master' },
  aurora: { name: 'Aurora Lake', photo: '1531366936337-7c912a4589a7', role: 'Dynamic Solar · 24-Hour Cycle' },
  fuji: { name: 'Milky Way Over Fuji', photo: '1578637387939-43c525550085', role: 'Mini-LED XDR Night Orbit' },
  patagonia: { name: 'Patagonia Flyover', photo: '1464822759023-fed622ff2c3b', role: 'Curated 4K Apple Aerial' },
  shore: { name: 'Moonlit Shore', photo: '1507525428034-b723cf961d3e', role: 'Minimalist Ambient Swell' },
  sakura: { name: 'Sakura Light', photo: '1522383225653-ed111181a951', role: '10-bit P3 Wide Color' },
  dune: { name: 'Arrakis Dune', photo: '1509316975850-ff9c5deb0cd9', role: 'Golden Hour Cinematic' },
  space: { name: 'Cosmic Earth Orbit', photo: '1451187580459-43490279c0fa', role: 'Orbital Horizon Flyby' },
  marcus: { name: 'Snowfall in Forest', photo: '1517299321609-52687d1bc55a', role: 'Primary Display · 4K 60fps' },
  amara: { name: 'Aurora Lake', photo: '1531366936337-7c912a4589a7', role: 'Secondary Display · Solar' },
  sofia: { name: 'Milky Way Over Fuji', photo: '1578637387939-43c525550085', role: 'Lock Screen Master' },
  theo: { name: 'Patagonia Flyover', photo: '1464822759023-fed622ff2c3b', role: 'ScreenSaver Sync' },
  engine: { name: 'AVFoundation GPU Engine', initials: 'AV', service: true, role: 'Hardware Media Decoder' },
  lockscreen: { name: 'ExtensionKit Lock Screen', initials: 'LK', service: true, role: 'macOS 15/26+ Appex' },
  sentry: { name: 'Window Occlusion Sentry', initials: 'OC', service: true, role: 'Auto-Pause Monitor' },
  solar: { name: 'Dynamic Solar Engine', initials: 'DS', service: true, role: 'Solar Elevation Ephemeris' },
};

export const initialsOf = p => p.initials || p.name.split(' ').map(w => w[0]).join('').slice(0, 2);

/* ---------------------------------------------------------------- player demo */
export const GROUPS = [
  { id: 'teammates', label: 'Curated Masters', short: 'Masters' },
  { id: 'people', label: 'Aerial Collections', short: 'Aerials' },
  { id: 'notifications', label: 'Hardware Engine', short: 'Engine' },
];

export const CONVERSATIONS = [
  {
    id: 'snowfall', group: 'teammates', person: 'snowfall', unread: 0,
    subject: 'Snowfall in Forest (Pre-bundled Master)',
    cc: ['engine'],
    messages: [
      { from: 'engine', at: '14 Oct 2026, 16:40', body: 'Loaded pre-bundled master: 3840×2160 @ 60.00 fps HEVC 10-bit P3 HDR.' },
      { from: 'you', at: '14 Oct 2026, 17:15', body: 'AVFoundation hardware decoder engaged on Apple Silicon media engine.' },
      { from: 'snowfall', at: '16 Oct 2026, 08:55', body: 'Playing smoothly across primary Pro Display XDR. CPU footprint measured at 0.32% with zero fan noise.' },
    ],
  },
  {
    id: 'aurora', group: 'teammates', person: 'aurora', unread: 0,
    subject: 'Aurora Lake (Dynamic Solar Transition)',
    cc: ['solar'],
    messages: [
      { from: 'solar', at: '15 Oct 2026, 09:30', body: 'Astronomical solar elevation calculated: -14.2° below horizon at local coordinates.' },
      { from: 'aurora', at: '16 Oct 2026, 08:20', body: 'Crossfading from Twilight Calm into Emerald Aurora Curtains. Zero frame drops recorded.' },
    ],
  },
  {
    id: 'fuji', group: 'teammates', person: 'fuji', unread: 1,
    subject: 'Milky Way Over Fuji (Mini-LED Calibration)',
    cc: ['lockscreen'],
    messages: [
      { from: 'fuji', at: '15 Oct 2026, 13:10', body: 'Calibrated for Liquid Retina XDR display backlights. Shadow black levels mapped to 0.00 nits.' },
      { from: 'fuji', at: '16 Oct 2026, 07:45', body: 'Synchronized with macOS Lock Screen via ExtensionKit. Smooth wake transition active.' },
    ],
  },
  {
    id: 'patagonia', group: 'people', person: 'patagonia', unread: 2,
    subject: 'Patagonia Glacial Flyover (Apple Aerial)',
    cc: ['sentry'],
    messages: [
      { from: 'you', at: '15 Oct 2026, 15:00', body: 'Spanning high-bitrate 4K stream across Dual Studio Displays.' },
      { from: 'patagonia', at: '16 Oct 2026, 17:48', body: 'Direct zero-copy Metal texture sharing keeps RAM utilization under 45 MB.' },
      { from: 'patagonia', at: '16 Oct 2026, 22:14', body: 'Occlusion sentry standby: full-screen Xcode detected on Space 2, decoding paused instantly.' },
    ],
  },
  {
    id: 'shore', group: 'people', person: 'shore', unread: 0,
    subject: 'Moonlit Shore (Ambient Ocean Swell)',
    cc: ['engine'],
    messages: [
      { from: 'shore', at: '12 Oct 2026, 16:05', body: 'Infinite seamless loop analysis: start and end frame keyframe boundary perfectly matched.' },
      { from: 'you', at: '13 Oct 2026, 10:12', body: 'Low power mode sentry enabled: drops to 30 fps when MacBook enters battery saver.' },
      { from: 'shore', at: '16 Oct 2026, 09:40', body: 'Ambient sound test available via menu bar controller. Whispering surf at 48kHz audio.' },
    ],
  },
  {
    id: 'sakura', group: 'people', person: 'sakura', unread: 0,
    subject: 'Sakura Light (Spring Botanical Drift)',
    cc: [],
    messages: [
      { from: 'sakura', at: '15 Oct 2026, 11:00', body: 'High-luminance daylight palette configured for macOS Light Appearance mode.' },
    ],
  },
  {
    id: 'engine', group: 'notifications', person: 'engine', unread: 0,
    subject: 'AVFoundation Hardware Media Engine Status',
    cc: [],
    messages: [
      { from: 'engine', at: '16 Oct 2026, 06:00', body: 'All hardware decoders healthy. HEVC, ProRes 422, and VP9 hardware decoding supported natively.' },
    ],
  },
  {
    id: 'lockscreen', group: 'notifications', person: 'lockscreen', unread: 0,
    subject: 'ExtensionKit System Sandbox Verification',
    cc: [],
    messages: [
      { from: 'lockscreen', at: '15 Oct 2026, 18:00', body: 'Wallpaper extension running in isolated sandbox. Zero impact on Finder or WindowServer stability.' },
    ],
  },
  {
    id: 'sentry', group: 'notifications', person: 'sentry', unread: 0,
    subject: 'Desktop Window Occlusion Active',
    cc: [],
    messages: [
      { from: 'sentry', at: '15 Oct 2026, 08:31', body: 'Window bounds monitor active: paused decoding for 45 minutes while desktop was covered by apps.' },
    ],
  },
  {
    id: 'solar', group: 'notifications', person: 'solar', unread: 0,
    subject: 'Astronomical Sun Elevation Ephemeris',
    cc: [],
    messages: [
      { from: 'solar', at: '14 Oct 2026, 09:00', body: 'Calculated 24-hour keyframes: Sunrise 06:48, Solar Noon 12:45, Sunset 18:22, Twilight 19:10.' },
    ],
  },
];

// Canned quick actions for “Apply Wallpaper”.
export const SUGGESTED = {
  snowfall: 'Apply Snowfall in Forest to all connected displays at native 4K 60fps.',
  aurora: 'Activate 24-hour Dynamic Solar cycle with automatic sun elevation tracking.',
  fuji: 'Set Milky Way Over Fuji as synchronized Desktop and Lock Screen wallpaper.',
  patagonia: 'Span Patagonia Flyover across dual Studio Displays with frame synchronization.',
  shore: 'Enable Moonlit Shore with ambient surf sound and idle screensaver delay.',
  sakura: 'Set Sakura Light with automatic macOS appearance light-theme pairing.',
  engine: 'Run full AVFoundation hardware decoder diagnostics.',
  lockscreen: 'Verify ExtensionKit wallpaper extension handshake.',
  sentry: 'Configure occlusion sentry auto-pause threshold.',
  solar: 'Recalculate astronomical sun elevation for current geographic coordinates.',
};

export const INCOMING = [
  { convo: 'aurora', body: 'Sun elevation reached -18°. Night sky keyframe active with aurora ribbons.' },
  { convo: 'snowfall', body: 'Pro Display XDR primary output running at 60 fps. CPU usage: 0.28%.' },
  { convo: 'sentry', body: 'Desktop obscured by Safari. Video decoding paused automatically.' },
  { convo: 'fuji', body: 'Lock screen preview synchronized with macOS Sonoma clock.' },
];

export const SEED_CARDS = {
  left: { key: 'seed-snowfall', convo: 'snowfall', time: 'Active', body: 'Snowfall in Forest: 4K 60fps master playing with 0.3% CPU' },
  right: { key: 'seed-aurora', convo: 'aurora', time: 'Dynamic', body: 'Aurora Lake: Solar elevation transitioned to astronomical night' },
};

/* ---------------------------------------------------------------- curation compare */
export const CLASSIC_ROWS = [
  { id: 'c1', who: 'snowfall', subject: 'Snowfall in Forest · 4K 60fps Master', time: 'Active' },
  { id: 'c2', who: 'aurora', subject: 'Aurora Lake · Dynamic Solar Keyframes', time: 'Night' },
  { id: 'c3', who: 'fuji', subject: 'Milky Way Over Fuji · Mini-LED HDR', time: 'Synced' },
  { id: 'c4', who: 'patagonia', subject: 'Patagonia Flyover · Apple Aerial', time: 'Dual XDR' },
  { id: 'c5', who: 'shore', subject: 'Moonlit Shore · Ambient Waveform', time: 'Loop' },
  { id: 'c6', who: 'sakura', subject: 'Sakura Light · 10-bit P3 Gamut', time: 'Daylight' },
  { id: 'c7', who: 'dune', subject: 'Arrakis Dune · Golden Hour Drift', time: 'Sunset' },
  { id: 'c8', who: 'space', subject: 'Cosmic Earth Orbit · Satellite Master', time: 'Orbit' },
];
export const PEOPLE_CARDS = ['snowfall', 'aurora', 'fuji'];

/* ---------------------------------------------------------------- tools */
export const SCREENER = [
  { id: 's1', person: 'snowfall', email: '4K 60fps · Bundled Master', subject: 'Instant zero-download playback on clean install' },
  { id: 's2', name: 'Background Video Transcoder', email: 'AVFoundation · VideoToolbox', subject: 'Auto-transcodes custom MP4/MOV to optimized HEVC' },
  { id: 's3', person: 'aurora', email: 'Dynamic Solar Ephemeris', subject: 'Astronomical calculation of sun angle above horizon' },
  { id: 's4', name: 'Desktop Occlusion Sentry', email: 'AppKit · CoreGraphics', subject: 'Halts decoding when windows cover your desktop' },
];

export const LANES = {
  teammates: [
    { who: 'snowfall', text: 'Snowfall in Forest (4K 60fps)', time: 'Active' },
    { who: 'aurora', text: 'Aurora Lake (Dynamic Solar)', time: 'Twilight' },
    { who: 'fuji', text: 'Milky Way Over Fuji (HDR)', time: 'Night' },
  ],
  people: [
    { who: 'patagonia', text: 'Patagonia Glacial Flyover', time: 'Cached' },
    { who: 'shore', text: 'Moonlit Shore (Ambient Loop)', time: 'Ready' },
    { who: 'sakura', text: 'Sakura Light (Daylight)', time: 'Ready' },
    { who: 'dune', text: 'Arrakis Dune (Cinematic)', time: 'Ready' },
  ],
  notifications: [
    { who: 'engine', text: 'AVFoundation GPU Decoder: 0.3% CPU', time: 'Live' },
    { who: 'lockscreen', text: 'ExtensionKit Lock Screen: Synced', time: 'Active' },
    { who: 'sentry', text: 'Occlusion Sentry: Ready', time: 'Idle' },
    { who: 'solar', text: 'Solar Ephemeris: Elevation -14°', time: 'Live' },
  ],
};

export const NUDGE_PRESETS = [
  { id: 'evening', label: 'Sunset & Dusk', pill: 'Solar Angle: 0°' },
  { id: 'monday', label: 'Solar Midnight', pill: 'Solar Angle: -18°' },
  { id: 'custom', label: 'Custom Solar Elevation', pill: null },
];

export const KEYCAPS = [
  { key: 'j', cap: 'J', action: 'Next wallpaper' },
  { key: 'k', cap: 'K', action: 'Previous wallpaper' },
  { key: 'e', cap: 'E', action: 'Apply to Desktop' },
  { key: 'r', cap: 'R', action: 'Set as ScreenSaver' },
  { key: 'h', cap: 'H', action: 'Toggle Solar Cycle' },
  { key: '/', cap: '/', action: 'Search catalog' },
];

/* ---------------------------------------------------------------- workflows */
export const WORKFLOWS = [
  {
    id: 'battery',
    title: 'MacBook Battery Preservation',
    who: 'Mobile creators & developers demanding all-day battery life',
    before: 'Wallpapers draining 18% CPU and spinning MacBook fans',
    after: 'Sub-0.4% CPU usage with zero fan noise via AVFoundation',
    metric: { from: '18% CPU', to: '0.3% CPU', label: 'active playback overhead' },
    steps: [
      { title: 'Zero-copy GPU streaming', body: 'Decompressed directly inside Apple Silicon media engines without CPU intervention.' },
      { title: 'Window occlusion auto-pause', body: 'The instant an app covers your desktop, video decoding stops completely.' },
      { title: 'Low Power mode sentry', body: 'Seamlessly drops to 30 fps when macOS enters battery saver mode.' },
    ],
  },
  {
    id: 'multimonitor',
    title: 'Dual Studio Display Workstation',
    who: 'Designers & video editors with multi-monitor Pro displays',
    before: 'Stuttered playback and mismatched resolutions across displays',
    after: 'Frame-accurate synchronized 4K playback across all screens',
    metric: { from: 'Mismatched', to: 'Synchronized', label: 'per-display frame rate' },
    steps: [
      { title: 'Per-display assignment', body: 'Choose distinct wallpapers or span sweeping panoramic aerials across displays.' },
      { title: 'Independent aspect ratio fitting', body: 'Preserves focal framing on wide, ultra-wide, and vertical monitor setups.' },
      { title: 'Lock screen transition', body: 'Smoothly wakes from macOS lock screen into your active desktop.' },
    ],
  },
  {
    id: 'solarcycle',
    title: '24-Hour Circadian Solar Cycle',
    who: 'Remote workers seeking natural atmospheric lighting',
    before: 'Blinding daylight wallpaper glaring in your eyes at midnight',
    after: 'Gentle, continuous time-of-day elevation matching the sun',
    metric: { from: 'Static', to: 'Dynamic 24h', label: 'solar elevation tracking' },
    steps: [
      { title: 'Astronomical elevation calculation', body: 'Calculates the real sun angle above your horizon without online API calls.' },
      { title: 'Metal shader cross-blending', body: 'Interpolates smoothly across golden hour, dusk, and twilight keyframes.' },
      { title: 'Ambient sound pairing', body: 'Optional subtle ocean or wind ambient soundscapes that quiet down after dark.' },
    ],
  },
];

/* ---------------------------------------------------------------- manifesto */
export const PRINCIPLES = [
  { n: '01', title: 'Zero CPU Overhead', body: 'Every frame is decoded directly by hardware media engines. Your Mac stays cool, silent, and responsive under heavy workloads.' },
  { n: '02', title: 'ExtensionKit Native', body: 'Renders through macOS system services for flawless lock screen and login window integration without hacky injection.' },
  { n: '03', title: '100% Offline & Private', body: 'Zero tracking, zero analytics, and zero telemetry. All wallpapers and solar ephemeris calculations operate entirely on your Mac.' },
];

export const TEAM_SIZES = ['Apple Silicon M1/M2', 'Apple Silicon M3/M4 (Max/Ultra)', 'Intel Core i7/i9 (macOS 14+)', 'Pro Display XDR / Dual Displays'];
export const CLIENTS = ['macOS 15 Sequoia', 'macOS 14 Sonoma', 'macOS 26+ (ExtensionKit)'];
