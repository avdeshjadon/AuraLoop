#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { header, section, info, ok, warn, error, plain, kv, table, list } from './lib/log.mjs';
import { formatBytes, formatDuration } from './lib/format.mjs';
import { ask, choose, confirm, installSignalHandlers, PromptCancelled, closePrompt } from './lib/prompt.mjs';
import { ProgressBar } from './lib/progress.mjs';
import { discoverLibrary, pickLibraryScope, repoRoot } from './lib/library.mjs';
import { walkFiles, UPLOADABLE_EXTENSIONS, VIDEO_EXTENSIONS, IMAGE_EXTENSIONS } from './lib/scan.mjs';
import { mapPool, withRetry } from './lib/async.mjs';
import {
  DEFAULT_BUCKET,
  findWrangler,
  createRestClient,
  wranglerPut,
} from './lib/r2.mjs';
import {
  thumbPathFor,
  findMissingThumbnails,
  generateThumbnailsForVideos,
} from './lib/thumbs.mjs';
import {
  compressVideosBatch,
} from './lib/compress.mjs';
import {
  syncCatalogWithVideos,
  DEFAULT_PUBLIC_BASE_URL,
} from './lib/catalog.mjs';

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
    'skip-compress': { type: 'boolean' },
    'compress': { type: 'boolean' },
    'skip-thumbs': { type: 'boolean' },
    'no-catalog': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: true,
});

if (args.help) {
  plain('Usage: node scripts/upload_wallpapers_to_r2.mjs [options]');
  plain('');
  plain('Uploads wallpaper videos and thumbnails to Cloudflare R2 with automatic:');
  plain('  1. New folder and new video verification');
  plain('  2. Missing thumbnail detection and generation (4K QuickLook/ffmpeg)');
  plain('  3. Interactive video compression check');
  plain('  4. Automatic catalog.json generation & immediate R2 sync for the AuraLoop app');
  plain('');
  plain('Options:');
  plain('  --dir <path>          Path to wallpaper library directory');
  plain('  --bucket <name>       Cloudflare R2 bucket name (default: auraloop-wallpapers)');
  plain('  --concurrency <1-10>  Upload concurrency (default: 3)');
  plain('  --compress            Prompt/run compression without asking first');
  plain('  --skip-compress       Skip video compression check');
  plain('  --skip-thumbs         Skip thumbnail generation check');
  plain('  --no-catalog          Do not update or upload catalog.json');
  plain('  --dry-run             Preview changes without uploading');
  plain('  -h, --help            Show this help');
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
  header('AuraLoop Cloudflare R2 Wallpaper Sync & Uploader');

  const wranglerBin = findWrangler();
  if (!wranglerBin) {
    error('wrangler CLI not found. Install it with: npm install -g wrangler');
    process.exit(1);
  }
  info(`wrangler: ${wranglerBin}`);
  kv('Bucket', BUCKET);
  kv('Concurrency', String(CONCURRENCY));
  kv('Auth Mode', process.env.CLOUDFLARE_API_TOKEN ? 'API Token (permanent, no browser login)' : 'Wrangler OAuth session');
  kv('R2 Public Base URL', DEFAULT_PUBLIC_BASE_URL);
  if (args['dry-run']) {
    warn('Dry-run mode: no files or catalog will be uploaded to R2.');
  }

  // 1. Discover library & choose scope
  const { root } = await discoverLibrary({ overridePath: args.dir });
  const scope = await pickLibraryScope(root, {
    promptLabel: 'What would you like to check and upload?',
  });
  info(`Scope: ${scope.label}`);

  // 2. Initial scan of files
  let { files, errors } = await walkFiles(scope.path, { extensions: UPLOADABLE_EXTENSIONS });
  if (errors.length > 0) {
    warn(`${errors.length} locations could not be read (skipped).`);
  }
  if (files.length === 0) {
    warn('No uploadable files (.mp4, .mov, .jpg, .jpeg, .png, .webp) found in scope.');
    return;
  }

  // 3. Connect to R2 remote inventory to verify existing folders & files
  info('Connecting to Cloudflare R2 and checking remote inventory...');
  const rest = await createRestClient();
  let remoteSizes = null;
  const remoteFolders = new Set();

  if (rest) {
    try {
      remoteSizes = new Map();
      for await (const object of rest.iterateObjects(BUCKET, { perPage: 1000 })) {
        remoteSizes.set(object.key, object.size);
        if (object.key.includes('/')) {
          const topFolder = object.key.split('/')[0];
          remoteFolders.add(topFolder);
        }
      }
      info(`Remote inventory: ${remoteSizes.size} objects found on R2.`);
    } catch (err) {
      warn(`Remote inventory unavailable (${err.message}); falling back to local state.`);
      remoteSizes = null;
    }
  } else {
    info('No REST API credentials available; verification will use local state file.');
  }

  // 4. Detect subfolders in scope and compare with R2
  const localFoldersInScope = new Set();
  for (const f of files) {
    const rel = path.relative(root, f.absPath);
    if (rel.includes(path.sep)) {
      const topDir = rel.split(path.sep)[0];
      localFoldersInScope.add(topDir);
    }
  }

  section('Folder & Inventory verification');
  if (localFoldersInScope.size > 0) {
    plain('Folders in current scope:');
    for (const f of [...localFoldersInScope].sort()) {
      const isNewOnR2 = remoteSizes ? !remoteFolders.has(f) : false;
      if (isNewOnR2) {
        ok(`  [+] ${f}  --> [NEW SUBFOLDER - not yet on Cloudflare R2]`);
      } else {
        plain(`      ${f}  (present on R2)`);
      }
    }
  }

  // 5. Check thumbnails for all videos in scope
  let videoFiles = files.filter((f) => VIDEO_EXTENSIONS.has(f.ext));
  section(`Thumbnail verification (${videoFiles.length} videos)`);
  const missingThumbs = findMissingThumbnails(videoFiles);

  if (missingThumbs.length > 0) {
    warn(`⚠️ Found ${missingThumbs.length} video(s) without valid thumbnails!`);
    list(missingThumbs.slice(0, 10).map((v) => `${v.name} (in ${path.relative(root, v.dir) || '.'})`));
    if (missingThumbs.length > 10) {
      plain(`    ... and ${missingThumbs.length - 10} more`);
    }

    if (!args['skip-thumbs']) {
      const shouldGenerate = await confirm(
        `Would you like to generate 4K thumbnails for these ${missingThumbs.length} video(s) now?`,
        { def: true },
      );

      if (shouldGenerate) {
        info('Generating thumbnails...');
        const thumbBar = new ProgressBar({ total: missingThumbs.length, label: 'Generating thumbnails...' });
        let genCount = 0;

        const thumbResult = await generateThumbnailsForVideos(missingThumbs, {
          onProgress: ({ created, failed, total, current }) => {
            genCount = created + failed;
            thumbBar.update({
              completed: genCount,
              countText: `${genCount}/${total} thumbnails`,
              label: `Processing ${current}`,
            });
          },
          onNote: (note) => thumbBar.note(note),
        });

        thumbBar.finish();
        ok(`Generated ${thumbResult.created} thumbnail(s) successfully!`);
        if (thumbResult.failed > 0) {
          warn(`${thumbResult.failed} thumbnail(s) failed to generate.`);
        }

        // Re-walk files so newly created thumbnails are included
        const refreshed = await walkFiles(scope.path, { extensions: UPLOADABLE_EXTENSIONS });
        files = refreshed.files;
        videoFiles = files.filter((f) => VIDEO_EXTENSIONS.has(f.ext));
      } else {
        warn('Thumbnails were NOT generated.');
        const proceedWithoutThumbs = await confirm(
          'AuraLoop requires thumbnails for wallpaper cards. Do you want to proceed without thumbnails for those videos?',
          { def: false },
        );
        if (!proceedWithoutThumbs) {
          info('Aborted by user to generate thumbnails first. Please run scripts/generate_thumbnails.mjs or re-run.');
          return;
        }
      }
    }
  } else {
    ok(`All ${videoFiles.length} video(s) have valid thumbnails.`);
  }

  // 6. Interactive Video Compression Check
  if (!args['skip-compress']) {
    section('Video compression check');
    const largeVideos = videoFiles.filter((v) => v.size > 40 * 1024 * 1024);
    if (largeVideos.length > 0) {
      plain(`Found ${largeVideos.length} video(s) larger than 40 MB:`);
      list(largeVideos.slice(0, 8).map((v) => `${v.name} (${formatBytes(v.size)})`));
      if (largeVideos.length > 8) plain(`    ... and ${largeVideos.length - 8} more`);
    } else {
      info(`All videos in scope are under 40 MB.`);
    }

    const wantCompress = args.compress || (await confirm(
      'Do you want to compress/optimize videos before uploading?',
      { def: false },
    ));

    if (wantCompress) {
      const mbRaw = await ask(
        'Enter size threshold in MB (videos larger than this will be compressed)',
        { def: '40' },
      );
      const thresholdBytes = (Number(mbRaw) || 40) * 1024 * 1024;
      const candidates = videoFiles.filter((v) => v.size > thresholdBytes);

      if (candidates.length === 0) {
        info(`No videos found larger than ${mbRaw} MB. Skipping compression.`);
      } else {
        const mode = await choose(`Found ${candidates.length} video(s) > ${mbRaw} MB. Select optimization mode:`, [
          { label: 'Safe Lossless Remux only (preserves exact bitstreams)', value: 'copy' },
          { label: 'Lossless Remux + VideoToolbox hardware re-encode (maximum space savings)', value: 'lossy' },
        ]);

        info(`Starting compression for ${candidates.length} video(s)...`);
        const compressBar = new ProgressBar({ total: candidates.length, label: 'Optimizing videos...' });
        let processedCount = 0;

        const compResult = await compressVideosBatch(candidates, {
          allowLossy: mode === 'lossy',
          onFileStart: (v) => {
            compressBar.update({
              completed: processedCount,
              countText: `${processedCount}/${candidates.length} videos`,
              label: `Optimizing ${v.name} (${formatBytes(v.size)})`,
            });
          },
          onFileFinish: (v, res) => {
            processedCount += 1;
            compressBar.update({
              completed: processedCount,
              countText: `${processedCount}/${candidates.length} videos`,
              label: `Finished ${v.name}`,
            });
          },
          onNote: (note) => compressBar.note(note),
        });

        compressBar.finish();
        ok(`Compression complete: ${compResult.optimizedCount} optimized, ${formatBytes(compResult.totalSaved)} saved!`);

        // Re-walk files to ensure updated sizes are accurate
        const refreshed = await walkFiles(scope.path, { extensions: UPLOADABLE_EXTENSIONS });
        files = refreshed.files;
        videoFiles = files.filter((f) => VIDEO_EXTENSIONS.has(f.ext));
      }
    } else {
      info('Video compression skipped.');
    }
  }

  // 7. Prepare upload items and plan
  const items = files.map((file) => ({
    ...file,
    key: objectKeyFor(file, root, scope.path),
    contentType: MIME_MAP[file.ext] ?? 'application/octet-stream',
  }));

  const state = loadState();
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
    list(overwrites.slice(0, 10).map((i) => `${i.key} (local ${formatBytes(i.size)} vs remote ${formatBytes(remoteSizes?.get(i.key) ?? 0)})`));
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
    ok('All files in scope are already uploaded to Cloudflare R2.');
    // Check if catalog needs sync even if files were already uploaded
    if (!args['no-catalog']) {
      await performCatalogSync({ root, videoFiles });
    }
    return;
  }

  if (args['dry-run']) {
    section('Dry-run preview (no uploads performed)');
    table([['Object key', 'Size'], ...queue.slice(0, 20).map((i) => [i.key, formatBytes(i.size)])]);
    if (queue.length > 20) plain(`    ... and ${queue.length - 20} more`);
    kv('Total that would be uploaded', `${queue.length} files (${formatBytes(queue.reduce((s, i) => s + i.size, 0))})`);
    return;
  }

  // 8. Confirm and perform upload
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

  // 9. Automatic catalog.json sync & R2 upload
  if (!args['no-catalog'] && !args['dry-run'] && failures.length === 0) {
    await performCatalogSync({ root, videoFiles });
  }
}

async function performCatalogSync({ root, videoFiles }) {
  section('Catalog Synchronization (AuraLoop App & Web)');
  info('Scanning wallpaper metadata and synchronizing catalog.json...');

  const videosWithKeys = videoFiles.map((v) => ({
    ...v,
    key: objectKeyFor(v, root, root),
  }));

  try {
    const { addedCount, updatedCount, catalog } = await syncCatalogWithVideos(repoRoot, videosWithKeys, {
      bucket: BUCKET,
      publicBaseUrl: DEFAULT_PUBLIC_BASE_URL,
      onNote: (msg) => info(msg),
    });

    if (addedCount > 0 || updatedCount > 0) {
      ok(`Synced catalog: ${addedCount} new wallpaper(s) added, ${updatedCount} updated.`);
      ok(`Total wallpapers in catalog: ${catalog.wallpapers.length}`);
      ok('Updated catalog.json has been uploaded to Cloudflare R2!');
      info('Your AuraLoop Mac app and Web app will now display the new wallpapers immediately.');
    } else {
      ok(`All ${videoFiles.length} wallpaper(s) are already registered up-to-date in catalog.json.`);
    }
  } catch (err) {
    error(`Catalog synchronization failed: ${err.message}`);
    process.exitCode = 1;
  }
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
