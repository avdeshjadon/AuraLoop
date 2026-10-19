import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { findBinary, run } from './media.mjs';
import { pathExists } from './fsutil.mjs';
import { VIDEO_EXTENSIONS } from './scan.mjs';

export function thumbPathFor(videoPath) {
  const ext = path.extname(videoPath);
  const base = path.basename(videoPath, ext);
  return path.join(path.dirname(videoPath), `${base}_thumb.jpg`);
}

export function validateThumb(p) {
  try {
    return fs.statSync(p).size > 1024;
  } catch {
    return false;
  }
}

export function findMissingThumbnails(videos) {
  return videos.filter((v) => {
    if (!VIDEO_EXTENSIONS.has(v.ext)) return false;
    const tPath = thumbPathFor(v.absPath);
    return !validateThumb(tPath);
  });
}

export async function generateThumbnailsForVideos(videos, { signal, onProgress, onNote } = {}) {
  const ffmpeg = findBinary('ffmpeg');
  const hasQuickLook = await pathExists('/usr/bin/qlmanage');
  const hasSips = await pathExists('/usr/bin/sips');

  if (!hasQuickLook && !ffmpeg) {
    throw new Error('Neither macOS QuickLook (qlmanage) nor ffmpeg was found to generate thumbnails.');
  }

  const byDir = new Map();
  for (const v of videos) {
    const dir = v.dir || path.dirname(v.absPath);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push(v);
  }

  let created = 0;
  let failed = 0;
  const failures = [];
  const createdFiles = [];

  for (const [folderPath, dirVideos] of byDir) {
    if (signal?.aborted) break;

    const filesToProcess = dirVideos.map((v) => ({
      file: v.name || path.basename(v.absPath),
      videoPath: v.absPath,
      thumbPath: thumbPathFor(v.absPath),
    }));

    const tmpDir = path.join(os.tmpdir(), `auraloop-thumb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    if (hasQuickLook) {
      try {
        await run('qlmanage', ['-t', '-s', '3840', '-o', tmpDir, ...filesToProcess.map((f) => f.videoPath)], {
          signal,
          allowFail: true,
          timeoutMs: 300000,
        });
      } catch {}
    }

    for (const item of filesToProcess) {
      if (signal?.aborted) break;
      const genPng = path.join(tmpDir, `${item.file}.png`);
      const tempJpg = path.join(folderPath, `.${item.file}.thumb-tmp.jpg`);
      let success = false;
      let failureReason = null;

      if (fs.existsSync(genPng) && fs.statSync(genPng).size > 1024 && hasSips) {
        try {
          await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '92', genPng, '--out', tempJpg], {
            signal,
            timeoutMs: 120000,
          });
          if (validateThumb(tempJpg)) {
            success = true;
          } else {
            failureReason = 'sips produced an empty or truncated image';
          }
        } catch (err) {
          failureReason = `sips failed (${err.message})`;
        }
      } else {
        failureReason = 'QuickLook did not produce a usable preview';
      }

      if (!success && ffmpeg) {
        try {
          await run(ffmpeg, [
            '-y',
            '-i', item.videoPath,
            '-vframes', '1',
            '-update', '1',
            '-q:v', '2',
            tempJpg,
          ], { signal, timeoutMs: 120000 });
          if (validateThumb(tempJpg)) {
            success = true;
            failureReason = null;
          } else {
            failureReason = 'ffmpeg produced an empty or truncated image';
          }
        } catch (err) {
          failureReason = `ffmpeg failed (${err.message})`;
        }
      }

      if (success) {
        try {
          fs.renameSync(tempJpg, item.thumbPath);
          created += 1;
          const stat = fs.statSync(item.thumbPath);
          createdFiles.push({
            absPath: item.thumbPath,
            dir: folderPath,
            name: path.basename(item.thumbPath),
            ext: '.jpg',
            size: stat.size,
            mtimeMs: stat.mtimeMs,
          });
          if (onNote) onNote(`  [+] Thumbnail created: ${path.basename(item.thumbPath)}`);
        } catch (err) {
          failed += 1;
          failures.push({ name: item.file, reason: `could not save thumbnail (${err.message})` });
        }
      } else {
        failed += 1;
        failures.push({ name: item.file, reason: failureReason ?? 'unknown error' });
      }

      try {
        if (fs.existsSync(tempJpg)) fs.rmSync(tempJpg, { force: true });
      } catch {}

      if (onProgress) {
        onProgress({ created, failed, total: videos.length, current: item.file });
      }
    }

    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }

  return { created, failed, failures, createdFiles };
}
