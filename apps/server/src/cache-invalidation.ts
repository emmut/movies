import 'server-only';
import type { MutationEvent } from '@movies/api/mutation-effects';
import { cacheEventHeaders } from '@movies/auth/cache-events';

/** Await delivery for browser and native writes before acknowledging success. */
export function createCacheInvalidator(
  webUrl: string,
  secret: string,
  fetcher: typeof fetch = fetch,
) {
  return async function invalidate(event: MutationEvent) {
    const body = JSON.stringify(event);
    const response = await fetcher(new URL('/api/internal/invalidate', webUrl), {
      method: 'POST',
      headers: cacheEventHeaders(body, secret),
      body,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error('Could not invalidate web caches');
    }
  };
}
