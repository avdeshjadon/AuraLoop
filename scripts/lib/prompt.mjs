import readline from 'node:readline/promises';

export class PromptCancelled extends Error {
  constructor(message = 'Cancelled.') {
    super(message);
    this.name = 'PromptCancelled';
  }
}

let sharedRl = null;
let closedByEof = false;
let nonInteractiveNoted = false;
const lineQueue = [];
let pending = null;

function getRl() {
  if (sharedRl) return sharedRl;
  if (!process.stdin.isTTY && !nonInteractiveNoted) {
    process.stdout.write('    (non-interactive session: reading answers from standard input)\n');
    nonInteractiveNoted = true;
  }
  sharedRl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY),
  });
  sharedRl.on('line', (line) => {
    if (pending) {
      const { resolve } = pending;
      pending = null;
      resolve(line);
    } else {
      lineQueue.push(line);
    }
  });
  sharedRl.on('close', () => {
    closedByEof = true;
    if (pending) {
      const { reject } = pending;
      pending = null;
      reject(new PromptCancelled('Input closed before an answer was given.'));
    }
  });
  sharedRl.on('SIGINT', () => {
    sharedRl.close();
  });
  return sharedRl;
}

function questionOnce(query) {
  getRl();
  process.stdout.write(query);
  return new Promise((resolve, reject) => {
    if (lineQueue.length > 0) {
      resolve(lineQueue.shift());
      return;
    }
    if (closedByEof) {
      reject(new PromptCancelled('Input closed before an answer was given.'));
      return;
    }
    pending = { resolve, reject };
  });
}

export async function ask(question, { def } = {}) {
  const suffix = def !== undefined ? ` [${def}]` : '';
  for (;;) {
    const answer = (await questionOnce(`${question}${suffix}: `)).trim();
    if (answer !== '') return answer;
    if (def !== undefined) return def;
  }
}

export async function confirm(question, { def = false } = {}) {
  const hint = def ? 'Y/n' : 'y/N';
  for (;;) {
    const answer = (await questionOnce(`${question} [${hint}]: `)).trim().toLowerCase();
    if (answer === '') return def;
    if (['y', 'yes'].includes(answer)) return true;
    if (['n', 'no'].includes(answer)) return false;
    process.stdout.write('    Please answer "y" or "n".\n');
  }
}

export async function choose(question, options) {
  process.stdout.write(`\n${question}\n`);
  options.forEach((option, index) => {
    process.stdout.write(`    ${index + 1}. ${option.label}\n`);
  });
  for (;;) {
    const answer = (await questionOnce(`Enter a number (1-${options.length})`)).trim();
    const n = Number(answer);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) {
      return options[n - 1].value;
    }
    process.stdout.write(`    Enter a number between 1 and ${options.length}.\n`);
  }
}

export async function askPositiveNumber(question) {
  for (;;) {
    const raw = (await questionOnce(`${question}: `)).trim().replace(/,/g, '');
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    process.stdout.write('    Enter a positive number.\n');
  }
}

export function installSignalHandlers() {
  process.on('SIGINT', () => {
    process.stdout.write('\n');
    process.stderr.write('Cancelled.\n');
    process.exit(130);
  });
}
