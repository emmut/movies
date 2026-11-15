import 'server-only';

/** Bounded process-local public upstream cache. Failed reads are never retained. */
export function cachePublicRead<TInput extends unknown[], TResult>(
  read: (...input: TInput) => Promise<TResult>,
  ttl: number,
  capacity = 1000,
) {
  const entries = new Map<string, { expires: number; value: Promise<TResult> }>();
  return function cached(...input: TInput): Promise<TResult> {
    const key = JSON.stringify(input);
    const existing = entries.get(key);
    if (existing && existing.expires > Date.now()) {
      return existing.value;
    }
    if (entries.size >= capacity) {
      const oldest = entries.keys().next().value;
      if (oldest !== undefined) {
        entries.delete(oldest);
      }
    }
    const entry = { expires: Date.now() + ttl, value: read(...input) };
    entries.set(key, entry);
    void entry.value.catch(() => {
      if (entries.get(key) === entry) {
        entries.delete(key);
      }
    });
    return entry.value;
  };
}
