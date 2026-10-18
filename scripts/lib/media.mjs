import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { stripAnsi } from './format.mjs';

const COMMON_BIN_DIRS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin'];

export function findBinary(name) {
  const candidates = [];
  const which = spawnSync('which', [name]);
  if (which.status === 0) {
    const found = which.stdout.toString().trim();
    if (found) candidates.push(found);
  }
  for (const dir of COMMON_BIN_DIRS) candidates.push(path.join(dir, name));
  return candidates.find((p) => {
    try {
      return fs.statSync(p).isFile();
    } catch {
      return false;
    }
  }) ?? null;
}

export function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const cap = opts.maxBuffer ?? 8 * 1024 * 1024;

    child.stdout.on('data', (chunk) => {
      if (opts.onStdout) opts.onStdout(chunk);
      if (!opts.discardStdout && stdout.length < cap) stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      if (stderr.length < cap) stderr += chunk;
      if (opts.onStderr) opts.onStderr(chunk);
    });

    const onAbort = () => {
      child.kill('SIGTERM');
    };
    if (opts.signal) {
      if (opts.signal.aborted) child.kill('SIGTERM');
      else opts.signal.addEventListener('abort', onAbort, { once: true });
    }

    let timer = null;
    if (opts.timeoutMs) {
      timer = setTimeout(() => child.kill('SIGKILL'), opts.timeoutMs);
    }

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (opts.signal) opts.signal.removeEventListener('abort', onAbort);
    };

    child.on('error', (error) => {
      cleanup();
      reject(error);
    });
    child.on('close', (code) => {
      cleanup();
      if (code === 0 || opts.allowFail) {
        resolve({ code, stdout, stderr });
        return;
      }
      const tail = stripAnsi(stderr).split('\n').filter(Boolean).slice(-4).join(' | ');
      const error = new Error(`${path.basename(cmd)} exited with code ${code}${tail ? `: ${tail}` : ''}`);
      error.code = code;
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

export async function probe(filePath, { signal } = {}) {
  const ffprobe = findBinary('ffprobe');
  if (!ffprobe) throw new Error('ffprobe not found');
  const { stdout } = await run(ffprobe, [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    filePath,
  ], { signal });
  return JSON.parse(stdout);
}

export async function packetDigest(filePath, { signal } = {}) {
  return packetDigestInternal(filePath, { signal });
}

export async function packetDigestForStream(filePath, streamIndex, { signal } = {}) {
  return packetDigestInternal(filePath, { signal, streamIndex });
}

async function packetDigestInternal(filePath, { signal, streamIndex } = {}) {
  const ffprobe = findBinary('ffprobe');
  if (!ffprobe) throw new Error('ffprobe not found');
  const hash = crypto.createHash('sha256');
  let pending = '';
  let packets = 0;
  const filter = streamIndex === undefined ? null : `${streamIndex}|`;
  await run(ffprobe, [
    '-v', 'error',
    '-show_packets',
    '-show_data_hash', 'SHA256',
    '-show_entries', 'packet=stream_index,data_hash',
    '-of', 'compact=p=0:nk=1',
    filePath,
  ], {
    signal,
    discardStdout: true,
    maxBuffer: 0,
    onStdout: (chunk) => {
      pending += chunk;
      let idx;
      while ((idx = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, idx);
        pending = pending.slice(idx + 1);
        if (line.trim() === '') continue;
        if (filter !== null && !line.startsWith(filter)) continue;
        packets += 1;
        hash.update(line);
        hash.update('\n');
      }
    },
  });
  if (pending.trim() !== '' && (filter === null || pending.startsWith(filter))) {
    packets += 1;
    hash.update(pending);
  }
  return { packets, digest: hash.digest('hex') };
}

export function streamSignature(stream) {
  return {
    codec_type: stream.codec_type,
    codec_name: stream.codec_name,
    profile: stream.profile ?? null,
    width: stream.width ?? null,
    height: stream.height ?? null,
    pix_fmt: stream.pix_fmt ?? null,
    sample_rate: stream.sample_rate ?? null,
    channels: stream.channels ?? null,
    channel_layout: stream.channel_layout ?? null,
  };
}

export function colorAndRotationInfo(stream) {
  const rotation = (stream.side_data_list ?? []).find((sd) => sd.rotation !== undefined)?.rotation
    ?? stream.tags?.rotate
    ?? null;
  return {
    rotation,
    color_space: stream.color_space ?? null,
    color_transfer: stream.color_transfer ?? null,
    color_primaries: stream.color_primaries ?? null,
    chroma_location: stream.chroma_location ?? null,
  };
}

export function pickVideoToolboxBitrate(width) {
  if (width >= 3840) return '20M';
  if (width >= 2560) return '14M';
  if (width >= 1920) return '10M';
  return '8M';
}

export function buildRemuxArgs(input, output) {
  return [
    '-v', 'error',
    '-y',
    '-i', input,
    '-map', '0',
    '-c', 'copy',
    '-map_metadata', '0',
    '-movflags', '+faststart',
    '-progress', 'pipe:1',
    output,
  ];
}

export function buildVideoToolboxArgs(input, output, bitrate) {
  return [
    '-v', 'error',
    '-y',
    '-i', input,
    '-c:v', 'h264_videotoolbox',
    '-b:v', bitrate,
    '-pix_fmt', 'yuv420p',
    '-c:a', 'copy',
    '-map_metadata', '0',
    '-progress', 'pipe:1',
    output,
  ];
}

export class FfmpegProgress {
  constructor(onSnapshot) {
    this.onSnapshot = onSnapshot;
    this.buffer = '';
    this.map = {};
  }

  push(chunk) {
    this.buffer += chunk;
    let idx;
    while ((idx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      this.map[key] = value;
      if (key === 'progress' && this.onSnapshot) {
        this.onSnapshot({ ...this.map });
      }
    }
  }
}

export function progressFraction(snapshot, durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return null;
  let outSeconds = null;
  const us = Number(snapshot.out_time_us);
  if (Number.isFinite(us) && us >= 0) outSeconds = us / 1e6;
  if (outSeconds === null) {
    const text = snapshot.out_time;
    if (text && text !== 'N/A') {
      const parts = text.split(':').map(Number);
      if (parts.length === 3 && parts.every(Number.isFinite)) {
        outSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }
  }
  if (outSeconds === null) return null;
  return Math.min(Math.max(outSeconds / durationSeconds, 0), 1);
}
