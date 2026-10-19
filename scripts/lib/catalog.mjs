import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { probe } from './media.mjs';
import { wranglerPut } from './r2.mjs';

export const DEFAULT_PUBLIC_BASE_URL =
  process.env.AURALOOP_R2_PUBLIC_URL ||
  process.env.CLOUDFLARE_R2_PUBLIC_URL ||
  'https://pub-f4cbb5cee07745c28cfa1399a4010695.r2.dev';

export function cleanTitle(filename) {
  let name = filename.replace(/\.[^/.]+$/, '');
  name = name.replace(/[-_ ]*(4k[ -_]?enhanced|enhanced|4k|1080p|720p|hd|uhd)$/i, '');
  name = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return name || filename;
}

export function categoryFor(relPath) {
  const parts = relPath.split('/').filter(Boolean);
  if (parts.length > 1) {
    return parts[0].replace(/_/g, ' ').trim();
  }
  return 'Wallpapers';
}

export function r2PublicUrl(key, baseUrl = DEFAULT_PUBLIC_BASE_URL) {
  const base = baseUrl.replace(/\/+$/, '');
  const encodedPath = key
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `${base}/${encodedPath}`;
}

export function loadCatalog(repoRoot) {
  const catalogPath = path.join(repoRoot, 'catalog.json');
  if (fs.existsSync(catalogPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      if (Array.isArray(data.wallpapers)) return data;
      if (Array.isArray(data)) return { wallpapers: data };
    } catch {}
  }
  return { wallpapers: [] };
}

export function saveCatalog(catalog, repoRoot) {
  const catalogPath = path.join(repoRoot, 'catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');

  // Also update AuraLoop-Web/explore_wallpapers.json if present
  const webExplorePath = path.join(repoRoot, 'AuraLoop-Web', 'explore_wallpapers.json');
  try {
    if (fs.existsSync(webExplorePath) || fs.existsSync(path.dirname(webExplorePath))) {
      const webData = catalog.wallpapers.map((w) => ({
        id: w.id,
        title: w.title,
        category: w.category,
        fps: Math.round(w.fps || 30),
        res: `${w.width || 3840}x${w.height || 2160}`,
        duration: `${Math.round(w.duration || 0)}s`,
        size: `${Math.round((w.sizeBytes || 0) / 1024 / 1024)} MB`,
        thumb: w.thumbnail,
        video: w.video,
      }));
      fs.writeFileSync(webExplorePath, JSON.stringify(webData, null, 2) + '\n', 'utf8');
    }
  } catch {}
}

export async function syncCatalogWithVideos(repoRoot, videos, {
  bucket,
  publicBaseUrl = DEFAULT_PUBLIC_BASE_URL,
  signal,
  onNote,
} = {}) {
  const catalog = loadCatalog(repoRoot);
  const existingMap = new Map();

  for (const entry of catalog.wallpapers) {
    if (entry.id) existingMap.set(entry.id, entry);
    if (entry.video) {
      existingMap.set(entry.video, entry);
      const urlDecoded = decodeURIComponent(entry.video);
      existingMap.set(urlDecoded, entry);
    }
    const signature = `${(entry.category || '').toLowerCase()}|${(entry.title || '').toLowerCase()}`;
    existingMap.set(signature, entry);
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const item of videos) {
    if (signal?.aborted) break;

    const key = item.key || item.relPath;
    const cat = categoryFor(key);
    const title = cleanTitle(item.name || path.basename(item.absPath));
    const signature = `${cat.toLowerCase()}|${title.toLowerCase()}`;

    const videoUrl = r2PublicUrl(key, publicBaseUrl);
    const thumbKey = key.replace(/\.[^/.]+$/, '') + '_thumb.jpg';
    const thumbUrl = r2PublicUrl(thumbKey, publicBaseUrl);

    let existing =
      existingMap.get(videoUrl) ||
      existingMap.get(decodeURIComponent(videoUrl)) ||
      existingMap.get(signature);

    if (existing) {
      // Check if size or metadata changed
      if (existing.sizeBytes !== item.size) {
        existing.sizeBytes = item.size;
        updatedCount += 1;
        if (onNote) onNote(`  [*] Updated catalog entry size for "${title}" (${cat})`);
      }
      continue;
    }

    // New video wallpaper to register in catalog
    let meta = {
      width: 3840,
      height: 2160,
      fps: 30,
      duration: 10,
    };

    try {
      const probeData = await probe(item.absPath, { signal });
      const vStream = probeData.streams?.find((s) => s.codec_type === 'video');
      if (vStream) {
        meta.width = vStream.width || 3840;
        meta.height = vStream.height || 2160;
        let fps = 30;
        if (vStream.r_frame_rate) {
          try {
            const [num, den] = vStream.r_frame_rate.split('/').map(Number);
            if (den) fps = num / den;
          } catch {}
        }
        meta.fps = Number(fps.toFixed(2));
      }
      if (probeData.format?.duration) {
        meta.duration = Number(probeData.format.duration);
      }
    } catch (err) {
      if (onNote) onNote(`  [!] Probe note for "${item.name}": using default dimensions`);
    }

    const newEntry = {
      id: crypto.randomUUID(),
      title,
      category: cat,
      width: meta.width,
      height: meta.height,
      fps: meta.fps,
      duration: meta.duration,
      sizeBytes: item.size,
      video: videoUrl,
      thumbnail: thumbUrl,
      preview720: videoUrl,
      publishedAt: new Date().toISOString(),
    };

    catalog.wallpapers.push(newEntry);
    existingMap.set(newEntry.id, newEntry);
    existingMap.set(videoUrl, newEntry);
    existingMap.set(signature, newEntry);
    addedCount += 1;

    if (onNote) onNote(`  [+] Added to catalog: "${title}" [${cat}] (${meta.width}x${meta.height}, ${meta.fps}fps)`);
  }

  if (addedCount > 0 || updatedCount > 0) {
    saveCatalog(catalog, repoRoot);

    if (bucket) {
      const catalogPath = path.join(repoRoot, 'catalog.json');
      try {
        if (onNote) onNote(`  [↑] Uploading updated catalog.json to bucket "${bucket}"...`);
        await wranglerPut(bucket, {
          key: 'catalog.json',
          filePath: catalogPath,
          contentType: 'application/json',
          cacheControl: 'public, max-age=60',
          signal,
        });
        if (onNote) onNote(`  [✓] catalog.json synced successfully to R2!`);
      } catch (err) {
        throw new Error(`Failed to upload catalog.json to R2: ${err.message}`);
      }
    }
  }

  return { catalog, addedCount, updatedCount };
}
