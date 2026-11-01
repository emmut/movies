import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/tmdb-external-ids', () => ({ getTmdbExternalIds: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { getTmdbExternalIds } from '@/lib/tmdb-external-ids';

import { getWikidataWatchLinks } from './wikidata';

const fetchMock = vi.fn();
const body = {
  entities: {
    Q19798734: {
      claims: {
        P1874: [
          {
            rank: 'normal',
            mainsnak: {
              snaktype: 'value',
              datatype: 'external-id',
              datavalue: { value: '80057281' },
            },
          },
        ],
      },
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(getTmdbExternalIds).mockResolvedValue({
    imdb_id: 'tt4574334',
    wikidata_id: 'Q19798734',
  });
  fetchMock.mockResolvedValue(Response.json(body));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Wikidata title lookup', () => {
  it.each(['movie', 'tv'] as const)(
    'resolves %s through TMDB external IDs, not a name search',
    async (type) => {
      expect(await getWikidataWatchLinks(type, 66732)).toEqual([
        {
          providerId: 8,
          types: ['flatrate'],
          regions: undefined,
          url: 'https://www.netflix.com/title/80057281',
        },
      ]);
      expect(getTmdbExternalIds).toHaveBeenCalledExactlyOnceWith(type, 66732);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url.origin).toBe('https://www.wikidata.org');
      expect(url.searchParams.get('ids')).toBe('Q19798734');
      expect(url.searchParams.get('props')).toBe('claims');
      expect(url.searchParams.get('maxlag')).toBe('5');
      expect(options.headers['User-Agent']).toContain('https://github.com/emmut/movies');
      expect(options.signal).toBeInstanceOf(AbortSignal);
    },
  );

  it.each([null, undefined, '', 'Q0', 'Q123/../../evil', 'https://evil.com'])(
    'skips Wikidata for missing or invalid item IDs: %s',
    async (wikidata_id) => {
      vi.mocked(getTmdbExternalIds).mockResolvedValue({
        imdb_id: null,
        wikidata_id: wikidata_id ?? null,
      });
      expect(await getWikidataWatchLinks('movie', 1)).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([404, 429, 503])('falls back on HTTP %s', async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    expect(await getWikidataWatchLinks('movie', 1)).toEqual([]);
  });

  it.each([
    {},
    { error: { code: 'maxlag' } },
    { entities: { Q19798734: { missing: '' } } },
    { entities: { Q19798734: { claims: null } } },
  ])('falls back on invalid, missing and maxlag responses: %j', async (data) => {
    fetchMock.mockResolvedValue(Response.json(data));
    expect(await getWikidataWatchLinks('movie', 1)).toEqual([]);
  });

  it('handles malformed JSON', async () => {
    fetchMock.mockResolvedValue(new Response('invalid JSON'));
    expect(await getWikidataWatchLinks('tv', 1)).toEqual([]);
  });

  it('falls back on timeouts and can retry next time', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'));
    expect(await getWikidataWatchLinks('tv', 1)).toEqual([]);
    expect(await getWikidataWatchLinks('tv', 1)).toHaveLength(1);
  });

  it('falls back without leaking upstream errors if TMDB fails', async () => {
    vi.mocked(getTmdbExternalIds).mockRejectedValue(new Error('sensitive upstream detail'));
    expect(await getWikidataWatchLinks('tv', 1)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Wikidata title links unavailable; using TMDB watch options.',
    );
  });
});
