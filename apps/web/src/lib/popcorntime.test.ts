import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));
const { testEnv } = vi.hoisted(() => ({
  testEnv: { POPCORNTIME_API_KEY: 'pt_live_fixture' as string | undefined },
}));
vi.mock('@/env', () => ({ env: testEnv }));

import { getPopcornTimeWatchLinks } from './popcorntime';

const availability = {
  link: 'https://www.themoviedb.org/movie/1051896/watch',
  flatrate: [
    {
      provider_id: 119,
      provider_name: 'Amazon Prime Video',
      logo_path: '/p.png',
      display_priority: 1,
    },
  ],
};
const token = '3xK9mPv2bQ7nRtYs';
const media = {
  id: 'movie1',
  content_type: 'movie',
  external_ids: [{ source: 'tmdb', id: '1051896' }],
};
const search = { results: [{ id: 'movie1', kind: 'movie' }] };
const registry = {
  country: 'SE',
  providers: [{ id: 'prime', name: 'Prime Video', parent_id: null }],
};
const offers = [
  {
    provider_id: 'prime',
    addon_provider_id: null,
    link_token: token,
    price_types: ['flatrate'],
    platforms: ['web'],
    available_from: null,
    available_to: null,
  },
];
const fetchMock = vi.fn<typeof fetch>();

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status });
}

function useResponses(overrides: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = {
    '/v1/search': search,
    '/v1/providers': registry,
    '/v1/media/movie1': media,
    '/v1/media/movie1/links': offers,
    ...overrides,
  };
  fetchMock.mockImplementation(async (input) =>
    response(data[new URL(String(input)).pathname] ?? {}),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  testEnv.POPCORNTIME_API_KEY = 'pt_live_fixture';
  useResponses();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Popcorn Time lookup', () => {
  it('verifies the exact TMDB identity before fetching a region-specific token', async () => {
    const links = await getPopcornTimeWatchLinks('movie', 1051896, 'Arcadian', 'SE', availability);
    expect(links[0]?.url).toBe(`https://popcorntime.app/go/${token}?platform=web`);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const calls = fetchMock.mock.calls.map(([url, init]) => ({ url: new URL(String(url)), init }));
    const query = calls.find((call) => call.url.pathname === '/v1/search')!;
    expect(Object.fromEntries(query.url.searchParams)).toEqual({
      q: 'Arcadian',
      kind: 'movie',
      country: 'SE',
      lang: 'en',
      limit: '3',
    });
    for (const { url, init } of calls) {
      expect(url.origin).toBe('https://api.popcorntime.app');
      expect(url.href).not.toContain('pt_live_fixture');
      expect(init).toMatchObject({
        headers: { Authorization: 'Bearer pt_live_fixture' },
        redirect: 'error',
        cache: 'no-store',
      });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
    const linksCall = calls.find((call) => call.url.pathname.endsWith('/links'))!;
    expect(linksCall.url.searchParams.get('country')).toBe('SE');
    expect(linksCall.init?.signal).toBe(query.init?.signal);
  });

  it('uses the TV namespace and requires TV identity', async () => {
    useResponses({
      '/v1/search': { results: [{ id: 'movie1', kind: 'tv_show' }] },
      '/v1/media/movie1': { ...media, content_type: 'tv_show' },
    });
    expect(await getPopcornTimeWatchLinks('tv', 1051896, 'Show', 'SE', availability)).toHaveLength(
      1,
    );
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('kind')).toBe('tv_show');
  });

  it.each(['', undefined])('makes no requests without an API key: %s', async (key) => {
    testEnv.POPCORNTIME_API_KEY = key;
    expect(await getPopcornTimeWatchLinks('movie', 1, 'Title', 'SE', availability)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('makes no requests when TMDB has no offers for the selected region', async () => {
    expect(await getPopcornTimeWatchLinks('movie', 1, 'Title', 'SE', undefined)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { ...media, id: 'other' },
    { ...media, content_type: 'tv_show' },
    { ...media, external_ids: [] },
    { ...media, external_ids: [{ source: 'tmdb', id: '1284041' }] },
    { ...media, external_ids: [{ source: 'imdb', id: '1051896' }] },
    { ...media, external_ids: [...media.external_ids, { source: 'tmdb', id: '2' }] },
    null,
  ])('rejects a plausible search result without unambiguous exact identity: %j', async (detail) => {
    useResponses({ '/v1/media/movie1': detail });
    expect(
      await getPopcornTimeWatchLinks('movie', 1051896, 'Arcadian', 'SE', availability),
    ).toEqual([]);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/links'))).toBe(false);
  });

  it('bounds candidate checks and rejects conflicting duplicate media records', async () => {
    useResponses({
      '/v1/search': {
        results: [
          { id: 'movie1', kind: 'movie' },
          { id: 'movie2', kind: 'movie' },
          { id: 'movie3', kind: 'movie' },
          { id: 'movie4', kind: 'movie' },
        ],
      },
      '/v1/media/movie2': { ...media, id: 'movie2' },
      '/v1/media/movie3': { ...media, id: 'movie3' },
    });
    expect(
      await getPopcornTimeWatchLinks('movie', 1051896, 'Arcadian', 'SE', availability),
    ).toEqual([]);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('movie4'))).toBe(false);
  });

  it('ignores malformed, unsafe and wrong-type search candidates', async () => {
    useResponses({
      '/v1/search': {
        results: [null, { id: '../other', kind: 'movie' }, { id: 'movie1', kind: 'tv_show' }],
      },
    });
    expect(
      await getPopcornTimeWatchLinks('movie', 1051896, 'Arcadian', 'SE', availability),
    ).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([401, 403, 429, 500])(
    'falls back without retries or sensitive logs on HTTP %i',
    async (status) => {
      fetchMock.mockImplementation(async () => response({ secret: 'upstream-body' }, status));
      expect(
        await getPopcornTimeWatchLinks('movie', 1051896, 'Arcadian', 'SE', availability),
      ).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(
        'Popcorn Time title links unavailable; using fallback links.',
      );
    },
  );

  it('falls back on network errors and malformed JSON', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'));
    expect(
      await getPopcornTimeWatchLinks('movie', 1051896, 'Arcadian', 'SE', availability),
    ).toEqual([]);
    fetchMock.mockImplementation(async () => new Response('{bad json'));
    expect(
      await getPopcornTimeWatchLinks('movie', 1051896, 'Arcadian', 'SE', availability),
    ).toEqual([]);
  });

  it('falls back when the shared request deadline aborts', async () => {
    const controller = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    fetchMock.mockImplementation(
      async (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('timeout')), {
            once: true,
          });
        }),
    );
    const pending = getPopcornTimeWatchLinks('movie', 1051896, 'Arcadian', 'SE', availability);
    controller.abort();
    expect(await pending).toEqual([]);
  });
});
