import { setTimeout as defaultSleep } from 'node:timers/promises';

export interface WaitForDatabaseOptions {
  /** Give up after this long (default 60s). */
  timeoutMs?: number;
  /** Pause between attempts (default 2s). */
  intervalMs?: number;
  /** Called after each failed attempt with the error and the attempt number. */
  onRetry?: (error: unknown, attempt: number) => void;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Polls `tryConnect` until it resolves, pausing `intervalMs` between failed
 * attempts. Resolves with `tryConnect`'s value (e.g. a connected client), or
 * rethrows the last connection error once another attempt would overshoot
 * `timeoutMs`.
 */
export async function waitForDatabase<T>(tryConnect: () => Promise<T>, options: WaitForDatabaseOptions = {}) {
  const { timeoutMs = 60_000, intervalMs = 2_000, onRetry, now = Date.now, sleep = defaultSleep } = options;
  const deadline = now() + timeoutMs;

  for (let attempt = 1; ; attempt++) {
    try {
      return await tryConnect();
    } catch (error) {
      if (now() + intervalMs > deadline) {
        throw error;
      }
      onRetry?.(error, attempt);
      await sleep(intervalMs);
    }
  }
}
