import { TTLCache } from '@isaacs/ttlcache';

const cache = new TTLCache<string, unknown>({ max: 1000 });

export function withCache<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyFn: (...args: TArgs) => string,
  ttlMs: number,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args) => {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key) as TReturn;
    const result = await fn(...args);
    cache.set(key, result, { ttl: ttlMs });
    return result;
  };
}

export function invalidateCacheKey(key: string) {
  cache.delete(key);
}

// TTL constants matching old cacheLife values
export const TTL = {
  minutes: 5 * 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  biweekly: 14 * 24 * 60 * 60 * 1000,
} as const;
