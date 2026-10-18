#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { header, section, info, warn, error, plain, kv, list } from './lib/log.mjs';
import { formatBytes, formatDuration } from './lib/format.mjs';
import { confirm, installSignalHandlers, PromptCancelled, closePrompt } from './lib/prompt.mjs';
import { ProgressBar } from './lib/progress.mjs';
import { discoverLibrary, pickLibraryScope } from './lib/library.mjs';
import { walkFiles } from './lib/scan.mjs';
import { findBinary, run } from './lib/media.mjs';
import { pathExists } from './lib/fsutil.mjs';

const { values: args } = parseArgs({
  options: {
    dir: { type: 'string' },
    'skip-existing': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: true,
});

if (args.help) {
  plain('Usage: node scripts/generate_thumbnails.mjs [--dir <library-path>] [--skip-existing]');
  plain('');
  plain('Generates 4K QuickLook thumbnails (.mp4 -> <name>_thumb.jpg) beside each video.');
  plain('Scope can be the whole library, a single subfolder, or a custom directory.');
  process.exit(0);
}

installSignalHandlers();

function thumbPathFor(videoPath) {
  const base = path.basename(videoPath).slice(0, -4);
  return path.join(path.dirname(videoPath), `${base}_thumb.jpg`);
}

function validateThumb(p) {
  try {
    return fs.statSync(p).size > 1024;
  } catch {
    return false;
  }
}

async function processFolder(folderPath, { ffmpeg, signal, onFile }) {
  let entries;
  try {
    entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
  } catch (err) {
    return { total: 0, created: 0, skipped: 0, failed: 1, failures: [{ name: folderPath, reason: err.message }] };
  }

  const mp4Files = entries
    .filter((e) => e.isFile() && !e.name.startsWith('.') && e.name.endsWith('.mp4'))
    .map((e) => e.name)
    .sort();

  const failures = [];
  let skipped = 0;
  const filesToProcess = [];
  for (const file of mp4Files) {
    const videoPath = path.join(folderPath, file);
    const thumbPath = thumbPathFor(videoPath);
    if (args['skip-existing'] && validateThumb(thumbPath)) {
      skipped += 1;
    } else {
      filesToProcess.push({ file, videoPath, thumbPath });
    }
  }

  if (filesToProcess.length === 0) {
    return { total: mp4Files.length, created: 0, skipped, failed: 0, failures };
  }

  const tmpDir = path.join(os.tmpdir(), `auraloop-thumb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    await run('qlmanage', ['-t', '-s', '3840', '-o', tmpDir, ...filesToProcess.map((f) => f.videoPath)], {
      signal,
      allowFail: true,
      timeoutMs: 300000,
    });
  } catch {}

  let created = 0;
  for (const item of filesToProcess) {
    if (signal.aborted) break;
    const genPng = path.join(tmpDir, `${item.file}.png`);
    const tempJpg = path.join(folderPath, `.${item.file.slice(0, -4)}.thumb-tmp.jpg`);
    let success = false;
    let failureReason = null;

    if (fs.existsSync(genPng) && fs.statSync(genPng).size > 1024) {
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
    } else if (!success && !ffmpeg) {
      failureReason = `${failureReason ?? 'no preview generated'} (ffmpeg fallback unavailable)`;
    }

    if (success) {
      try {
        fs.renameSync(tempJpg, item.thumbPath);
        created += 1;
      } catch (err) {
        failures.push({ name: item.file, reason: `could not replace thumbnail (${err.message})` });
      }
    } else {
      failures.push({ name: item.file, reason: failureReason ?? 'unknown error' });
    }
    try {
      if (fs.existsSync(tempJpg)) fs.rmSync(tempJpg, { force: true });
    } catch {}
    if (onFile) onFile(item.file, success);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return { total: mp4Files.length, created, skipped, failed: failures.length, failures };
}

async function main() {
  header('AuraLoop Thumbnail Generator');

  const ffmpeg = findBinary('ffmpeg');
  const hasQuickLook = await pathExists('/usr/bin/qlmanage');
  const hasSips = await pathExists('/usr/bin/sips');
  if (!hasQuickLook || !hasSips) {
    error('This tool requires macOS QuickLook (qlmanage) and sips.');
    process.exit(1);
  }
  if (!ffmpeg) {
    warn('ffmpeg not found: the frame-extraction fallback will be unavailable if QuickLook fails.');
  }

  const { root } = await discoverLibrary({ overridePath: args.dir });
  const scope = await pickLibraryScope(root, {
    promptLabel: 'Which thumbnails would you like to generate?',
  });
  info(`Scope: ${scope.label}`);
  info(`Mode: ${args['skip-existing'] ? 'skip existing valid thumbnails' : 'regenerate all thumbnails'}`);

  const { files } = await walkFiles(scope.path, { extensions: new Set(['.mp4']) });
  if (files.length === 0) {
    warn(`No .mp4 videos found under ${scope.label}.`);
    info('Note: this generator processes .mp4 videos (the project thumbnail format). .mov files are not processed.');
    return;
  }

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  plain('');
  kv('Videos found', `${files.length} (${formatBytes(totalBytes)})`);

  const toProcess = files.filter((f) => {
    if (!args['skip-existing']) return true;
    return !validateThumb(thumbPathFor(f.absPath));
  });
  const preSkipped = files.length - toProcess.length;
  if (args['skip-existing'] && preSkipped > 0) {
    kv('Already current', `${preSkipped} thumbnails (valid existing files will be skipped)`);
  }

  if (!(await confirm(`Generate thumbnails for ${files.length - preSkipped} videos?`, { def: true }))) {
    info('Cancelled. No thumbnails were changed.');
    return;
  }

  const byDir = new Map();
  for (const file of files) {
    if (!byDir.has(file.dir)) byDir.set(file.dir, []);
    byDir.get(file.dir).push(file);
  }

  const controller = new AbortController();
  let interrupting = false;
  process.on('SIGINT', () => {
    if (interrupting) process.exit(130);
    interrupting = true;
    warn('Interrupt received; stopping and cleaning up...');
    controller.abort();
  });

  const workTotal = Math.max(files.length - preSkipped, 1);
  const bar = new ProgressBar({ total: workTotal, label: 'Starting...' });
  const folderResults = [];
  let created = 0;
  let failed = 0;
  let skipped = 0;
  let processed = 0;
  const allFailures = [];
  const startedAt = Date.now();
  let dirIndex = 0;

  for (const [dir, dirFiles] of byDir) {
    if (controller.signal.aborted) break;
    dirIndex += 1;
    const relDir = path.relative(root, dir) || '.';
    bar.note(`[${dirIndex}/${byDir.size}] Folder: ${relDir}`);

    const result = await processFolder(dir, {
      ffmpeg,
      signal: controller.signal,
      onFile: () => {
        processed += 1;
        bar.update({
          completed: Math.min(processed, workTotal),
          countText: `${Math.min(processed, workTotal)}/${workTotal} files`,
          label: relDir,
        });
      },
    });
    created += result.created;
    failed += result.failed;
    skipped += result.skipped;
    for (const failure of result.failures) {
      allFailures.push({ name: `${relDir}/${failure.name}`, reason: failure.reason });
    }
    folderResults.push({ dir: relDir, ...result });

    bar.update({
      completed: Math.min(processed, workTotal),
      label: `Finished ${relDir}`,
      countText: `${Math.min(processed, workTotal)}/${workTotal} files`,
    });
  }

  const elapsed = (Date.now() - startedAt) / 1000;
  bar.finish();

  section('Thumbnail summary');
  kv('Duration', formatDuration(elapsed));
  kv('Videos in scope', String(files.length));
  kv('Generated', `${created} thumbnails`);
  kv('Skipped (already current)', `${skipped}`);
  kv('Failed', `${failed}`);
  kv('Destination', `${scope.label} (beside each video)`);
  if (controller.signal.aborted) {
    warn('Run was interrupted; results cover the folders that were processed.');
  }

  if (allFailures.length > 0) {
    plain('');
    error('Failed thumbnails:');
    list(allFailures.map((f) => `${f.name} - ${f.reason}`));
  }
  plain('');

  if (controller.signal.aborted) process.exitCode = 130;
  else if (failed > 0) process.exitCode = 1;
}

main().then(() => {
  closePrompt();
  process.exit(process.exitCode || 0);
}).catch((err) => {
  closePrompt();
  if (err instanceof PromptCancelled) {
    process.stdout.write('\n');
    info(err.message);
    process.exit(130);
  }
  error(err.message);
  process.exit(1);
});
