#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { header, section, info, ok, warn, error, plain, kv, table, list } from './lib/log.mjs';
import { formatBytes, formatDuration } from './lib/format.mjs';
import { choose, ask, confirm, installSignalHandlers, PromptCancelled } from './lib/prompt.mjs';
import { ProgressBar } from './lib/progress.mjs';
import { mapPool, withRetry } from './lib/async.mjs';
import {
  DEFAULT_BUCKET,
  findWrangler,
  createRestClient,
  bucketInfo,
  wranglerDelete,
} from './lib/r2.mjs';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const { values: args } = parseArgs({
  options: {
    bucket: { type: 'string' },
    'dry-run': { type: 'boolean' },
    'state-delete': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: true,
});

if (args.help) {
  plain('Usage: node scripts/manage_r2_bucket.mjs [--bucket <name>] [--dry-run] [--state-delete]');
  plain('');
  plain('Inspects and manages the AuraLoop Cloudflare R2 bucket. Supports listing objects');
  plain('(paginated), inspecting prefixes, deleting under a prefix, emptying the bucket,');
  plain('and the legacy "delete keys from local upload state" cleanup.');
  plain('');
  plain('REST access uses CLOUDFLARE_API_TOKEN if set, otherwise the wrangler OAuth token.');
  process.exit(0);
}

installSignalHandlers();

const BUCKET = args.bucket ?? DEFAULT_BUCKET;
const STATE_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), 'upload_progress.json');
const DELETE_CONCURRENCY = 10;

function normalizePrefix(raw) {
  const trimmed = raw.trim().replace(/^\/+/, '');
  if (trimmed === '') return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

async function inspection(rest, wranglerBin) {
  section('Bucket inspection');
  kv('Bucket', BUCKET);
  kv('Account', rest?.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? 'unavailable');
  kv('Endpoint', 'api.cloudflare.com (R2 REST API)');
  kv('wrangler', wranglerBin ?? 'not found');
  kv('REST credentials', rest ? 'available' : 'unavailable');
  if (args['dry-run']) {
    warn('Dry-run mode: deletions will be previewed, not executed.');
  }

  plain('');
  let provider = null;
  if (wranglerBin) {
    try {
      provider = await bucketInfo(BUCKET);
      kv('Provider object count', provider.objectCount ?? 'unavailable');
      kv('Provider bucket size', provider.bucketSize != null ? formatBytes(provider.bucketSize) : 'unavailable');
      kv('Location', provider.location ?? 'unavailable');
      kv('Created', provider.created ?? 'unavailable');
    } catch (err) {
      warn(`Provider metrics unavailable: ${err.message}`);
    }
  } else {
    warn('Provider metrics unavailable: wrangler CLI not found.');
  }

  let inventory = null;
  if (rest) {
    try {
      info('Listing objects (paginated)...');
      const startedAt = Date.now();
      const objects = await rest.listObjects(BUCKET, { perPage: 1000 });
      const logicalBytes = objects.reduce((sum, o) => sum + (o.size ?? 0), 0);
      inventory = { count: objects.length, bytes: logicalBytes, ms: Date.now() - startedAt };
      kv('Listed objects', `${inventory.count} (logical total ${formatBytes(inventory.bytes)})`);
      kv('Listing time', formatDuration(inventory.ms / 1000));
      if (provider?.objectCount != null && provider.objectCount !== inventory.count) {
        info('Note: provider-reported count can include internal storage entries; the listed count is the logical object count.');
      }
    } catch (err) {
      warn(`Object inventory unavailable: ${err.message}`);
    }
  } else {
    warn('Object inventory unavailable: no REST credentials (set CLOUDFLARE_API_TOKEN or log in with wrangler).');
  }

  return { provider, inventory };
}

function requireRest(rest) {
  if (!rest) {
    error('This action needs REST API access. Set CLOUDFLARE_API_TOKEN or run: wrangler login');
    return false;
  }
  return true;
}

async function deleteKeys(rest, keys, { label = 'objects' } = {}) {
  if (args['dry-run']) {
    warn(`Dry run: would delete ${keys.length} ${label}. No objects were deleted.`);
    return { deleted: 0, failed: 0, failures: [] };
  }

  const bar = new ProgressBar({ total: keys.length, label: 'Deleting...' });
  const startedAt = Date.now();
  let deleted = 0;
  const failures = [];
  const { errors } = await mapPool([...keys], DELETE_CONCURRENCY, async (key) => {
    await withRetry(async () => {
      const result = await rest.deleteObject(BUCKET, key);
      if (result.missing) {
        failures.push({ key, reason: 'already missing' });
        return;
      }
      deleted += 1;
    }, {
      retries: 3,
      baseDelayMs: 1000,
      onRetry: (err) => {
        if (process.env.AURALOOP_DEBUG) warn(`Retry after: ${err.message}`);
      },
    });
    bar.update({
      completed: Math.min(deleted + failures.length, keys.length),
      countText: `${deleted}/${keys.length} deleted`,
    });
  });
  for (const { item, error: err } of errors) {
    failures.push({ key: item, reason: err.message });
  }
  bar.finish();
  return { deleted, failed: failures.filter((f) => f.reason !== 'already missing').length, failures, ms: Date.now() - startedAt };
}

async function listObjectsFlow(rest) {
  if (!requireRest(rest)) return;
  const rawPrefix = await ask('Filter by prefix (leave empty for the whole bucket)', { def: '' });
  const prefix = normalizePrefix(rawPrefix) || undefined;
  info('Listing (up to 1000 objects shown)...');
  const objects = await rest.listObjects(BUCKET, { prefix, perPage: 1000 });
  const totalBytes = objects.reduce((sum, o) => sum + (o.size ?? 0), 0);
  section(`Objects${prefix ? ` under "${prefix}"` : ''}`);
  kv('Count', String(objects.length));
  kv('Total size', formatBytes(totalBytes));
  plain('');
  table([
    ['Size', 'Key', 'Modified'],
    ...objects.slice(0, 50).map((o) => [formatBytes(o.size ?? 0), o.key, o.last_modified ?? '—']),
  ]);
  if (objects.length > 50) plain(`    ... and ${objects.length - 50} more (use prefix inspection to narrow down)`);
  plain('');
}

async function inspectPrefixFlow(rest) {
  if (!requireRest(rest)) return;
  const rawPrefix = await ask('Prefix to inspect (e.g. "Abstract/" or "Premium/Furina/")');
  const prefix = normalizePrefix(rawPrefix);
  if (!prefix) {
    warn('Enter a non-empty prefix.');
    return;
  }
  info('Listing...');
  const objects = await rest.listObjects(BUCKET, { prefix, perPage: 1000 });
  if (objects.length === 0) {
    warn(`No objects found under "${prefix}".`);
    return;
  }
  const groups = new Map();
  let totalBytes = 0;
  for (const object of objects) {
    totalBytes += object.size ?? 0;
    const restOfKey = object.key.slice(prefix.length);
    const slash = restOfKey.indexOf('/');
    const child = slash === -1 ? restOfKey : `${restOfKey.slice(0, slash + 1)}`;
    let group = groups.get(child);
    if (!group) {
      group = { child, count: 0, bytes: 0 };
      groups.set(child, group);
    }
    group.count += 1;
    group.bytes += object.size ?? 0;
  }
  section(`Prefix "${prefix}"`);
  kv('Objects', String(objects.length));
  kv('Total size', formatBytes(totalBytes));
  plain('');
  table([
    ['Entry', 'Objects', 'Size'],
    ...[...groups.values()]
      .sort((a, b) => b.bytes - a.bytes)
      .map((g) => [g.child, String(g.count), formatBytes(g.bytes)]),
  ]);
  plain('');
}

async function deletePrefixFlow(rest) {
  if (!requireRest(rest)) return;
  const rawPrefix = await ask('Prefix to delete (e.g. "Abstract/" — every object under it will be deleted)');
  const prefix = normalizePrefix(rawPrefix);
  if (!prefix) {
    warn('Enter a non-empty prefix. To empty the whole bucket use the dedicated menu option.');
    return;
  }
  info('Listing matching objects...');
  const objects = await rest.listObjects(BUCKET, { prefix, perPage: 1000 });
  if (objects.length === 0) {
    warn(`No objects found under "${prefix}". Nothing to delete.`);
    return;
  }
  const totalBytes = objects.reduce((sum, o) => sum + (o.size ?? 0), 0);
  section('Deletion preview');
  kv('Prefix', prefix);
  kv('Objects to delete', String(objects.length));
  kv('Total size', formatBytes(totalBytes));
  plain('');
  list(objects.slice(0, 10).map((o) => `${o.key} (${formatBytes(o.size ?? 0)})`));
  if (objects.length > 10) plain(`    ... and ${objects.length - 10} more`);
  plain('');

  if (!(await confirm(`Permanently delete ${objects.length} objects (${formatBytes(totalBytes)}) under "${prefix}"?`, { def: false }))) {
    info('Cancelled. Nothing was deleted.');
    return;
  }

  const result = await deleteKeys(rest, objects.map((o) => o.key));
  section('Deletion result');
  kv('Deleted', String(result.deleted));
  kv('Failed', String(result.failed));
  kv('Duration', formatDuration((result.ms ?? 0) / 1000));
  if (result.failures.length > 0) {
    plain('');
    error('Failed deletions:');
    list(result.failures.slice(0, 20).map((f) => `${f.key} - ${f.reason}`));
  }
  plain('');
}

async function emptyBucketFlow(rest) {
  if (!requireRest(rest)) return;
  info('Listing all objects...');
  const objects = await rest.listObjects(BUCKET, { perPage: 1000 });
  if (objects.length === 0) {
    ok('Bucket is already empty.');
    return;
  }
  const totalBytes = objects.reduce((sum, o) => sum + (o.size ?? 0), 0);
  section('Empty bucket confirmation');
  kv('Bucket', BUCKET);
  kv('Objects to delete', String(objects.length));
  kv('Total size', formatBytes(totalBytes));
  plain('');

  if (!(await confirm(`Permanently delete ALL ${objects.length} objects (${formatBytes(totalBytes)}) from "${BUCKET}"?`, { def: false }))) {
    info('Cancelled. Nothing was deleted.');
    return;
  }
  const typed = await ask(`Type the bucket name "${BUCKET}" to confirm permanent deletion`);
  if (typed !== BUCKET) {
    warn('Bucket name did not match. Nothing was deleted.');
    return;
  }

  const result = await deleteKeys(rest, objects.map((o) => o.key), { label: 'objects (entire bucket)' });
  section('Deletion result');
  kv('Deleted', String(result.deleted));
  kv('Failed', String(result.failed));
  kv('Duration', formatDuration((result.ms ?? 0) / 1000));
  plain('');
}

async function stateDeleteFlow({ wranglerBin }) {
  section('Legacy cleanup: delete keys from local upload state');
  if (!fs.existsSync(STATE_FILE)) {
    info('No upload_progress.json found. Nothing to delete.');
    return;
  }
  if (!wranglerBin) {
    error('wrangler CLI not found; cannot delete objects by key.');
    return;
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  const keys = Object.keys(state).filter((k) => state[k].status === 'completed');
  if (keys.length === 0) {
    ok('Upload state is already empty.');
    return;
  }

  kv('Bucket', BUCKET);
  kv('Objects recorded as uploaded', String(keys.length));
  if (!(await confirm(`Delete these ${keys.length} objects from R2 and reset the state file?`, { def: false }))) {
    info('Cancelled. Nothing was deleted.');
    return;
  }

  if (args['dry-run']) {
    warn(`Dry run: would delete ${keys.length} objects. No objects were deleted.`);
    return;
  }

  const bar = new ProgressBar({ total: keys.length, label: 'Deleting...' });
  const startedAt = Date.now();
  let deleted = 0;
  let failed = 0;
  const queue = [...keys];

  const { errors } = await mapPool(queue, DELETE_CONCURRENCY, async (relPath) => {
    await withRetry(async () => {
      await wranglerDelete(BUCKET, relPath);
      delete state[relPath];
      deleted += 1;
      if (deleted % 25 === 0 || deleted + failed === keys.length) {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
      }
    }, {
      retries: 3,
      baseDelayMs: 2000,
      onRetry: (err) => warn(`Retry for ${relPath}: ${err.message.split('\n')[0]}`),
    });
    bar.update({
      completed: Math.min(deleted + failed, keys.length),
      countText: `${deleted}/${keys.length} deleted`,
    });
  });

  failed = errors.length;
  bar.finish();
  fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2), 'utf-8');

  section('Legacy cleanup result');
  kv('Deleted', `${deleted} objects`);
  kv('Failed', `${failed} objects`);
  kv('Duration', formatDuration((Date.now() - startedAt) / 1000));
  kv('State file', 'reset (upload_progress.json)');
  if (errors.length > 0) {
    plain('');
    error('Failed deletions:');
    list(errors.slice(0, 20).map((e) => `${e.item} - ${e.error.message.split('\n')[0]}`));
  }
  plain('');
}

async function main() {
  header('AuraLoop Cloudflare R2 Bucket Manager');

  const wranglerBin = findWrangler();
  const rest = await createRestClient();
  const inspectionResult = await inspection(rest, wranglerBin);

  if (args['state-delete'] || process.env.AURALOOP_STATE_DELETE === '1') {
    await stateDeleteFlow({ wranglerBin });
    return;
  }

  for (;;) {
    const action = await choose('What would you like to do?', [
      { label: 'List objects', value: 'list' },
      { label: 'Inspect a specific prefix or folder', value: 'inspect' },
      { label: 'Delete objects under a selected prefix', value: 'delete-prefix' },
      { label: 'Empty the entire bucket', value: 'empty' },
      {
        label: `Delete objects recorded in local upload state${fs.existsSync(STATE_FILE) ? '' : ' (no state file found)'}`,
        value: 'state-delete',
      },
      { label: 'Exit without changes', value: 'exit' },
    ]);

    if (action === 'exit') {
      info('Exiting. No changes were made.');
      return;
    }
    if (action === 'list') await listObjectsFlow(rest);
    else if (action === 'inspect') await inspectPrefixFlow(rest);
    else if (action === 'delete-prefix') await deletePrefixFlow(rest);
    else if (action === 'empty') await emptyBucketFlow(rest);
    else if (action === 'state-delete') await stateDeleteFlow({ wranglerBin });

    if (!inspectionResult.provider && !rest) {
      warn('REST credentials remain unavailable; listing and prefix actions will keep failing until wrangler login or CLOUDFLARE_API_TOKEN is configured.');
    }
  }
}

main().catch((err) => {
  if (err instanceof PromptCancelled) {
    process.stdout.write('\n');
    info(err.message);
    process.exit(130);
  }
  error(err.message);
  process.exit(1);
});
