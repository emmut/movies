import type { AppRouterClient } from '@movies/api/router';
import { cacheEventHeaders } from '@movies/auth/cache-events';
import { createAuthenticatedFetch } from '@native/lib/auth-transport';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createApp } from '@server/app';
import { createAuthGateway } from '@server/auth-gateway';
import { createCacheInvalidator } from '@server/cache-invalidation';
import { mockServices } from '@server/test-services';
import { revalidateTag } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { POST as invalidate } from '@/app/api/internal/invalidate/route';
import { POST } from '@/app/api/rpc/[[...path]]/route';
import { ENV } from '@/env';
import { createServerApi } from '@/lib/api-server';
import { CACHE_TAGS } from '@/lib/cache-tags';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
const owner = {
  id: 'owner',
  name: 'Anonymous',
  email: 'anon@example.com',
  image: null,
  isAnonymous: true,
};
let services: ReturnType<typeof mockServices>;
let requests: Request[];
let revoked: boolean;
let unavailableCallback: boolean;
const deliveryError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  requests = [];
  revoked = false;
  unavailableCallback = false;
  services = mockServices();
  vi.mocked(services.home.list).mockResolvedValue([]);
  vi.mocked(services.preferences.setRegion).mockImplementation(async (_user, input) => input);
  const auth = createAuthGateway('http://localhost:3000', async (_url, init) => {
    const cookie = new Headers(init?.headers).get('cookie');
    const user = cookie === 'session=other' ? { ...owner, id: 'other' } : owner;
    return Response.json(
      !revoked && cookie?.startsWith('session=')
        ? {
            user,
            session: { expiresAt: '2099-01-01' },
          }
        : null,
    );
  });
  const callback = createCacheInvalidator('http://localhost:3000', ENV.BETTER_AUTH_SECRET, {
    fetcher: async (url, init) =>
      unavailableCallback
        ? new Response(null, { status: 503 })
        : invalidate(new Request(url, init)),
    onError: deliveryError,
  });
  const app = createApp(services, { auth, onMutation: callback });
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    requests.push(request.clone());
    return app.request(request);
  });
});
afterEach(() => vi.unstubAllGlobals());

function client(browser: boolean, cookie = 'session=owner'): AppRouterClient {
  const nativeFetch = createAuthenticatedFetch('ios', async () => cookie);
  return createORPCClient(
    new RPCLink({
      url: browser ? 'http://localhost:3000/api/rpc' : 'http://localhost:3001/rpc',
      fetch: browser
        ? async (request) => {
            const headers = new Headers(request.headers);
            headers.set('cookie', cookie);
            headers.set('origin', 'http://localhost:3000');
            return POST(new Request(request, { headers }));
          }
        : nativeFetch,
    }),
  );
}

describe('single Hono runtime', () => {
  it('sends server metadata/prefetch and browser reads to Hono', async () => {
    await createServerApi(new Headers()).home.list({ category: 'popular-tv' });
    await client(true).home.list({ category: 'popular-tv' });
    expect(services.home.list).toHaveBeenCalledTimes(2);
    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      '/rpc/home/list',
      '/rpc/home/list',
    ]);
    expect(requests.every((request) => new URL(request.url).origin === ENV.API_URL)).toBe(true);
  });
  it.each([true, false])(
    'verifies anonymous identity and invalidates Next after writes (browser=%s)',
    async (browser) => {
      const api = client(browser);
      expect(await api.session.current()).toEqual(owner);
      await api.preferences.setRegion({ region: 'US', userId: 'forged' } as never);
      expect(services.preferences.setRegion).toHaveBeenCalledWith('owner', { region: 'US' });
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.private.userRegion('owner'), {
        expire: 0,
      });
    },
  );
  it('forwards server cookies without trusting identity headers and isolates accounts', async () => {
    await createServerApi(
      new Headers({ cookie: 'session=other', 'x-user-id': 'owner', 'content-type': 'text/plain' }),
    ).preferences.setRegion({ region: 'SE' });
    expect(services.preferences.setRegion).toHaveBeenCalledWith('other', { region: 'SE' });
    expect(requests[0].headers.has('x-user-id')).toBe(false);
    expect(requests[0].headers.get('content-type')).toContain('application/json');
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.private.userRegion('other'), {
      expire: 0,
    });
  });
  it('rejects signed-out, revoked, invalid and failed writes without invalidating', async () => {
    await expect(client(true, '').preferences.setRegion({ region: 'US' })).rejects.toThrow();
    revoked = true;
    await expect(client(false).preferences.setRegion({ region: 'US' })).rejects.toThrow();
    revoked = false;
    await expect(
      client(true).preferences.setRegion({ region: 'INVALID' } as never),
    ).rejects.toThrow();
    vi.mocked(services.preferences.setRegion).mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    await expect(client(false).preferences.setRegion({ region: 'US' })).rejects.toThrow();
    expect(revalidateTag).not.toHaveBeenCalled();
  });
  it('rejects forged, altered and expired invalidation callbacks', async () => {
    const body = JSON.stringify({ domain: 'preferences', userId: 'victim' });
    for (const [payload, headers] of [
      [body, {}],
      [body + ' ', cacheEventHeaders(body, ENV.BETTER_AUTH_SECRET)],
      [body, cacheEventHeaders(body, ENV.BETTER_AUTH_SECRET, Date.now() - 60_000)],
    ] as const) {
      expect(
        (
          await invalidate(
            new Request('http://localhost/api/internal/invalidate', {
              method: 'POST',
              body: payload,
              headers,
            }),
          )
        ).status,
      ).toBe(401);
    }
    expect(revalidateTag).not.toHaveBeenCalled();
  });
  it('rejects cross-origin writes at the browser proxy', async () => {
    expect(
      (
        await POST(
          new Request('http://localhost/api/rpc/preferences/setRegion', {
            method: 'POST',
            headers: { origin: 'https://evil.example' },
            body: '{}',
          }),
        )
      ).status,
    ).toBe(403);
    expect(requests).toHaveLength(0);
  });
  it('does not fall back to local execution when Hono is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API unavailable')));
    await expect(
      createServerApi(new Headers()).home.list({ category: 'popular-tv' }),
    ).rejects.toThrow();
    expect(services.home.list).not.toHaveBeenCalled();
  });
});

it('acknowledges a committed write once even when the web invalidation service is unavailable', async () => {
  unavailableCallback = true;
  await expect(client(true).preferences.setRegion({ region: 'US' })).resolves.toEqual({
    region: 'US',
  });
  expect(services.preferences.setRegion).toHaveBeenCalledTimes(1);
  expect(deliveryError).toHaveBeenCalledWith(expect.any(Error), {
    domain: 'preferences',
    userId: 'owner',
  });
});
