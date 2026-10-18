import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function tempSibling(targetPath, { prefix = '.opt', ext } = {}) {
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath, path.extname(targetPath));
  const suffix = ext ?? path.extname(targetPath);
  const rand = crypto.randomBytes(4).toString('hex');
  return path.join(dir, `${base}${prefix}-${rand}${suffix}`);
}

export function atomicReplace(originalPath, tempPath) {
  const backupPath = `${originalPath}.bak`;
  if (fs.existsSync(backupPath)) fs.rmSync(backupPath, { force: true });
  fs.renameSync(originalPath, backupPath);
  try {
    fs.renameSync(tempPath, originalPath);
  } catch (error) {
    try {
      fs.renameSync(backupPath, originalPath);
    } catch {}
    throw error;
  }
  fs.rmSync(backupPath, { force: true });
}

export function cleanupPaths(...paths) {
  for (const p of paths) {
    try {
      if (p && fs.existsSync(p)) fs.rmSync(p, { force: true });
    } catch {}
  }
}

export async function freeBytes(dirPath) {
  const { stdout } = await execFileAsync('df', ['-Pk', dirPath]);
  const line = stdout.trim().split('\n').at(-1);
  const columns = line.trim().split(/\s+/);
  const availableKb = Number(columns[3]);
  if (!Number.isFinite(availableKb)) throw new Error(`Could not read free space for ${dirPath}`);
  return availableKb * 1024;
}

export async function pathExists(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}
