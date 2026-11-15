import { verifyCacheEvent } from '@movies/auth/cache-events';
import { createCacheInvalidator } from '@server/cache-invalidation';
import { afterEach, expect, it, vi } from 'vite-plus/test';

const secret = 'a-cache-event-fixture-secret-at-least-32-characters';
const event = { domain: 'preferences', userId: 'owner' } as const;
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('signs the exact validated event and targets only the web callback', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
  const onError = vi.fn();
  await createCacheInvalidator('https://web.example.com', secret, { fetcher, onError })(event);
  const [url, init] = fetcher.mock.calls[0];
  expect(String(url)).toBe('https://web.example.com/api/internal/invalidate');
  expect(init).toMatchObject({ method: 'POST', cache: 'no-store', redirect: 'error' });
  expect(verifyCacheEvent(String(init?.body), new Headers(init?.headers), secret)).toBe(true);
  expect(onError).not.toHaveBeenCalled();
});
it('retries transient delivery failures before acknowledging the write', async () => {
  vi.useFakeTimers();
  const fetcher = vi
    .fn<typeof fetch>()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  const onError = vi.fn();
  const pending = createCacheInvalidator('https://web.example.com', secret, { fetcher, onError })(
    event,
  );
  await vi.runAllTimersAsync();
  await expect(pending).resolves.toBeUndefined();
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(onError).not.toHaveBeenCalled();
});
it('logs exhausted delivery without making a committed write appear to fail', async () => {
  vi.useFakeTimers();
  const fetcher = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => new Response(null, { status: 500 }));
  const onError = vi.fn();
  const pending = createCacheInvalidator('https://web.example.com', secret, { fetcher, onError })(
    event,
  );
  await vi.runAllTimersAsync();
  await expect(pending).resolves.toBeUndefined();
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(onError).toHaveBeenCalledWith(expect.any(Error), event);
});

it('uses the host fetch by default', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetcher);
  await createCacheInvalidator('https://web.example.com', secret, { onError: vi.fn() })(event);
  expect(fetcher).toHaveBeenCalledOnce();
});
