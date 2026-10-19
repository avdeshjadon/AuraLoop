import fs from 'node:fs';
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
} from './media.mjs';
import { tempSibling, atomicReplace, cleanupPaths } from './fsutil.mjs';
import { formatBytes } from './format.mjs';

export const MIN_SAVINGS_BYTES = 1024 * 1024; // 1 MB minimum savings

export async function validateOutput({ mode, originalPath, tempPath, originalProbe, duration, signal }) {
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

export async function optimizeVideo(item, { ffmpeg, allowLossy = false, onFfmpeg, signal } = {}) {
  const originalProbe = await probe(item.absPath, { signal });
  const videoStream = originalProbe.streams?.find((s) => s.codec_type === 'video');
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
    if (signal?.aborted) throw new Error('Aborted.');
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
      if (signal?.aborted) throw err;
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
      if (signal?.aborted) throw err;
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

export async function compressVideosBatch(videos, {
  allowLossy = false,
  signal,
  onFileStart,
  onFileFinish,
  onNote,
} = {}) {
  const ffmpeg = findBinary('ffmpeg');
  if (!ffmpeg) {
    throw new Error('ffmpeg is required for compression but was not found on PATH.');
  }

  let totalSaved = 0;
  let optimizedCount = 0;
  let unchangedCount = 0;

  for (let i = 0; i < videos.length; i += 1) {
    if (signal?.aborted) break;
    const video = videos[i];
    if (onFileStart) onFileStart(video, i, videos.length);

    try {
      const result = await optimizeVideo(video, {
        ffmpeg,
        allowLossy,
        signal,
      });

      if (result.status === 'optimized') {
        optimizedCount += 1;
        totalSaved += result.saved;
        video.size = result.newSize;
        if (onNote) {
          onNote(`  [✓] Optimized ${video.name}: saved ${formatBytes(result.saved)} via ${result.strategy}`);
        }
      } else {
        unchangedCount += 1;
        if (onNote) {
          onNote(`  [-] Skipped ${video.name}: ${result.reason}`);
        }
      }

      if (onFileFinish) onFileFinish(video, result, i, videos.length);
    } catch (err) {
      if (signal?.aborted) throw err;
      if (onNote) onNote(`  [!] Error optimizing ${video.name}: ${err.message}`);
    }
  }

  return { optimizedCount, unchangedCount, totalSaved };
}
