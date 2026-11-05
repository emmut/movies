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
      expect(await getWikidataWatchLinks(type, 66732, 'US')).toContainEqual({
        providerId: 8,
        types: ['flatrate'],
        regions: ['US'],
        url: 'https://www.netflix.com/title/80057281',
      });
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
    'tries an exact TMDB statement lookup when its Wikidata ID is absent or invalid: %s',
    async (wikidata_id) => {
      vi.mocked(getTmdbExternalIds).mockResolvedValue({
        imdb_id: null,
        wikidata_id: wikidata_id ?? null,
      });
      fetchMock.mockResolvedValue(Response.json({ query: { search: [] } }));
      expect(await getWikidataWatchLinks('movie', 1, 'US')).toEqual([]);
      const [url] = fetchMock.mock.calls[0];
      expect(url.searchParams.get('srsearch')).toBe('haswbstatement:P4947=1');
      expect(url.searchParams.get('srlimit')).toBe('2');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['movie', 'tv'] as const)(
    'recovers %s identity through a unique exact reverse statement',
    async (type) => {
      vi.mocked(getTmdbExternalIds).mockResolvedValue({ imdb_id: null, wikidata_id: null });
      const property = type === 'movie' ? 'P4947' : 'P4983';
      const idClaim = {
        rank: 'normal',
        mainsnak: { snaktype: 'value', datatype: 'external-id', datavalue: { value: '66732' } },
      };
      fetchMock
        .mockResolvedValueOnce(Response.json({ query: { search: [{ title: 'Q19798734' }] } }))
        .mockResolvedValueOnce(
          Response.json({
            entities: {
              Q19798734: { claims: { ...body.entities.Q19798734.claims, [property]: [idClaim] } },
            },
          }),
        );
      expect(await getWikidataWatchLinks(type, 66732, 'US')).toHaveLength(3);
      expect(fetchMock.mock.calls[0][0].searchParams.get('srsearch')).toBe(
        `haswbstatement:${property}=66732`,
      );
      expect(fetchMock.mock.calls[1][0].searchParams.get('ids')).toBe('Q19798734');
    },
  );

  it.each([
    { search: [] },
    { search: [{ title: 'Q1' }, { title: 'Q2' }] },
    { search: [{ title: '../unsafe' }] },
  ])(
    'does not guess between missing, ambiguous or malformed reverse results: %j',
    async ({ search }) => {
      vi.mocked(getTmdbExternalIds).mockResolvedValue({ imdb_id: null, wikidata_id: null });
      fetchMock.mockResolvedValue(Response.json({ query: { search } }));
      expect(await getWikidataWatchLinks('movie', 1, 'US')).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    {},
    {
      P4947: [
        {
          rank: 'deprecated',
          mainsnak: { snaktype: 'value', datatype: 'external-id', datavalue: { value: '1' } },
        },
      ],
    },
    {
      P4947: [
        {
          rank: 'normal',
          mainsnak: { snaktype: 'value', datatype: 'external-id', datavalue: { value: '2' } },
        },
      ],
    },
    {
      P4983: [
        {
          rank: 'normal',
          mainsnak: { snaktype: 'value', datatype: 'external-id', datavalue: { value: '1' } },
        },
      ],
    },
  ])('verifies search results against the exact resource ID and namespace: %j', async (claims) => {
    vi.mocked(getTmdbExternalIds).mockResolvedValue({ imdb_id: null, wikidata_id: null });
    fetchMock
      .mockResolvedValueOnce(Response.json({ query: { search: [{ title: 'Q19798734' }] } }))
      .mockResolvedValueOnce(
        Response.json({
          entities: { Q19798734: { claims: { ...body.entities.Q19798734.claims, ...claims } } },
        }),
      );
    expect(await getWikidataWatchLinks('movie', 1, 'US')).toEqual([]);
  });

  it.each([404, 429, 503])('falls back on HTTP %s', async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    expect(await getWikidataWatchLinks('movie', 1, 'US')).toEqual([]);
  });

  it('rejects a reverse-search item that claims conflicting TMDB IDs', async () => {
    vi.mocked(getTmdbExternalIds).mockResolvedValue({ imdb_id: null, wikidata_id: null });
    const claims = {
      ...body.entities.Q19798734.claims,
      P4947: ['1', '2'].map((value) => ({
        rank: 'normal',
        mainsnak: {
          snaktype: 'value',
          datatype: 'external-id',
          datavalue: { value },
        },
      })),
    };
    fetchMock
      .mockResolvedValueOnce(Response.json({ query: { search: [{ title: 'Q19798734' }] } }))
      .mockResolvedValueOnce(Response.json({ entities: { Q19798734: { claims } } }));
    expect(await getWikidataWatchLinks('movie', 1, 'US')).toEqual([]);
  });

  it.each([
    {},
    { error: { code: 'maxlag' } },
    { entities: { Q19798734: { missing: '' } } },
    { entities: { Q19798734: { claims: null } } },
  ])('falls back on invalid, missing and maxlag responses: %j', async (data) => {
    fetchMock.mockResolvedValue(Response.json(data));
    expect(await getWikidataWatchLinks('movie', 1, 'US')).toEqual([]);
  });

  it('handles malformed JSON', async () => {
    fetchMock.mockResolvedValue(new Response('invalid JSON'));
    expect(await getWikidataWatchLinks('tv', 1, 'US')).toEqual([]);
  });

  it('falls back on timeouts and can retry next time', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'));
    expect(await getWikidataWatchLinks('tv', 1, 'US')).toEqual([]);
    expect(await getWikidataWatchLinks('tv', 1, 'US')).toHaveLength(3);
  });

  it('recovers a missing mapping through an exact IMDb claim when no TMDB claim exists', async () => {
    vi.mocked(getTmdbExternalIds).mockResolvedValue({ imdb_id: 'tt4574334', wikidata_id: null });
    fetchMock
      .mockResolvedValueOnce(Response.json({ query: { search: [{ title: 'Q19798734' }] } }))
      .mockResolvedValueOnce(
        Response.json({
          entities: {
            Q19798734: {
              claims: {
                ...body.entities.Q19798734.claims,
                P345: [
                  {
                    rank: 'normal',
                    mainsnak: {
                      snaktype: 'value',
                      datatype: 'external-id',
                      datavalue: { value: 'tt4574334' },
                    },
                  },
                ],
              },
            },
          },
        }),
      );
    expect(await getWikidataWatchLinks('tv', 66732, 'SE')).toHaveLength(3);
    expect(fetchMock.mock.calls[0][0].searchParams.get('srsearch')).toBe(
      'haswbstatement:P4983=66732 OR haswbstatement:P345=tt4574334',
    );
  });

  it('reads the canonical entity after a Wikidata merge instead of losing its links', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        redirects: [{ from: 'Q19798734', to: 'Q99' }],
        entities: { Q99: body.entities.Q19798734 },
      }),
    );
    expect(await getWikidataWatchLinks('tv', 66732, 'SE')).toHaveLength(3);
    expect(fetchMock.mock.calls[0][0].searchParams.get('redirects')).toBe('yes');
  });

  it('logs HTTP status without upstream response text or credentials', async () => {
    fetchMock.mockResolvedValue(new Response('sensitive upstream response', { status: 403 }));
    expect(await getWikidataWatchLinks('movie', 1, 'SE')).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(
      'Wikidata title links unavailable; using TMDB watch options.',
      { type: 'movie', id: 1, reason: 'http', status: 403 },
    );
  });

  it('falls back without leaking upstream errors if TMDB fails', async () => {
    vi.mocked(getTmdbExternalIds).mockRejectedValue(new Error('sensitive upstream detail'));
    expect(await getWikidataWatchLinks('tv', 1, 'US')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Wikidata title links unavailable; using TMDB watch options.',
      { type: 'tv', id: 1, reason: 'request_or_data', status: undefined },
    );
  });
});
