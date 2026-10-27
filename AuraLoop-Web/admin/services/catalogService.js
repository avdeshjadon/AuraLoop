// AuraLoop Catalog Service
// Loads real wallpapers from Cloudflare R2 / catalog.json (785+ wallpapers in Cloudflare R2)
const R2_CATALOG_URL = 'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev/catalog.json';
const STORAGE_KEY = 'auraloop_catalog_custom';
export const fallbackWallpapers = [];

export async function fetchCatalog() {
  try {
    let res = await fetch('/catalog.json');
    if (!res.ok) {
      res = await fetch(R2_CATALOG_URL);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const baseWallpapers = (data.wallpapers && data.wallpapers.length > 0)
      ? data.wallpapers
      : [];

    // Check if there are local overrides/additions
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const local = JSON.parse(saved);
        if (Array.isArray(local) && local.length >= baseWallpapers.length) {
          return local;
        }
      } catch (e) {
        console.warn('Failed to parse local catalog override', e);
      }
    }
    return baseWallpapers;
  } catch (err) {
    console.warn('Network fetch for /catalog.json failed, checking R2 fallback:', err);
    try {
      const res = await fetch(R2_CATALOG_URL);
      if (res.ok) {
        const data = await res.json();
        if (data.wallpapers && data.wallpapers.length > 0) {
          return data.wallpapers;
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const local = JSON.parse(saved);
        if (Array.isArray(local) && local.length > 0) return local;
      } catch (e) {}
    }
    return fallbackWallpapers;
  }
}

export function saveCatalogToStorage(wallpapers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallpapers));
  } catch (e) {
    console.warn('LocalStorage limit reached', e);
  }
}

export function getCatalogStats(wallpapers) {
  const categories = {};
  let totalBytes = 0;
  let totalDuration = 0;

  for (const w of wallpapers) {
    const cat = w.category || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
    totalBytes += (w.sizeBytes || 0);
    totalDuration += (w.duration || 0);
  }

  const sortedCategories = Object.entries(categories)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalWallpapers: wallpapers.length,
    categories: sortedCategories,
    totalBytes,
    totalGigabytes: (totalBytes / (1024 * 1024 * 1024)).toFixed(1),
    averageDuration: wallpapers.length ? (totalDuration / wallpapers.length).toFixed(1) : 0,
  };
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
