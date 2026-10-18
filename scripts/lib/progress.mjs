import { formatDuration, sanitizeLabel, stripAnsi } from './format.mjs';

const ESC = String.fromCharCode(27);
const CLEAR_LINE = `${ESC}[2K`;

export class ProgressBar {
  constructor({
    total,
    label = '',
    stream = process.stdout,
    width = 24,
    minRedrawMs = 120,
    nonTtyIntervalMs = 5000,
  } = {}) {
    this.total = Math.max(total, 1);
    this.label = label;
    this.stream = stream;
    this.width = width;
    this.minRedrawMs = minRedrawMs;
    this.nonTtyIntervalMs = nonTtyIntervalMs;
    this.completed = 0;
    this.countText = null;
    this.startedAt = Date.now();
    this.lastRender = 0;
    this.lastNonTty = 0;
    this.finished = false;
    this.isTty = Boolean(stream.isTTY);
    this.hasDrawn = false;
  }

  update({ completed, label, countText } = {}) {
    if (completed !== undefined) this.completed = Math.min(Math.max(completed, 0), this.total);
    if (label !== undefined) this.label = label;
    if (countText !== undefined) this.countText = countText;
    if (this.finished) return;
    const now = Date.now();
    if (this.isTty) {
      if (now - this.lastRender < this.minRedrawMs && this.completed < this.total) return;
      this.render();
      this.lastRender = now;
    } else {
      if (now - this.lastNonTty < this.nonTtyIntervalMs && this.completed < this.total) return;
      this.render();
      this.lastNonTty = now;
    }
  }

  etaSeconds() {
    if (this.completed <= 0) return null;
    const elapsed = (Date.now() - this.startedAt) / 1000;
    if (elapsed < 1) return null;
    const rate = this.completed / elapsed;
    if (rate <= 0) return null;
    return (this.total - this.completed) / rate;
  }

  line() {
    const ratio = Math.min(Math.max(this.completed / this.total, 0), 1);
    const filled = Math.round(ratio * this.width);
    const bar = `${'#'.repeat(filled)}${'-'.repeat(this.width - filled)}`;
    const pct = (ratio * 100).toFixed(0).padStart(3);
    const cols = (this.stream && this.stream.columns) || 80;

    let text;
    if (this.countText) {
      text = `[${bar}] ${pct}% | ${this.countText}`;
    } else {
      const eta = this.etaSeconds();
      const etaText = eta === null ? 'ETA Calculating...' : `ETA ${formatDuration(eta)}`;
      text = `[${bar}] ${pct}% | ${this.completed}/${this.total} | ${etaText}`;
    }

    if (this.label) {
      const curLen = stripAnsi(text).length;
      const available = cols - curLen - 4;
      if (available >= 10) {
        text += ` | ${sanitizeLabel(this.label, available)}`;
      }
    }

    if (stripAnsi(text).length >= cols) {
      text = text.slice(0, cols - 2) + '…';
    }
    return text;
  }

  render() {
    const text = this.line();
    if (this.isTty) {
      this.stream.write(`\r${CLEAR_LINE}${text}`);
      this.hasDrawn = true;
    } else {
      this.stream.write(`${text}\n`);
    }
  }

  note(message) {
    if (this.isTty && this.hasDrawn) {
      this.stream.write(`\r${CLEAR_LINE}`);
    }
    this.stream.write(`${message}\n`);
    if (this.isTty) this.render();
  }

  finish(finalMessage) {
    if (this.finished) return;
    this.completed = this.total;
    this.finished = true;
    if (this.isTty) {
      if (this.hasDrawn) this.stream.write(`\r${CLEAR_LINE}`);
      if (finalMessage) this.stream.write(`${finalMessage}\n`);
    } else if (finalMessage) {
      this.stream.write(`${finalMessage}\n`);
    }
  }
}
