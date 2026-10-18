import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawnSync } from 'node:child_process';
import { parseCountString, parseSizeString, stripAnsi } from './format.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const repoRoot = path.resolve(__dirname, '..', '..');

export function loadEnvFiles() {
  const envPaths = [
    path.join(repoRoot, '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      if (typeof process.loadEnvFile === 'function') {
        try { process.loadEnvFile(p); } catch {}
      }
      try {
        const content = fs.readFileSync(p, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eq = trimmed.indexOf('=');
          if (eq > 0) {
            const k = trimmed.slice(0, eq).trim();
            let v = trimmed.slice(eq + 1).trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.slice(1, -1);
            }
            if (!process.env[k]) process.env[k] = v;
          }
        }
      } catch {}
    }
  }
}
loadEnvFiles();

export const DEFAULT_BUCKET = process.env.AURALOOP_R2_BUCKET || 'auraloop-wallpapers';
const WRANGLER_CONFIG = path.join(os.homedir(), 'Library/Preferences/.wrangler/config/default.toml');

export class R2RestError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'R2RestError';
    this.status = status;
    this.body = body;
  }
}

export function findWrangler() {
  if (process.env.WRANGLER_BIN && fs.existsSync(process.env.WRANGLER_BIN)) {
    return process.env.WRANGLER_BIN;
  }
  const which = spawnSync('which', ['wrangler']);
  if (which.status === 0) {
    const found = which.stdout.toString().trim();
    if (found && fs.existsSync(found)) return found;
  }
  for (const candidate of ['/usr/local/bin/wrangler', '/opt/homebrew/bin/wrangler']) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export async function wrangler(args, { timeoutMs = 300000, signal } = {}) {
  const bin = findWrangler();
  if (!bin) throw new Error('wrangler CLI not found. Install it with: npm install -g wrangler');
  return new Promise((resolve, reject) => {
    const child = execFile(bin, args, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: timeoutMs,
      env: {
        ...process.env,
        ...(process.env.CLOUDFLARE_ACCOUNT_ID ? { CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID } : {}),
        ...(process.env.CLOUDFLARE_API_TOKEN ? { CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN } : {}),
      },
    }, (error, stdout, stderr) => {
      if (error) {
        const tail = stripAnsi(String(stderr || error.message || '')).split('\n').filter(Boolean).slice(-4).join(' | ');
        reject(new Error(`wrangler ${args.join(' ')} failed: ${tail}`));
        return;
      }
      resolve({ stdout, stderr });
    });
    if (signal) {
      signal.addEventListener('abort', () => child.kill('SIGTERM'), { once: true });
    }
  });
}

export async function whoami() {
  const { stdout } = await wrangler(['whoami', '--json'], { timeoutMs: 60000 });
  return JSON.parse(stdout);
}

export async function restAccountId() {
  if (process.env.CLOUDFLARE_ACCOUNT_ID) return process.env.CLOUDFLARE_ACCOUNT_ID;
  const info = await whoami();
  const id = info.accounts?.[0]?.id;
  if (!id) throw new Error('No Cloudflare account found for the current wrangler login.');
  process.env.CLOUDFLARE_ACCOUNT_ID = id;
  return id;
}

export async function bucketInfo(bucket) {
  const { stdout } = await wrangler(['r2', 'bucket', 'info', bucket, '--json'], { timeoutMs: 60000 });
  const parsed = JSON.parse(stdout);
  return {
    name: parsed.name ?? bucket,
    objectCount: parseCountString(parsed.object_count),
    bucketSize: parseSizeString(parsed.bucket_size),
    created: parsed.created ?? parsed.creation_date ?? null,
    location: parsed.location ?? null,
    raw: parsed,
  };
}

function readWranglerConfig() {
  try {
    return fs.readFileSync(WRANGLER_CONFIG, 'utf8');
  } catch {
    return null;
  }
}

function parseOAuthToken(configText) {
  const token = configText?.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1] ?? null;
  const expiresAt = configText?.match(/expiration_time\s*=\s*"([^"]+)"/)?.[1] ?? null;
  return { token, expiresAt };
}

export async function getApiToken({ refreshIfExpired = true } = {}) {
  const envToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
  if (envToken) {
    return { token: envToken, source: 'CLOUDFLARE_API_TOKEN' };
  }

  let { token, expiresAt } = parseOAuthToken(readWranglerConfig());
  if (!token) return null;

  const expired = expiresAt ? Date.parse(expiresAt) <= Date.now() + 60_000 : false;
  if (expired && refreshIfExpired) {
    try {
      await whoami();
      ({ token, expiresAt } = parseOAuthToken(readWranglerConfig()));
    } catch {}
  }
  if (!token) return null;
  return { token, source: 'wrangler OAuth' };
}

export class R2RestClient {
  constructor({ token, accountId, baseUrl = process.env.CLOUDFLARE_API_BASE || 'https://api.cloudflare.com/client/v4' }) {
    this.token = token;
    this.accountId = accountId;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async request(url, { method = 'GET', body } = {}) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let parsed = null;
    try {
      parsed = await res.json();
    } catch {}
    return { status: res.status, body: parsed };
  }

  async *iterateObjects(bucket, { prefix, delimiter, perPage = 1000 } = {}) {
    let cursor = null;
    let pages = 0;
    do {
      const url = new URL(`${this.baseUrl}/accounts/${this.accountId}/r2/buckets/${bucket}/objects`);
      url.searchParams.set('per_page', String(perPage));
      if (prefix) url.searchParams.set('prefix', prefix);
      if (delimiter) url.searchParams.set('delimiter', delimiter);
      if (cursor) url.searchParams.set('cursor', cursor);
      const { status, body } = await this.request(url);
      if (status !== 200 || !body?.success) {
        const detail = body?.errors?.map((e) => e.message).join('; ') ?? `HTTP ${status}`;
        throw new R2RestError(`Failed to list objects: ${detail}`, { status, body });
      }
      pages += 1;
      for (const object of body.result ?? []) {
        yield { ...object, page: pages };
      }
      const info = body.result_info ?? {};
      cursor = info.is_truncated ? info.cursor : null;
      if (info.is_truncated && !cursor) {
        throw new R2RestError('Listing was truncated but no cursor was returned.', { status, body });
      }
    } while (cursor);
  }

  async listObjects(bucket, options = {}) {
    const objects = [];
    for await (const object of this.iterateObjects(bucket, options)) {
      objects.push(object);
    }
    return objects;
  }

  async deleteObject(bucket, key) {
    const url = `${this.baseUrl}/accounts/${this.accountId}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
    const { status, body } = await this.request(url, { method: 'DELETE' });
    if (status === 200 && body?.success) return { deleted: true };
    const code = body?.errors?.[0]?.code;
    if (status === 200 && code === 10007) return { deleted: false, missing: true };
    const detail = body?.errors?.map((e) => e.message).join('; ') ?? `HTTP ${status}`;
    throw new R2RestError(`Failed to delete "${key}": ${detail}`, { status, body });
  }
}

export async function createRestClient({ refreshIfExpired = true } = {}) {
  const auth = await getApiToken({ refreshIfExpired });
  if (!auth) return null;
  try {
    const accountId = await restAccountId();
    return new R2RestClient({ token: auth.token, accountId });
  } catch {
    return null;
  }
}

export async function wranglerPut(bucket, { key, filePath, contentType, cacheControl, signal }) {
  await wrangler([
    'r2', 'object', 'put',
    `${bucket}/${key}`,
    '--file', filePath,
    '--remote',
    '--content-type', contentType,
    '--cache-control', cacheControl,
  ], { signal });
}

export async function wranglerDelete(bucket, key, { signal } = {}) {
  await wrangler(['r2', 'object', 'delete', `${bucket}/${key}`, '--remote'], { signal });
}
