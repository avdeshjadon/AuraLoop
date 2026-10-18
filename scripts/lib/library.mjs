import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { choose, ask } from './prompt.mjs';
import { warn, info } from './log.mjs';

export const LIBRARY_DIR_NAMES = ['AuraLoop Wallpapers', 'AuraLoop-Wallpapers'];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDir, '..', '..');

function candidateLocations() {
  const home = os.homedir();
  return [
    home,
    path.join(home, 'Downloads'),
    path.join(home, 'Desktop'),
    path.join(home, 'Documents'),
    path.join(home, 'Movies'),
    repoRoot,
    path.dirname(repoRoot),
  ];
}

export function discoverLibraryMatches() {
  const found = new Map();
  for (const dir of candidateLocations()) {
    for (const name of LIBRARY_DIR_NAMES) {
      const full = path.join(dir, name);
      try {
        const stat = fs.statSync(full);
        if (!stat.isDirectory()) continue;
        const real = fs.realpathSync(full);
        if (!found.has(real)) found.set(real, full);
      } catch {}
    }
  }
  return [...found.entries()].map(([real, display]) => ({ real, display }));
}

export async function discoverLibrary({ overridePath } = {}) {
  if (overridePath) {
    const resolved = path.resolve(overridePath);
    let stat;
    try {
      stat = fs.statSync(resolved);
    } catch {
      throw new Error(`Directory not found: ${resolved}`);
    }
    if (!stat.isDirectory()) throw new Error(`Not a directory: ${resolved}`);
    return { root: resolved };
  }

  const matches = discoverLibraryMatches();

  if (matches.length === 0) {
    throw new Error(
      `No wallpaper library directory found. Looked for "${LIBRARY_DIR_NAMES.join('" and "')}" in your home folder, common subfolders, and the project folder. Pass --dir <path> to point at the library.`,
    );
  }

  if (matches.length === 1) {
    const root = matches[0].display;
    info(`Wallpaper library: ${root}`);
    return { root };
  }

  warn(`Multiple wallpaper library directories found (${matches.length}).`);
  const root = await choose('Which wallpaper library should be used?', matches.map((m) => ({
    label: m.display,
    value: m.display,
  })));
  return { root };
}

export function listSubdirs(root) {
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export async function pickLibraryScope(root, { promptLabel = 'Which files would you like to process?' } = {}) {
  const subdirs = listSubdirs(root);
  const scope = await choose(promptLabel, [
    { label: 'All wallpaper folders', value: { type: 'all' } },
    { label: 'A specific subfolder', value: { type: 'sub' } },
    { label: 'A custom directory path', value: { type: 'custom' } },
  ]);

  if (scope.type === 'all') return { type: 'all', path: root, label: root };

  if (scope.type === 'sub') {
    if (subdirs.length === 0) {
      throw new Error(`No subfolders found under ${root}`);
    }
    const picked = await choose('Select a subfolder:', subdirs.map((name) => ({
      label: name,
      value: name,
    })));
    const full = path.join(root, picked);
    assertDirectory(full);
    return { type: 'sub', path: full, label: full };
  }

  const raw = await ask('Enter the directory path to process');
  const full = path.resolve(raw.replace(/^~(?=\/|$)/, os.homedir()));
  assertDirectory(full);
  return { type: 'custom', path: full, label: full };
}

export function assertDirectory(dirPath) {
  let stat;
  try {
    stat = fs.statSync(dirPath);
  } catch {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  if (!stat.isDirectory()) throw new Error(`Not a directory: ${dirPath}`);
  return dirPath;
}
