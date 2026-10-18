import fs from 'node:fs';
import path from 'node:path';

export const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov']);
export const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
export const UPLOADABLE_EXTENSIONS = new Set([...VIDEO_EXTENSIONS, ...IMAGE_EXTENSIONS]);

export const COMPRESS_THRESHOLDS_MB = [
  30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 170, 200, 220, 250, 270, 300, 320, 350, 370, 400,
  450, 500, 600, 700, 800, 900, 1000, 1250, 1500, 2000, 3000,
];

export function toPosixRel(absPath, rootDir) {
  return path.relative(rootDir, absPath).split(path.sep).join('/');
}

export async function walkFiles(rootDir, { extensions } = {}) {
  const files = [];
  const errors = [];
  const startedAt = Date.now();

  async function walk(dir) {
    let entries;
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (error) {
      errors.push({ dir, error: error.message });
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions && !extensions.has(ext)) continue;
      try {
        const stat = await fs.promises.stat(full);
        files.push({
          absPath: full,
          relPath: toPosixRel(full, rootDir),
          dir,
          name: entry.name,
          ext,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
        });
      } catch (error) {
        errors.push({ dir: full, error: error.message });
      }
    }
  }

  await walk(rootDir);
  return { files, errors, durationMs: Date.now() - startedAt };
}

export function classifyFile(ext) {
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  return 'other';
}

export function topDirStats(files) {
  const stats = new Map();
  for (const file of files) {
    const top = file.relPath.includes('/') ? file.relPath.split('/')[0] : '(library root)';
    let entry = stats.get(top);
    if (!entry) {
      entry = { top, files: 0, bytes: 0, video: 0, image: 0, other: 0 };
      stats.set(top, entry);
    }
    entry.files += 1;
    entry.bytes += file.size;
    entry[classifyFile(file.ext)] += 1;
  }
  return [...stats.values()].sort((a, b) => a.top.localeCompare(b.top));
}

export function thresholdRows(videoSizesBytes, thresholdsMb = COMPRESS_THRESHOLDS_MB) {
  return thresholdsMb.map((mb) => {
    const bytes = mb * 1024 * 1024;
    let count = 0;
    let total = 0;
    for (const size of videoSizesBytes) {
      if (size > bytes) {
        count += 1;
        total += size;
      }
    }
    return { mb, count, total };
  });
}
