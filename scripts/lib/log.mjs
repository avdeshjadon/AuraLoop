import { padCells } from './format.mjs';

const enabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const codes = {
  bold: [1, 22],
  dim: [2, 22],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  cyan: [36, 39],
};

const ESC = String.fromCharCode(27);

export function paint(name, text) {
  if (!enabled || !codes[name]) return text;
  const [open, close] = codes[name];
  return `${ESC}[${open}m${text}${ESC}[${close}m`;
}

export function header(title) {
  const line = '='.repeat(70);
  process.stdout.write(`\n${line}\n  ${title}\n${line}\n`);
}

export function section(title) {
  process.stdout.write(`\n${paint('bold', title)}\n`);
}

export function info(message) {
  process.stdout.write(`${paint('cyan', '[i]')} ${message}\n`);
}

export function ok(message) {
  process.stdout.write(`${paint('green', '[+]')} ${message}\n`);
}

export function warn(message) {
  process.stdout.write(`${paint('yellow', '[!]')} ${message}\n`);
}

export function error(message) {
  process.stderr.write(`${paint('red', '[x]')} ${message}\n`);
}

export function plain(message = '') {
  process.stdout.write(`${message}\n`);
}

export function kv(label, value) {
  process.stdout.write(`    ${paint('dim', `${label}:`)} ${value}\n`);
}

export function table(rows) {
  if (rows.length === 0) return;
  for (const line of padCells(rows)) {
    process.stdout.write(`    ${line}\n`);
  }
}

export function list(items, bullet = '-') {
  for (const item of items) {
    process.stdout.write(`    ${bullet} ${item}\n`);
  }
}
