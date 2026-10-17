#!/usr/bin/env node

/**
 * AuraLoop Wallpaper Downloader
 * Downloads 4K master videos and thumbnails directly from Muro CDN
 * into ~/Downloads/AuraLoop-Wallpapers/ organized by category.
 *
 * Usage:
 *   node scripts/download_wallpapers.mjs                    # Downloads all 500 wallpapers & thumbnails
 *   node scripts/download_wallpapers.mjs --featured         # Downloads 28 featured web wallpapers (~1 GB)
 *   node scripts/download_wallpapers.mjs --thumbs           # Downloads all 500 thumbnails only (~85 MB)
 *   node scripts/download_wallpapers.mjs --category Anime   # Downloads only Anime category
 *   node scripts/download_wallpapers.mjs --limit 10         # Test with 10 wallpapers
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const CATALOG_URL = 'https://cdn.murowallpaper.com/catalog.json';
const FEATURED_JSON_PATH = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../AuraLoop-Web/explore_wallpapers.json'
);
const BASE_DOWNLOAD_DIR = path.join(os.homedir(), 'Downloads', 'AuraLoop-Wallpapers');

// Parse CLI args
const args = process.argv.slice(2);
const isFeaturedOnly = args.includes('--featured');
const isThumbsOnly = args.includes('--thumbs');
const categoryArgIdx = args.indexOf('--category');
const targetCategory = categoryArgIdx !== -1 ? args[categoryArgIdx + 1] : null;
const limitArgIdx = args.indexOf('--limit');
const limitCount = limitArgIdx !== -1 ? parseInt(args[limitArgIdx + 1], 10) : Infinity;
const concurrencyArgIdx = args.indexOf('--concurrency');
const CONCURRENCY = concurrencyArgIdx !== -1 ? parseInt(args[concurrencyArgIdx + 1], 10) : 6;

function sanitizeName(str) {
  return str
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

async function downloadFile(url, destPath, expectedSize) {
  try {
    if (fs.existsSync(destPath)) {
      const stat = fs.statSync(destPath);
      if (expectedSize && Math.abs(stat.size - expectedSize) < 1024) {
        return { status: 'skipped', size: stat.size };
      }
      if (!expectedSize && stat.size > 0) {
        return { status: 'skipped', size: stat.size };
      }
    }

    const tempPath = `${destPath}.tmp.${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const fileStream = fs.createWriteStream(tempPath);
    await pipeline(Readable.fromWeb(res.body), fileStream);
    fs.renameSync(tempPath, destPath);

    const stat = fs.statSync(destPath);
    return { status: 'downloaded', size: stat.size };
  } catch (err) {
    return { status: 'failed', error: err.message };
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('       AuraLoop 4K Wallpaper Batch Downloader        ');
  console.log('======================================================\n');
  console.log(`📂 Destination: ${BASE_DOWNLOAD_DIR}`);

  // 1. Fetch catalog
  console.log('⏳ Fetching catalog list from CDN...');
  let wallpapers = [];

  try {
    const res = await fetch(CATALOG_URL);
    const data = await res.json();
    wallpapers = data.wallpapers || [];
  } catch (err) {
    console.error('❌ Failed to fetch catalog.json:', err.message);
    process.exit(1);
  }

  // Filter if featured
  if (isFeaturedOnly && fs.existsSync(FEATURED_JSON_PATH)) {
    const featuredList = JSON.parse(fs.readFileSync(FEATURED_JSON_PATH, 'utf8'));
    const featuredIds = new Set(featuredList.map(w => w.id));
    wallpapers = wallpapers.filter(w => featuredIds.has(w.id));
    console.log(`🎯 Mode: Featured Web Wallpapers (${wallpapers.length} items)`);
  } else if (targetCategory) {
    wallpapers = wallpapers.filter(
      w => w.category?.toLowerCase() === targetCategory.toLowerCase()
    );
    console.log(`🎯 Mode: Category "${targetCategory}" (${wallpapers.length} items)`);
  } else {
    console.log(`🎯 Mode: Full Catalog (${wallpapers.length} items)`);
  }

  if (limitCount < wallpapers.length) {
    wallpapers = wallpapers.slice(0, limitCount);
    console.log(`✂️  Limited to first ${limitCount} items`);
  }

  // Ensure directories
  fs.mkdirSync(BASE_DOWNLOAD_DIR, { recursive: true });

  const tasks = [];
  for (const w of wallpapers) {
    const category = sanitizeName(w.category || 'Uncategorized');
    const title = sanitizeName(w.title || w.id);
    const catDir = path.join(BASE_DOWNLOAD_DIR, category);
    fs.mkdirSync(catDir, { recursive: true });

    // Thumbnail task
    tasks.push({
      type: 'thumb',
      id: w.id,
      title: w.title,
      category,
      url: w.thumbnail,
      dest: path.join(catDir, `${title}_thumb.jpg`),
      expectedSize: null,
    });

    // Video task (if not thumbs-only)
    if (!isThumbsOnly && w.video) {
      tasks.push({
        type: 'video',
        id: w.id,
        title: w.title,
        category,
        url: w.video,
        dest: path.join(catDir, `${title}_4k.mov`),
        expectedSize: w.sizeBytes,
      });
    }
  }

  console.log(`📦 Total assets to download: ${tasks.length}`);
  console.log(`🚀 Concurrency: ${CONCURRENCY} parallel workers\n`);

  let completed = 0;
  let downloadedBytes = 0;
  let skippedCount = 0;
  let downloadedCount = 0;
  let failedCount = 0;

  async function worker(queue) {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;

      const result = await downloadFile(task.url, task.dest, task.expectedSize);
      completed++;
      const pct = ((completed / tasks.length) * 100).toFixed(1);

      if (result.status === 'downloaded') {
        downloadedCount++;
        downloadedBytes += result.size || 0;
        console.log(
          `[${completed}/${tasks.length}] (${pct}%) ✅ ${task.category}/${path.basename(task.dest)} (${formatBytes(result.size)})`
        );
      } else if (result.status === 'skipped') {
        skippedCount++;
        console.log(
          `[${completed}/${tasks.length}] (${pct}%) ⏭️  [Already Exists] ${task.category}/${path.basename(task.dest)}`
        );
      } else {
        failedCount++;
        console.error(
          `[${completed}/${tasks.length}] (${pct}%) ❌ Failed: ${task.category}/${path.basename(task.dest)}: ${result.error}`
        );
      }
    }
  }

  const queue = [...tasks];
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
  const startTime = Date.now();

  await Promise.all(workers);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n======================================================');
  console.log('                 Download Summary                     ');
  console.log('======================================================');
  console.log(`⏱️  Duration:        ${durationSec}s`);
  console.log(`📥 Downloaded:      ${downloadedCount} files (${formatBytes(downloadedBytes)})`);
  console.log(`⏭️  Skipped:         ${skippedCount} files (already downloaded)`);
  console.log(`❌ Failed:          ${failedCount} files`);
  console.log(`📁 Location:        ${BASE_DOWNLOAD_DIR}`);
  console.log('======================================================\n');
}

main();
