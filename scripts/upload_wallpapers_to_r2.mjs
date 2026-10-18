#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { header, section, info, ok, warn, error, plain, kv, table, list } from './lib/log.mjs';
import { formatBytes, formatDuration } from './lib/format.mjs';
import { confirm, installSignalHandlers, PromptCancelled, closePrompt } from './lib/prompt.mjs';
import { ProgressBar } from './lib/progress.mjs';
import { discoverLibrary, pickLibraryScope } from './lib/library.mjs';
import { walkFiles, UPLOADABLE_EXTENSIONS, VIDEO_EXTENSIONS, IMAGE_EXTENSIONS } from './lib/scan.mjs';
import { mapPool, withRetry } from './lib/async.mjs';
import {
  DEFAULT_BUCKET,
  findWrangler,
  createRestClient,
  wranglerPut,
} from './lib/r2.mjs';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const { values: args } = parseArgs({
  options: {
    dir: { type: 'string' },
    bucket: { type: 'string' },
    concurrency: { type: 'string' },
    'dry-run': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: true,
});

if (args.help) {
  plain('Usage: node scripts/upload_wallpapers_to_r2.mjs [--dir <library-path>] [--bucket <name>] [--concurrency <1-10>] [--dry-run]');
  plain('');
  plain('Uploads wallpaper files (.mp4/.mov/.jpg/.jpeg/.png/.webp) to Cloudflare R2 via wrangler,');
  plain('with resume state, bounded concurrency, retries, and remote duplicate detection.');
  process.exit(0);
}

installSignalHandlers();

const BUCKET = args.bucket ?? DEFAULT_BUCKET;
const STATE_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), 'upload_progress.json');
const CONCURRENCY = args.concurrency ? Math.max(1, Math.min(10, parseInt(args.concurrency, 10) || 3)) : 3;

const MIME_MAP = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
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
    warn(`Could not save state file: ${err.message}`);
  }
}

function objectKeyFor(file, root, scopePath) {
  const relFromRoot = path.relative(root, file.absPath);
  if (!relFromRoot.startsWith('..') && !path.isAbsolute(relFromRoot)) {
    return relFromRoot.split(path.sep).join('/');
  }
  const relFromScope = path.relative(scopePath, file.absPath);
  return relFromScope.split(path.sep).join('/');
}

async function main() {
  header('AuraLoop Cloudflare R2 Wallpaper Uploader');

  const wranglerBin = findWrangler();
  if (!wranglerBin) {
    error('wrangler CLI not found. Install it with: npm install -g wrangler');
    process.exit(1);
  }
  info(`wrangler: ${wranglerBin}`);
  kv('Bucket', BUCKET);
  kv('Concurrency', String(CONCURRENCY));
  kv('Auth Mode', process.env.CLOUDFLARE_API_TOKEN ? 'API Token (permanent, no browser login)' : 'Wrangler OAuth session');
  if (args['dry-run']) {
    warn('Dry-run mode: no files will be uploaded.');
  }

  const { root } = await discoverLibrary({ overridePath: args.dir });
  const scope = await pickLibraryScope(root, {
    promptLabel: 'What would you like to upload?',
  });
  info(`Scope: ${scope.label}`);

  const { files, errors } = await walkFiles(scope.path, { extensions: UPLOADABLE_EXTENSIONS });
  if (errors.length > 0) {
    warn(`${errors.length} locations could not be read (skipped).`);
  }
  if (files.length === 0) {
    warn('No uploadable files (.mp4, .mov, .jpg, .jpeg, .png, .webp) found in scope.');
    return;
  }

  const items = files.map((file) => ({
    ...file,
    key: objectKeyFor(file, root, scope.path),
    contentType: MIME_MAP[file.ext] ?? 'application/octet-stream',
  }));

  const totalBytes = items.reduce((sum, item) => sum + item.size, 0);
  const videoCount = items.filter((i) => VIDEO_EXTENSIONS.has(i.ext)).length;
  const imageCount = items.filter((i) => IMAGE_EXTENSIONS.has(i.ext)).length;
  section('Scan results');
  kv('Files', `${items.length} (${formatBytes(totalBytes)})`);
  kv('Videos', String(videoCount));
  kv('Images', String(imageCount));

  const state = loadState();
  info('Connecting to Cloudflare R2 and verifying remote inventory...');
  const rest = await createRestClient();

  let remoteSizes = null;
  if (rest) {
    try {
      remoteSizes = new Map();
      for await (const object of rest.iterateObjects(BUCKET, { perPage: 1000 })) {
        remoteSizes.set(object.key, object.size);
      }
      info(`Remote inventory: ${remoteSizes.size} objects found.`);
    } catch (err) {
      warn(`Remote inventory unavailable (${err.message}); falling back to local state only.`);
      remoteSizes = null;
    }
  } else {
    info('No REST API credentials available; duplicate detection uses the local state file only.');
  }

  const queue = [];
  const stateSkips = [];
  const remoteSkips = [];
  const overwrites = [];

  for (const item of items) {
    const stateEntry = state[item.key];
    if (stateEntry && stateEntry.status === 'completed' && stateEntry.size === item.size) {
      stateSkips.push(item);
      continue;
    }
    if (remoteSizes && remoteSizes.has(item.key)) {
      if (remoteSizes.get(item.key) === item.size) {
        remoteSkips.push(item);
        continue;
      }
      overwrites.push(item);
      continue;
    }
    queue.push(item);
  }

  section('Upload plan');
  kv('Already uploaded (local state)', `${stateSkips.length} files (${formatBytes(stateSkips.reduce((s, i) => s + i.size, 0))})`);
  kv('Already on R2 (size verified)', `${remoteSkips.length} files (${formatBytes(remoteSkips.reduce((s, i) => s + i.size, 0))})`);
  kv('New uploads', `${queue.length} files (${formatBytes(queue.reduce((s, i) => s + i.size, 0))})`);
  kv('Exist with different size', `${overwrites.length} files (${formatBytes(overwrites.reduce((s, i) => s + i.size, 0))})`);

  if (overwrites.length > 0) {
    plain('');
    list(overwrites.slice(0, 10).map((i) => `${i.key} (local ${formatBytes(i.size)} vs remote ${formatBytes(remoteSizes.get(i.key))})`));
    if (overwrites.length > 10) plain(`    ... and ${overwrites.length - 10} more`);
    const overwriteOk = await confirm(
      `${overwrites.length} objects exist on R2 with different sizes. Re-upload and overwrite them?`,
      { def: false },
    );
    if (!overwriteOk) {
      info('Different-sized objects will be skipped.');
    } else {
      queue.push(...overwrites);
    }
  }

  if (queue.length === 0) {
    ok('Everything in scope is already uploaded.');
    return;
  }

  if (args['dry-run']) {
    section('Dry-run preview (no uploads performed)');
    table([['Object key', 'Size'], ...queue.slice(0, 20).map((i) => [i.key, formatBytes(i.size)])]);
    if (queue.length > 20) plain(`    ... and ${queue.length - 20} more`);
    kv('Total that would be uploaded', `${queue.length} files (${formatBytes(queue.reduce((s, i) => s + i.size, 0))})`);
    return;
  }

  if (!(await confirm(`Upload ${queue.length} files (${formatBytes(queue.reduce((s, i) => s + i.size, 0))}) to bucket "${BUCKET}"?`, { def: true }))) {
    info('Cancelled. No files were uploaded.');
    return;
  }

  const controller = new AbortController();
  let interrupting = false;
  process.on('SIGINT', () => {
    if (interrupting) process.exit(130);
    interrupting = true;
    warn('Interrupt received; workers will stop after the current upload...');
    controller.abort();
  });

  const queueBytes = queue.reduce((s, i) => s + i.size, 0);
  const bar = new ProgressBar({ total: queueBytes, label: 'Starting...' });
  const startedAt = Date.now();
  let uploadedCount = 0;
  let uploadedBytes = 0;
  const failures = [];
  let currentLabel = '';

  const workQueue = [...queue];
  const { errors: uploadErrors } = await mapPool(workQueue, CONCURRENCY, async (item) => {
    if (controller.signal.aborted) throw new Error('Aborted.');
    const fileStart = Date.now();
    currentLabel = `Uploading ${item.key} (${formatBytes(item.size)})`;
    bar.update({
      label: currentLabel,
      countText: countText(),
    });

    await withRetry(async (attempt) => {
      try {
        await wranglerPut(BUCKET, {
          key: item.key,
          filePath: item.absPath,
          contentType: item.contentType,
          cacheControl: 'public, max-age=31536000, immutable',
          signal: controller.signal,
        });
      } catch (err) {
        if (attempt >= 3) throw err;
        bar.note(`  [!] Retry on ${item.key} (${attempt}/3): ${err.message.split('\n')[0]}`);
        throw err;
      }
    }, { retries: 3, baseDelayMs: 2000, signal: controller.signal });

    uploadedCount += 1;
    uploadedBytes += item.size;
    state[item.key] = {
      status: 'completed',
      size: item.size,
      uploadedAt: new Date().toISOString(),
    };
    saveState(state);

    const fileSec = ((Date.now() - fileStart) / 1000).toFixed(1);
    bar.note(`  [+] Uploaded: ${item.key} (${formatBytes(item.size)}) in ${fileSec}s`);
    bar.update({
      completed: uploadedBytes,
      countText: countText(),
      label: `${uploadedCount}/${queue.length} completed`,
    });
  });

  function countText() {
    const elapsed = (Date.now() - startedAt) / 1000;
    const speed = elapsed > 0 ? uploadedBytes / elapsed : 0;
    const remaining = Math.max(queueBytes - uploadedBytes, 0);
    const eta = speed > 0 ? formatDuration(remaining / speed) : 'Calculating...';
    return `${uploadedCount}/${queue.length} files (${formatBytes(uploadedBytes)}/${formatBytes(queueBytes)}) | ${formatBytes(Math.round(speed))}/s | ETA ${eta}`;
  }

  for (const { item, error: err } of uploadErrors) {
    if (controller.signal.aborted && err.message === 'Aborted.') continue;
    failures.push({ key: item.key, reason: err.message });
  }

  const elapsed = (Date.now() - startedAt) / 1000;
  bar.finish();

  section('Upload summary');
  kv('Duration', formatDuration(elapsed));
  kv('Uploaded', `${uploadedCount} files (${formatBytes(uploadedBytes)})`);
  kv('Skipped (local state)', `${stateSkips.length} files`);
  kv('Skipped (verified on R2)', `${remoteSkips.length} files`);
  kv('Failed', `${failures.length} files`);
  if (elapsed > 0 && uploadedBytes > 0) {
    kv('Average speed', `${formatBytes(Math.round(uploadedBytes / elapsed))}/s`);
  }
  if (failures.length > 0) {
    plain('');
    error('Failed uploads:');
    list(failures.map((f) => `${f.key} - ${f.reason.split('\n')[0]}`));
    process.exitCode = 1;
  }
  plain('');
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
