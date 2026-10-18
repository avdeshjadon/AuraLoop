export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  const decimals = i === 0 ? 0 : 2;
  return `${value.toFixed(decimals)} ${units[i]}`;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

export function formatPercent(value, decimals = 1) {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

const CONTROL_CHARS = (() => {
  const codes = [];
  for (let c = 0; c < 0x20; c += 1) codes.push(c);
  codes.push(0x7f);
  const pattern = codes.map((c) => `\\u${c.toString(16).padStart(4, '0')}`).join('');
  return new RegExp(`[${pattern}]`, 'g');
})();

export function sanitizeLabel(text, maxWidth = 60) {
  const clean = String(text ?? '')
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= maxWidth) return clean;
  if (maxWidth <= 1) return clean.slice(0, maxWidth);
  return `${clean.slice(0, maxWidth - 1)}…`;
}

export function parseSizeString(text) {
  if (typeof text !== 'string') return null;
  const match = text.replace(/,/g, '').trim().match(/^([\d.]+)\s*([KMGT]?B)$/i);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  return Math.round(value * (units[match[2].toUpperCase()] ?? 1));
}

export function parseCountString(text) {
  if (typeof text === 'number') return text;
  if (typeof text !== 'string') return null;
  const n = Number(text.replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

export function stripAnsi(text) {
  const esc = String.fromCharCode(27);
  return String(text).replace(new RegExp(`${esc}\\[[0-9;]*[A-Za-z]`, 'g'), '');
}

export function padCells(rows) {
  const widths = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i] ?? 0, String(cell).length);
    });
  }
  return rows.map((row) => row.map((cell, i) => String(cell).padEnd(widths[i])).join('  ').trimEnd());
}
