#!/usr/bin/env node

import { parseArgs } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { header, section, info, warn, error, plain, kv, table, list } from './lib/log.mjs';
import { formatBytes, formatDuration, formatPercent } from './lib/format.mjs';
import { ask, confirm, installSignalHandlers, PromptCancelled, closePrompt } from './lib/prompt.mjs';
import { ProgressBar } from './lib/progress.mjs';
import { discoverLibrary } from './lib/library.mjs';
import {
  walkFiles,
  topDirStats,
  thresholdRows,
  VIDEO_EXTENSIONS,
  COMPRESS_THRESHOLDS_MB,
} from './lib/scan.mjs';
import {
  findBinary,
  run,
  probe,
  packetDigest,
  packetDigestForStream,
  streamSignature,
  colorAndRotationInfo,
  buildRemuxArgs,
  buildVideoToolboxArgs,
  pickVideoToolboxBitrate,
  FfmpegProgress,
  progressFraction,
} from './lib/media.mjs';
import { tempSibling, atomicReplace, cleanupPaths, freeBytes } from './lib/fsutil.mjs';

const MIN_SAVINGS_BYTES = 1024 * 1024;

const { values: args } = parseArgs({
  options: {
    dir: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: true,
});

if (args.help) {
  plain('Usage: node scripts/compress_wallpapers.mjs [--dir <library-path>]');
  plain('');
  plain('Recursively scans the wallpaper library, shows a size-threshold report, and');
  plain('optimizes selected videos with safe lossless remuxing first. A clearly labeled');
  plain('VideoToolbox re-encode is only used when explicitly confirmed.');
  process.exit(0);
}

installSignalHandlers();

function printInventory(allFiles, videos) {
  const totalBytes = allFiles.reduce((sum, f) => sum + f.size, 0);
  const videoBytes = videos.reduce((sum, f) => sum + f.size, 0);

  section('Library inventory');
  kv('Total size', `${formatBytes(totalBytes)} in ${allFiles.length} files`);
  kv('Videos', `${videos.length} files, ${formatBytes(videoBytes)}`);

  plain('');
  table([
    ['Folder', 'Videos', 'Folder size'],
    ...topDirStats(allFiles).map((s) => [s.top, String(s.video), formatBytes(s.bytes)]),
  ]);

  plain('');
  plain('  Videos larger than each threshold (cumulative):');
  plain('');
  table([
    ['Threshold', 'Videos', 'Combined size'],
    ...thresholdRows(videos.map((v) => v.size), COMPRESS_THRESHOLDS_MB).map((row) => [
      `> ${row.mb} MB`,
      String(row.count),
      row.count > 0 ? formatBytes(row.total) : '—',
    ]),
  ]);
}

async function selectThreshold(videos) {
  const maxSize = Math.max(...videos.map((v) => v.size));
  const maxMB = (maxSize / 1024 / 1024).toFixed(1);
  for (;;) {
    const raw = await ask(
      'Select a size threshold in MB (videos strictly larger than this will be optimized)',
      { def: '40' },
    );
    if (/^q$/i.test(raw)) throw new PromptCancelled();
    const mb = Number(raw.replace(/,/g, ''));
    if (!Number.isFinite(mb) || mb <= 0) {
      warn('Enter a positive number of megabytes, for example: 40');
      continue;
    }
    const bytes = Math.round(mb * 1024 * 1024);
    const matched = videos.filter((v) => v.size > bytes);
    if (matched.length === 0) {
      warn(`No videos are larger than ${mb} MB. The largest video is ${maxMB} MB. Try a lower value.`);
      continue;
    }
    return { mb, bytes, matched };
  }
}

async function validateOutput({ mode, originalPath, tempPath, originalProbe, duration, signal }) {
  const newProbe = await probe(tempPath, { signal });
  const reasons = [];

  const origVideo = originalProbe.streams.find((s) => s.codec_type === 'video');
  const newVideo = newProbe.streams.find((s) => s.codec_type === 'video');
  if (!newVideo) reasons.push('output has no video stream');

  if (newProbe.streams.length !== originalProbe.streams.length) {
    reasons.push(`stream count changed (${originalProbe.streams.length} -> ${newProbe.streams.length})`);
  } else {
    for (let i = 0; i < originalProbe.streams.length; i += 1) {
      const a = streamSignature(originalProbe.streams[i]);
      const b = streamSignature(newProbe.streams[i]);
      const comparable = mode === 'copy'
        ? a
        : (({ codec_type, codec_name, width, height, pix_fmt }) => ({ codec_type, codec_name, width, height, pix_fmt }))(a);
      const comparableNew = mode === 'copy'
        ? b
        : (({ codec_type, codec_name, width, height, pix_fmt }) => ({ codec_type, codec_name, width, height, pix_fmt }))(b);
      if (JSON.stringify(comparable) !== JSON.stringify(comparableNew)) {
        reasons.push(`stream ${i} characteristics changed`);
      }
    }
  }

  const newDuration = Number(newProbe.format?.duration);
  if (!Number.isFinite(newDuration)) {
    reasons.push('output duration unreadable');
  } else {
    const tolerance = mode === 'copy' ? 0.05 : 0.5;
    if (Math.abs(newDuration - duration) > tolerance) {
      reasons.push(`duration changed (${duration.toFixed(2)}s -> ${newDuration.toFixed(2)}s)`);
    }
  }

  const origColor = colorAndRotationInfo(originalProbe.streams.find((s) => s.codec_type === 'video') ?? {});
  const newColor = colorAndRotationInfo(newVideo ?? {});
  if (mode === 'copy' && JSON.stringify(origColor) !== JSON.stringify(newColor)) {
    reasons.push('rotation or color metadata changed');
  }

  if (mode === 'copy' && reasons.length === 0) {
    const [origDigest, newDigest] = await Promise.all([
      packetDigest(originalPath, { signal }),
      packetDigest(tempPath, { signal }),
    ]);
    if (origDigest.packets !== newDigest.packets || origDigest.digest !== newDigest.digest) {
      reasons.push('packet-level content does not match the original (expected identical for remux)');
    }
  }

  if (mode === 'transcode' && reasons.length === 0) {
    const origAudio = originalProbe.streams.filter((s) => s.codec_type === 'audio');
    const newAudio = newProbe.streams.filter((s) => s.codec_type === 'audio');
    if (origAudio.length === newAudio.length && origAudio.length > 0) {
      for (let i = 0; i < origAudio.length; i += 1) {
        const origIndex = originalProbe.streams.indexOf(origAudio[i]);
        const newIndex = newProbe.streams.indexOf(newAudio[i]);
        const [a, b] = await Promise.all([
          packetDigestForStream(originalPath, origIndex, { signal }),
          packetDigestForStream(tempPath, newIndex, { signal }),
        ]);
        if (a.digest !== b.digest) {
          reasons.push(`audio stream ${i} was modified despite -c:a copy`);
        }
      }
    }
  }

  return { ok: reasons.length === 0, reasons };
}

async function optimizeVideo(item, { ffmpeg, allowLossy, onFfmpeg, signal }) {
  const originalProbe = await probe(item.absPath, { signal });
  const videoStream = originalProbe.streams.find((s) => s.codec_type === 'video');
  if (!videoStream) return { status: 'skipped', reason: 'no video stream' };

  const duration = Number(originalProbe.format?.duration) || 0;
  const strategies = [
    { name: 'lossless remux', mode: 'copy', build: (out) => buildRemuxArgs(item.absPath, out) },
  ];
  if (allowLossy) {
    const bitrate = pickVideoToolboxBitrate(videoStream.width ?? 0);
    strategies.push({
      name: `VideoToolbox re-encode (${bitrate})`,
      mode: 'transcode',
      build: (out) => buildVideoToolboxArgs(item.absPath, out, bitrate),
    });
  }

  const attempts = [];
  for (const strategy of strategies) {
    if (signal.aborted) throw new Error('Aborted.');
    const tempPath = tempSibling(item.absPath, { prefix: '.compress' });
    const parser = new FfmpegProgress((snapshot) => {
      const fraction = progressFraction(snapshot, duration);
      if (fraction !== null && onFfmpeg) onFfmpeg(fraction, strategy.name);
    });
    try {
      await run(ffmpeg, strategy.build(tempPath), {
        signal,
        onStdout: (chunk) => parser.push(chunk.toString()),
      });
    } catch (err) {
      cleanupPaths(tempPath);
      if (signal.aborted) throw err;
      attempts.push(`${strategy.name}: encode failed (${err.message})`);
      continue;
    }

    let tempStat;
    try {
      tempStat = fs.statSync(tempPath);
    } catch {
      attempts.push(`${strategy.name}: produced no output file`);
      continue;
    }

    const savings = item.size - tempStat.size;
    if (savings < MIN_SAVINGS_BYTES) {
      cleanupPaths(tempPath);
      attempts.push(
        `${strategy.name}: no meaningful reduction (would save ${formatBytes(Math.max(savings, 0))})`,
      );
      continue;
    }

    let validation;
    try {
      validation = await validateOutput({
        mode: strategy.mode,
        originalPath: item.absPath,
        tempPath,
        originalProbe,
        duration,
        signal,
      });
    } catch (err) {
      cleanupPaths(tempPath);
      if (signal.aborted) throw err;
      attempts.push(`${strategy.name}: validation error (${err.message})`);
      continue;
    }

    if (!validation.ok) {
      cleanupPaths(tempPath);
      attempts.push(`${strategy.name}: validation failed (${validation.reasons.join('; ')})`);
      continue;
    }

    atomicReplace(item.absPath, tempPath);
    return {
      status: 'optimized',
      strategy: strategy.name,
      newSize: tempStat.size,
      saved: savings,
    };
  }

  return {
    status: 'unchanged',
    reason: attempts.length > 0 ? attempts.join(' | ') : 'no safe optimization applicable',
  };
}

async function main() {
  header('AuraLoop Wallpaper Compressor');

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor < 20) {
    warn(`Node.js ${process.versions.node} detected; version 20 or newer is recommended.`);
  }

  const ffmpeg = findBinary('ffmpeg');
  const ffprobe = findBinary('ffprobe');
  if (!ffmpeg || !ffprobe) {
    error('ffmpeg and ffprobe are required but were not found on PATH.');
    plain('  Install them with: brew install ffmpeg');
    process.exit(1);
  }
  info(`ffmpeg: ${ffmpeg}`);
  info(`ffprobe: ${ffprobe}`);

  const { root } = await discoverLibrary({ overridePath: args.dir });
  const { files, errors } = await walkFiles(root);
  if (errors.length > 0) {
    warn(`${errors.length} locations could not be read (skipped):`);
    list(errors.slice(0, 5).map((e) => `${e.dir}: ${e.error}`));
  }

  const videos = files.filter((f) => VIDEO_EXTENSIONS.has(f.ext));
  if (videos.length === 0) {
    error(`No .mp4 or .mov videos found under ${root}`);
    process.exit(1);
  }

  printInventory(files, videos);

  const { mb: thresholdMB, bytes: thresholdBytes, matched } = await selectThreshold(videos);
  const selected = matched.sort((a, b) => b.size - a.size);
  const totalBytes = selected.reduce((sum, f) => sum + f.size, 0);
  const largest = Math.max(...selected.map((f) => f.size));

  section('Pre-processing summary');
  kv('Threshold', `> ${thresholdMB} MB`);
  kv('Videos selected', `${selected.length} of ${videos.length}`);
  kv('Combined size', formatBytes(totalBytes));
  kv('Largest file', formatBytes(largest));

  const diskFree = await freeBytes(root);
  const tempNeeded = Math.ceil(largest * 1.1) + 50 * 1024 * 1024;
  kv('Temporary space needed', `${formatBytes(tempNeeded)} (one file at a time)`);
  kv('Free disk space', formatBytes(diskFree));
  if (diskFree < tempNeeded) {
    error('Not enough free disk space to process the largest selected video safely.');
    process.exit(1);
  }

  if (!(await confirm('Start optimizing these videos?', { def: false }))) {
    info('Cancelled. No files were modified.');
    return;
  }

  const allowLossy = await confirm(
    'If a video cannot be reduced losslessly, also allow a clearly lossy VideoToolbox H.264 re-encode (audio is copied unchanged)?',
    { def: false },
  );
  if (allowLossy) {
    warn('VideoToolbox re-encode enabled: those videos will be visually lossy.');
  } else {
    info('Lossless-only mode: videos without a safe lossless reduction will be left untouched.');
  }

  const controller = new AbortController();
  let interrupting = false;
  const onInterrupt = () => {
    if (interrupting) process.exit(130);
    interrupting = true;
    warn('Interrupt received; stopping after the current operation and cleaning up...');
    controller.abort();
  };
  process.on('SIGINT', onInterrupt);

  const bar = new ProgressBar({ total: totalBytes, label: 'Starting...' });
  const results = [];
  let processedBytes = 0;
  const sizeAfter = new Map(videos.map((v) => [v.relPath, v.size]));

  const startedAt = Date.now();
  for (const item of selected) {
    if (controller.signal.aborted) break;
    const label = `Optimizing ${item.relPath}`;
    bar.update({
      completed: processedBytes,
      label,
      countText: `${results.length}/${selected.length} files | ${formatBytes(processedBytes)} / ${formatBytes(totalBytes)}`,
    });

    let result;
    try {
      result = await optimizeVideo(item, {
        ffmpeg,
        allowLossy,
        signal: controller.signal,
        onFfmpeg: (fraction) => {
          bar.update({
            completed: processedBytes + fraction * item.size,
            countText: `${results.length}/${selected.length} files | ${formatBytes(processedBytes + fraction * item.size)} / ${formatBytes(totalBytes)}`,
            label,
          });
        },
      });
    } catch (err) {
      if (controller.signal.aborted) break;
      result = { status: 'failed', reason: err.message };
    }

    if (result.status === 'optimized') {
      sizeAfter.set(item.relPath, result.newSize);
    }
    results.push({ relPath: item.relPath, ...result });
    processedBytes += item.size;
    bar.update({
      completed: processedBytes,
      countText: `${results.length}/${selected.length} files | ${formatBytes(processedBytes)} / ${formatBytes(totalBytes)}`,
    });
  }

  process.removeListener('SIGINT', onInterrupt);
  const elapsed = (Date.now() - startedAt) / 1000;
  bar.finish();

  const optimized = results.filter((r) => r.status === 'optimized');
  const unchanged = results.filter((r) => r.status === 'unchanged');
  const failed = results.filter((r) => r.status === 'failed');
  const skipped = results.filter((r) => r.status === 'skipped');
  const savedBytes = optimized.reduce((sum, r) => sum + r.saved, 0);
  const remaining = videos.filter((v) => (sizeAfter.get(v.relPath) ?? v.size) > thresholdBytes);
  const remainingBytes = remaining.reduce((sum, v) => sum + (sizeAfter.get(v.relPath) ?? v.size), 0);

  section('Compression report');
  if (controller.signal.aborted) {
    warn('Run was interrupted; results below cover the files that were processed.');
  }
  kv('Duration', formatDuration(elapsed));
  kv('Threshold', `> ${thresholdMB} MB`);
  kv('Videos considered', `${selected.length} (${formatBytes(totalBytes)})`);
  kv('Optimized', `${optimized.length} files`);
  kv('Space saved', `${formatBytes(savedBytes)}${totalBytes > 0 ? ` (${formatPercent((savedBytes / totalBytes) * 100)})` : ''}`);
  kv('No safe optimization found', `${unchanged.length} files`);
  kv('Skipped', `${skipped.length} files`);
  kv('Failed', `${failed.length} files`);
  kv('Remaining above threshold', `${remaining.length} files (${formatBytes(remainingBytes)})`);

  if (optimized.length > 0) {
    plain('');
    plain('  Optimized files:');
    list(optimized.map((r) => `${r.relPath} -> ${formatBytes(r.newSize)} (saved ${formatBytes(r.saved)}, ${r.strategy})`));
  }
  if (failed.length > 0) {
    plain('');
    error('Failed files:');
    list(failed.map((r) => `${r.relPath} - ${r.reason}`));
  }
  plain('');

  if (failed.length > 0) process.exitCode = 1;
  if (controller.signal.aborted) process.exitCode = 130;
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
