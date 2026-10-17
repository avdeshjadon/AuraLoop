#!/usr/bin/env node

/**
 * AuraLoop Thumbnail Generator
 * Generates crisp 4K/high-res thumbnails for every .mp4 video in Premium/
 * placing the thumbnail in the exact same character folder with `_thumb.jpg`.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PREMIUM_DIR = path.join(os.homedir(), 'Downloads', 'AuraLoop-Wallpapers', 'Premium');
const CONCURRENCY = 4;

async function generateThumb(videoPath, thumbPath) {
  // Seek to 1.5s to get a clear, stable frame (past fade-in)
  const args = [
    '-y',
    '-ss', '00:00:01.5',
    '-i', videoPath,
    '-frames:v', '1',
    '-update', '1',
    '-q:v', '2',
    thumbPath
  ];

  try {
    await execFileAsync('/opt/homebrew/bin/ffmpeg', args);
    return { ok: true };
  } catch (err) {
    // If video is shorter than 1.5s, fallback to 0.5s
    try {
      const fallbackArgs = [
        '-y',
        '-ss', '00:00:00.5',
        '-i', videoPath,
        '-frames:v', '1',
        '-update', '1',
        '-q:v', '2',
        thumbPath
      ];
      await execFileAsync('/opt/homebrew/bin/ffmpeg', fallbackArgs);
      return { ok: true };
    } catch (err2) {
      return { ok: false, error: err2.message };
    }
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('       AuraLoop 4K Thumbnail Batch Generator         ');
  console.log('======================================================\n');
  console.log(`📂 Scanning: ${PREMIUM_DIR}\n`);

  if (!fs.existsSync(PREMIUM_DIR)) {
    console.error(`❌ Premium directory not found: ${PREMIUM_DIR}`);
    process.exit(1);
  }

  // Find all folders
  const characterFolders = fs.readdirSync(PREMIUM_DIR).filter(item => {
    const full = path.join(PREMIUM_DIR, item);
    return fs.statSync(full).isDirectory() && !item.startsWith('.');
  });

  const tasks = [];
  for (const folder of characterFolders) {
    const folderPath = path.join(PREMIUM_DIR, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.mp4'));

    for (const file of files) {
      const baseName = file.slice(0, -4);
      const videoPath = path.join(folderPath, file);
      const thumbPath = path.join(folderPath, `${baseName}_thumb.jpg`);

      tasks.push({
        folder,
        videoFile: file,
        thumbFile: `${baseName}_thumb.jpg`,
        videoPath,
        thumbPath
      });
    }
  }

  console.log(`🎬 Total videos found: ${tasks.length} across ${characterFolders.length} folders`);
  console.log(`🚀 Generating thumbnails (${CONCURRENCY} parallel workers)...\n`);

  let completed = 0;
  let createdCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  async function worker(queue) {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;

      if (fs.existsSync(task.thumbPath) && fs.statSync(task.thumbPath).size > 1024) {
        skippedCount++;
        completed++;
        continue;
      }

      const res = await generateThumb(task.videoPath, task.thumbPath);
      completed++;
      const pct = ((completed / tasks.length) * 100).toFixed(1);

      if (res.ok) {
        createdCount++;
        const sizeKb = (fs.statSync(task.thumbPath).size / 1024).toFixed(0);
        console.log(`[${completed}/${tasks.length}] (${pct}%) 📸 Generated: ${task.folder}/${task.thumbFile} (${sizeKb} KB)`);
      } else {
        failedCount++;
        console.error(`[${completed}/${tasks.length}] (${pct}%) ❌ Failed: ${task.folder}/${task.videoFile}: ${res.error}`);
      }
    }
  }

  const queue = [...tasks];
  const startTime = Date.now();
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));

  await Promise.all(workers);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n======================================================');
  console.log('                 Thumbnail Summary                    ');
  console.log('======================================================');
  console.log(`⏱️  Duration:        ${durationSec}s`);
  console.log(`📸 Generated:       ${createdCount} thumbnails`);
  console.log(`⏭️  Skipped:         ${skippedCount} thumbnails (already existed)`);
  console.log(`❌ Failed:          ${failedCount}`);
  console.log(`📁 Destination:     ${PREMIUM_DIR}`);
  console.log('======================================================\n');
}

main();
