#!/usr/bin/env node

/**
 * AuraLoop Native macOS Thumbnail Batch Generator
 * Uses macOS QuickLook (`qlmanage`) to generate exact 4K thumbnails
 * identical to what Finder displays as the video preview icon, then converts
 * them to high-quality JPG (`_thumb.jpg`) in the same character folder.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PREMIUM_DIR = path.join(os.homedir(), 'Downloads', 'AuraLoop-Wallpapers', 'Premium');
const SKIP_EXISTING = process.argv.includes('--skip-existing');

async function processFolder(folderName, folderPath) {
  const mp4Files = fs.readdirSync(folderPath).filter(f => f.endsWith('.mp4') && !f.startsWith('.'));
  if (mp4Files.length === 0) return { folder: folderName, total: 0, created: 0, skipped: 0, failed: 0 };

  const tmpDir = path.join(os.tmpdir(), `auraloop-thumb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const filesToProcess = [];
  let skipped = 0;

  for (const file of mp4Files) {
    const baseName = file.slice(0, -4);
    const thumbPath = path.join(folderPath, `${baseName}_thumb.jpg`);
    const videoPath = path.join(folderPath, file);

    if (SKIP_EXISTING && fs.existsSync(thumbPath) && fs.statSync(thumbPath).size > 1024) {
      skipped++;
    } else {
      filesToProcess.push({ file, baseName, videoPath, thumbPath });
    }
  }

  if (filesToProcess.length === 0) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return { folder: folderName, total: mp4Files.length, created: 0, skipped, failed: 0 };
  }

  // 1. Batch generate PNG thumbnails using native macOS QuickLook
  const videoPaths = filesToProcess.map(f => f.videoPath);
  try {
    await execFileAsync('qlmanage', ['-t', '-s', '3840', '-o', tmpDir, ...videoPaths]);
  } catch (err) {
    // qlmanage might exit with non-zero on minor warnings, ignore if files were generated
  }

  let created = 0;
  let failed = 0;

  // 2. Convert each generated PNG to JPEG via sips (or fallback to ffmpeg)
  for (const item of filesToProcess) {
    const genPng = path.join(tmpDir, `${item.file}.png`);
    let success = false;

    if (fs.existsSync(genPng) && fs.statSync(genPng).size > 1024) {
      try {
        await execFileAsync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '92', genPng, '--out', item.thumbPath]);
        success = true;
      } catch (err) {
        // Fallback to ffmpeg
      }
    }

    if (!success) {
      // Fallback: extract frame 0 via ffmpeg
      try {
        await execFileAsync('/opt/homebrew/bin/ffmpeg', [
          '-y',
          '-i', item.videoPath,
          '-vframes', '1',
          '-update', '1',
          '-q:v', '2',
          item.thumbPath
        ]);
        success = true;
      } catch (err2) {
        console.error(`❌ Failed thumbnail for ${folderName}/${item.file}:`, err2.message);
        failed++;
      }
    }

    if (success) {
      created++;
    }
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return { folder: folderName, total: mp4Files.length, created, skipped, failed };
}

async function main() {
  console.log('\n======================================================');
  console.log('   AuraLoop macOS Native QuickLook Thumbnail Generator');
  console.log('======================================================\n');
  console.log(`📂 Scanning: ${PREMIUM_DIR}`);
  console.log(`⚡ Mode: ${SKIP_EXISTING ? 'Skip existing' : 'Regenerate / Match macOS Finder'}\n`);

  if (!fs.existsSync(PREMIUM_DIR)) {
    console.error(`❌ Premium directory not found: ${PREMIUM_DIR}`);
    process.exit(1);
  }

  const characterFolders = fs.readdirSync(PREMIUM_DIR).filter(item => {
    const full = path.join(PREMIUM_DIR, item);
    return fs.statSync(full).isDirectory() && !item.startsWith('.');
  }).sort();

  console.log(`📁 Found ${characterFolders.length} character folders.\n`);

  let grandTotal = 0;
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  for (let i = 0; i < characterFolders.length; i++) {
    const folder = characterFolders[i];
    const folderPath = path.join(PREMIUM_DIR, folder);
    const res = await processFolder(folder, folderPath);

    grandTotal += res.total;
    totalCreated += res.created;
    totalSkipped += res.skipped;
    totalFailed += res.failed;

    const pct = (((i + 1) / characterFolders.length) * 100).toFixed(0);
    console.log(`[${i + 1}/${characterFolders.length}] (${pct}%) ✅ ${folder}: ${res.created} created, ${res.skipped} skipped, ${res.failed} failed`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n======================================================');
  console.log('                 Thumbnail Summary                    ');
  console.log('======================================================');
  console.log(`⏱️  Duration:        ${durationSec}s`);
  console.log(`🎬 Total Videos:    ${grandTotal}`);
  console.log(`📸 Generated:       ${totalCreated} thumbnails`);
  console.log(`⏭️  Skipped:         ${totalSkipped}`);
  console.log(`❌ Failed:          ${totalFailed}`);
  console.log(`📁 Destination:     ${PREMIUM_DIR}`);
  console.log('======================================================\n');
}

main();
