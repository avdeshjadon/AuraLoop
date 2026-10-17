#!/usr/bin/env node

/**
 * AuraLoop R2 Batch Wallpaper Uploader
 * 
 * Safely uploads the 8 wallpaper categories (1,582 files, ~42.5 GB) to Cloudflare R2
 * with multi-threading, correct MIME headers, cache headers, and auto-resume.
 * 
 * Destination in R2:
 * - Abstract/<file>
 * - Anime/<file>
 * - Cars/<file>
 * - Movies/<file>
 * - Nature/<file>
 * - Premium/<character>/<file>
 * - Sci-fi/<file>
 * - Video_Games/<file>
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const BUCKET = 'auraloop-wallpapers';
const ROOT_DIR = path.join(os.homedir(), 'Downloads', 'AuraLoop-Wallpapers');
const STATE_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), 'upload_progress.json');
const CONCURRENCY = 3; // 3 parallel uploads

const CATEGORIES = [
  'Abstract',
  'Anime',
  'Cars',
  'Movies',
  'Nature',
  'Premium',
  'Sci-fi',
  'Video_Games'
];

const MIME_MAP = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Warning: could not save state file:', err.message);
  }
}

function collectFiles(dir, rel = '') {
  const result = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    if (entry.startsWith('.')) continue; // skip .DS_Store
    const full = path.join(dir, entry);
    const itemRel = rel ? `${rel}/${entry}` : entry;
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      result.push(...collectFiles(full, itemRel));
    } else {
      const ext = path.extname(entry).toLowerCase();
      if (MIME_MAP[ext]) {
        result.push({
          fullPath: full,
          relPath: itemRel,
          size: stat.size,
          ext
        });
      }
    }
  }

  return result;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadFile(item, retries = 3) {
  const r2Key = `${BUCKET}/${item.relPath}`;
  const contentType = MIME_MAP[item.ext] || 'application/octet-stream';
  const cacheControl = 'public, max-age=31536000, immutable';

  const args = [
    'r2', 'object', 'put',
    r2Key,
    '--file', item.fullPath,
    '--remote',
    '--content-type', contentType,
    '--cache-control', cacheControl
  ];

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await execFileAsync('/usr/local/bin/wrangler', args, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 300000 // 5 minutes timeout
      });
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      const firstLine = (err.stderr || err.message || '').split('\n').filter(Boolean)[0] || 'Unknown error';
      console.log(`⚠️  Upload glitch on ${item.relPath} (${attempt}/${retries}): ${firstLine}. Retrying in ${attempt * 2}s...`);
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
}

async function main() {
  console.log('\n==========================================================');
  console.log('       AuraLoop Cloudflare R2 Safe Wallpaper Uploader     ');
  console.log('==========================================================\n');
  console.log(`📁 Source: ${ROOT_DIR}`);
  console.log(`🪣 Bucket: ${BUCKET}`);
  console.log(`⚡ Concurrency: ${CONCURRENCY} parallel uploads\n`);

  if (!fs.existsSync(ROOT_DIR)) {
    console.error(`❌ Source folder not found: ${ROOT_DIR}`);
    process.exit(1);
  }

  // Scan all categories
  const allFiles = [];
  for (const cat of CATEGORIES) {
    const catDir = path.join(ROOT_DIR, cat);
    if (fs.existsSync(catDir)) {
      const catFiles = collectFiles(catDir, cat);
      allFiles.push(...catFiles);
    }
  }

  const totalBytes = allFiles.reduce((sum, f) => sum + f.size, 0);
  console.log(`🎬 Found ${allFiles.length} files to sync (${formatBytes(totalBytes)})\n`);

  const state = loadState();
  const queue = [];
  let alreadyUploadedBytes = 0;

  for (const item of allFiles) {
    if (state[item.relPath] && state[item.relPath].status === 'completed' && state[item.relPath].size === item.size) {
      alreadyUploadedBytes += item.size;
    } else {
      queue.push(item);
    }
  }

  const alreadyCount = allFiles.length - queue.length;
  console.log(`⏮️  Already uploaded: ${alreadyCount} files (${formatBytes(alreadyUploadedBytes)})`);
  console.log(`📤 Queue remaining: ${queue.length} files (${formatBytes(totalBytes - alreadyUploadedBytes)})\n`);

  if (queue.length === 0) {
    console.log('🎉 All files are already uploaded to Cloudflare R2!');
    process.exit(0);
  }

  let completedCount = alreadyCount;
  let uploadedBytes = alreadyUploadedBytes;
  let failedCount = 0;
  const startTime = Date.now();

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      const fileStart = Date.now();
      const currentNum = completedCount + 1;
      const progressPct = ((currentNum / allFiles.length) * 100).toFixed(1);
      const sizeStr = formatBytes(item.size);

      console.log(`[${currentNum}/${allFiles.length}] (${progressPct}%) ⏳ Uploading: ${item.relPath} (${sizeStr})...`);

      try {
        await uploadFile(item);
        const elapsedSec = ((Date.now() - fileStart) / 1000).toFixed(1);

        completedCount++;
        uploadedBytes += item.size;

        state[item.relPath] = {
          status: 'completed',
          size: item.size,
          uploadedAt: new Date().toISOString()
        };
        saveState(state);

        console.log(`[${completedCount}/${allFiles.length}] (${progressPct}%) ✅ Uploaded: ${item.relPath} in ${elapsedSec}s`);
      } catch (err) {
        failedCount++;
        console.error(`❌ Error uploading ${item.relPath}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n==========================================================');
  console.log('                 Upload Process Finished                  ');
  console.log('==========================================================');
  console.log(`⏱️  Duration:        ${totalTimeSec}s`);
  console.log(`✅ Uploaded:        ${completedCount - alreadyCount} files`);
  console.log(`⏮️  Already Existed: ${alreadyCount} files`);
  console.log(`❌ Failed:          ${failedCount} files`);
  console.log(`💾 Total Uploaded:  ${formatBytes(uploadedBytes)}`);
  console.log('==========================================================\n');
}

main();
