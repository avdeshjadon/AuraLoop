export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  const errors = [];
  let next = 0;
  const size = Math.max(1, Math.min(limit, items.length));

  async function runner() {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        errors.push({ index, item: items[index], error });
      }
    }
  }

  await Promise.all(Array.from({ length: size }, () => runner()));
  return { results, errors };
}

export async function withRetry(fn, { retries = 3, baseDelayMs = 2000, onRetry, signal } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    if (signal?.aborted) throw lastError ?? new Error('Aborted.');
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
      if (onRetry) onRetry(error, attempt);
      await sleep(baseDelayMs * attempt);
    }
  }
  throw lastError;
}
