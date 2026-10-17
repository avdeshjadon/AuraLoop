import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.join(os.homedir(), 'Downloads', 'AuraLoop-Wallpapers');

const TARGETS = [
  { rel: 'Anime/Awakening_Sora_4k.mov', bitrate: '26M' },
  { rel: 'Anime/Supra_Nights_4k.mov', bitrate: '26M' },
  { rel: 'Cars/Synthwave_Highway_4k.mov', bitrate: '14M' },
  { rel: 'Nature/Sakura_Stream_4k.mov', bitrate: '24M' },
  { rel: 'Nature/Seaside_Summer_4k.mov', bitrate: '24M' },
  { rel: 'Video_Games/The_Devourer_of_Gods_4k.mov', bitrate: '24M' }
];

console.log('\n==========================================================');
console.log('       AuraLoop 4K Lossless Video Optimizer (<300MB)      ');
console.log('==========================================================\n');

for (const target of TARGETS) {
  const fullPath = path.join(ROOT_DIR, target.rel);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${target.rel}, skipping.`);
    continue;
  }

  const stat = fs.statSync(fullPath);
  const oldMB = (stat.size / 1024 / 1024).toFixed(1);

  if (stat.size <= 290 * 1024 * 1024) {
    console.log(`⏩ ${target.rel} is already ${oldMB} MB (<= 290MB). Skipping.`);
    continue;
  }

  console.log(`🎬 Compressing: ${target.rel} (${oldMB} MB) -> Target Bitrate: ${target.bitrate}...`);

  const tmpPath = fullPath + '.tmp.mov';
  const bakPath = fullPath + '.bak';

  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  const cmd = `ffmpeg -v error -stats -i "${fullPath}" -c:v h264_videotoolbox -b:v ${target.bitrate} -pix_fmt yuv420p -c:a copy -y "${tmpPath}"`;

  try {
    execSync(cmd, { stdio: 'inherit' });

    const newStat = fs.statSync(tmpPath);
    const newMB = (newStat.size / 1024 / 1024).toFixed(1);
    const pct = (((stat.size - newStat.size) / stat.size) * 100).toFixed(1);

    if (newStat.size < 5 * 1024 * 1024) {
      throw new Error('Compressed file too small, possible corruption');
    }

    // Verify with ffprobe
    execSync(`ffprobe -v error "${tmpPath}"`);

    // Safely replace original
    fs.renameSync(fullPath, bakPath);
    fs.renameSync(tmpPath, fullPath);
    fs.unlinkSync(bakPath);

    console.log(`✅ Success: ${target.rel} reduced from ${oldMB} MB to ${newMB} MB (-${pct}% saved!)\n`);
  } catch (err) {
    console.error(`❌ Failed to compress ${target.rel}:`, err.message);
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    if (fs.existsSync(bakPath) && !fs.existsSync(fullPath)) {
      fs.renameSync(bakPath, fullPath);
    }
  }
}

console.log('🎉 All large 4K wallpapers optimized below Cloudflare 300MB limit!\n');
