import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const BUCKET = 'auraloop-wallpapers';
const STATE_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), 'upload_progress.json');
const CONCURRENCY = 10;

async function main() {
  console.log('\n==========================================================');
  console.log('       AuraLoop Cloudflare R2 Bucket Cleaner              ');
  console.log('==========================================================\n');

  if (!fs.existsSync(STATE_FILE)) {
    console.log('No upload_progress.json found. Nothing to delete.');
    return;
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  const keys = Object.keys(state).filter(k => state[k].status === 'completed');

  console.log(`Found ${keys.length} uploaded objects to delete from R2 bucket "${BUCKET}".\n`);

  if (keys.length === 0) {
    console.log('Bucket state is already empty!');
    return;
  }

  let deleted = 0;
  let failed = 0;
  const queue = [...keys];
  const startTime = Date.now();

  async function worker() {
    while (queue.length > 0) {
      const relPath = queue.shift();
      if (!relPath) break;

      const r2Key = `${BUCKET}/${relPath}`;
      try {
        await execFileAsync('/usr/local/bin/wrangler', ['r2', 'object', 'delete', r2Key, '--remote']);
        deleted++;
        delete state[relPath];
        if (deleted % 25 === 0 || queue.length === 0) {
          fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
          console.log(`🗑️ Deleted [${deleted}/${keys.length}] objects...`);
        }
      } catch (err) {
        failed++;
        console.error(`❌ Error deleting ${relPath}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  // Clear state file completely
  fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2), 'utf-8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n==========================================================');
  console.log(`✅ Finished deleting ${deleted} objects in ${duration}s (Failed: ${failed})`);
  console.log('🧹 upload_progress.json has been reset.');
  console.log('==========================================================\n');
}

main();
