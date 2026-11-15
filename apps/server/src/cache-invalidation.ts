import 'server-only';
import type { MutationEvent } from '@movies/api/mutation-effects';
import { cacheEventHeaders } from '@movies/auth/cache-events';

type Options = {
  fetcher?: typeof fetch;
  onError: (error: unknown, event: MutationEvent) => void;
};
const DELIVERY_ATTEMPTS = 3;

/** A cache outage must never turn an already committed write into a retryable RPC failure. */
export function createCacheInvalidator(webUrl: string, secret: string, options: Options) {
  const fetcher = options.fetcher ?? fetch;
  return async function invalidate(event: MutationEvent) {
    const body = JSON.stringify(event);
    for (let attempt = 1; attempt <= DELIVERY_ATTEMPTS; attempt++) {
      try {
        const response = await fetcher(new URL('/api/internal/invalidate', webUrl), {
          method: 'POST',
          headers: cacheEventHeaders(body, secret),
          body,
          cache: 'no-store',
          redirect: 'error',
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) {
          throw new Error(`Web cache invalidation returned ${response.status}`);
        }
        return;
      } catch (error) {
        if (attempt === DELIVERY_ATTEMPTS) {
          options.onError(error, event);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      }
    }
  };
}
