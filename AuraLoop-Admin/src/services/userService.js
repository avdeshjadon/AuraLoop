// AuraLoop User Management Service

const USERS_STORAGE_KEY = 'auraloop_users_cache';

const DEFAULT_USERS = [
  {
    id: 'USR_7841',
    name: 'Sajibur Rahman',
    email: 'sajibur.rahman@gmail.com',
    status: 'Active',
    plan: 'Pro Plan',
    device: 'MacBook Pro 16" (M3 Max, macOS 15.3)',
    downloads: 142,
    lastSeen: 'Online Now',
    avatar: 'SR',
    joined: 'Jan 14, 2026',
  },
  {
    id: 'USR_7840',
    name: 'Elena Rostova',
    email: 'elena.rostova@design.co',
    status: 'Active',
    plan: 'Pro Plan',
    device: 'Mac Studio (M2 Ultra, macOS 15.2)',
    downloads: 289,
    lastSeen: '12m ago',
    avatar: 'ER',
    joined: 'Feb 02, 2026',
  },
  {
    id: 'USR_7839',
    name: 'Marcus Vance',
    email: 'marcus.v@hyperloop.io',
    status: 'Active',
    plan: 'Free Tier',
    device: 'MacBook Air 15" (M3, macOS 15.3)',
    downloads: 24,
    lastSeen: '45m ago',
    avatar: 'MV',
    joined: 'Feb 19, 2026',
  },
  {
    id: 'USR_7838',
    name: 'Aoi Tanaka',
    email: 'tanaka.aoi@tokyo.net',
    status: 'Offline',
    plan: 'Pro Plan',
    device: 'Mac mini (M4 Pro, macOS 15.3)',
    downloads: 412,
    lastSeen: '3h ago',
    avatar: 'AT',
    joined: 'Dec 28, 2025',
  },
  {
    id: 'USR_7837',
    name: 'David Chen',
    email: 'chen.david@mit.edu',
    status: 'Active',
    plan: 'Pro Plan',
    device: 'MacBook Pro 14" (M2 Pro, macOS 15.1)',
    downloads: 87,
    lastSeen: '5m ago',
    avatar: 'DC',
    joined: 'Mar 01, 2026',
  },
  {
    id: 'USR_7836',
    name: 'Sarah Connor',
    email: 'sarah.c@sky.net',
    status: 'Suspended',
    plan: 'Free Tier',
    device: 'iMac 24" (M3, macOS 14.6)',
    downloads: 5,
    lastSeen: '3 days ago',
    avatar: 'SC',
    joined: 'Mar 10, 2026',
  },
  {
    id: 'USR_7835',
    name: 'Lucas Morel',
    email: 'lucas.morel@studio.fr',
    status: 'Offline',
    plan: 'Free Tier',
    device: 'MacBook Pro 16" (M1 Max, macOS 15.0)',
    downloads: 63,
    lastSeen: '1 day ago',
    avatar: 'LM',
    joined: 'Mar 15, 2026',
  },
  {
    id: 'USR_7834',
    name: 'Avdesh Jadon (Admin)',
    email: 'theavdeshjadon@gmail.com',
    status: 'Active',
    plan: 'Super Admin',
    device: 'MacBook Pro (M-Series, macOS 15.3)',
    downloads: 785,
    lastSeen: 'Online Now',
    avatar: 'AJ',
    joined: 'Jan 01, 2025',
  },
];

export function getUsers() {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load users', e);
  }
  return DEFAULT_USERS;
}

export function saveUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to save users', e);
  }
}
