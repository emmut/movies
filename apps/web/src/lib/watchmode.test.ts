import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: { WATCHMODE_API_KEY: 'test-key' as string | undefined },
}));
vi.mock('@/env', () => ({ env: mockEnv }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));

import { getDirectWatchOffers } from './watchmode';

const source = {
  name: 'Netflix',
  region: 'US',
  type: 'sub',
  web_url: 'https://www.netflix.com/title/123',
};
const fetchMock = vi.fn();

beforeEach(() => {
  mockEnv.WATCHMODE_API_KEY = 'test-key';
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe('Watchmode provider links', () => {
  it('makes no request without an API key', async () => {
    mockEnv.WATCHMODE_API_KEY = undefined;
    expect(await getDirectWatchOffers('movie', 1)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['movie', 'tv'] as const)(
    'resolves %s by TMDB identifier in a single request for all plan regions',
    async (type) => {
      fetchMock.mockResolvedValue(Response.json([source]));
      expect(await getDirectWatchOffers(type, 123)).toEqual([
        {
          providerName: 'Netflix',
          region: 'US',
          type: 'flatrate',
          url: source.web_url,
        },
      ]);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url.pathname).toBe(`/v1/title/${type}-123/sources/`);
      expect(url.searchParams.get('apiKey')).toBe('test-key');
      expect(url.searchParams.has('regions')).toBe(false);
      expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps offer types distinct and ignores unsafe links, malformed rows and TV-provider authentication offers', async () => {
    fetchMock.mockResolvedValue(
      Response.json([
        ...['sub', 'rent', 'buy', 'free'].map((type) => ({ ...source, type })),
        ...[
          'javascript:alert(1)',
          'http://netflix.com/title/1',
          '',
          'https://user:pass@netflix.com/title/1',
        ].map((web_url) => ({ ...source, web_url })),
        { ...source, type: 'tve' },
        { ...source, region: null },
        null,
      ]),
    );
    expect((await getDirectWatchOffers('movie', 1)).map((offer) => offer.type)).toEqual([
      'flatrate',
      'rent',
      'buy',
      'free',
    ]);
  });

  it.each([401, 404, 429, 500])('falls back on HTTP %s', async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    expect(await getDirectWatchOffers('movie', 1)).toEqual([]);
  });

  it('falls back on timeouts and retries on the next request without exposing the key', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock
      .mockRejectedValueOnce(new Error('upstream test-key'))
      .mockResolvedValueOnce(Response.json([source]));
    expect(await getDirectWatchOffers('tv', 1)).toEqual([]);
    expect(warn).toHaveBeenCalledWith('Direct watch links unavailable; using TMDB watch options.');
    expect(await getDirectWatchOffers('tv', 1)).toHaveLength(1);
    warn.mockRestore();
  });

  it.each([{}, null, 'invalid JSON'])('falls back on invalid responses: %s', async (body) => {
    fetchMock.mockResolvedValue(Response.json(body));
    expect(await getDirectWatchOffers('movie', 1)).toEqual([]);
  });
});
