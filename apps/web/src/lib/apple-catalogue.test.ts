import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));
vi.mock('@/lib/movies', () => ({ getMovieCredits: vi.fn() }));

import { getMovieCredits } from '@/lib/movies';
import type { WatchTitleContext } from '@/types/watch-provider';

const context: WatchTitleContext = {
  type: 'movie',
  id: 1051896,
  title: 'Arcadian',
  originalTitle: 'Arcadian',
  releaseDate: '2024-04-12',
  homepage: null,
};
const movie = {
  wrapperType: 'track',
  kind: 'feature-movie',
  trackId: 1735930123,
  trackName: 'Arcadian',
  artistName: 'Benjamin Brewer',
  releaseDate: '2024-04-12T07:00:00Z',
  trackViewUrl: 'https://itunes.apple.com/se/movie/id1735930123',
  artworkUrl100: 'https://asset.example/image.jpg',
  previewUrl: 'https://asset.example/trailer',
};
const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(100000);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(Response.json({ results: [movie] }));
  vi.mocked(getMovieCredits).mockResolvedValue({
    id: 1051896,
    cast: [],
    crew: [
      {
        id: 1,
        name: 'Benjamin Brewer',
        original_name: 'Benjamin Brewer',
        job: 'Director',
        department: 'Directing',
        credit_id: 'credit',
        adult: false,
        gender: 2,
        known_for_department: 'Directing',
        popularity: 1,
        profile_path: null,
      },
    ],
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Apple catalogue fetch fallback', () => {
  it('uses the selected storefront with a bounded key-free request and only returns destination metadata', async () => {
    const { getAppleCatalogueLinks } = await import('./apple-catalogue');
    const links = await getAppleCatalogueLinks(context, 'SE');
    expect(links).toHaveLength(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.origin + url.pathname).toBe('https://itunes.apple.com/search');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      term: 'Arcadian',
      country: 'se',
      media: 'movie',
      entity: 'movie',
      attribute: 'movieTerm',
      lang: 'en_us',
      limit: '25',
    });
    expect(options).toMatchObject({
      headers: { Accept: 'application/json' },
      redirect: 'error',
      cache: 'no-store',
    });
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(getMovieCredits).toHaveBeenCalledWith(1051896);
    expect(JSON.stringify(links)).not.toContain('asset.example');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not query without a usable release date, title or director', async () => {
    const { getAppleCatalogueLinks } = await import('./apple-catalogue');
    expect(await getAppleCatalogueLinks({ ...context, title: '' }, 'SE')).toEqual([]);
    expect(await getAppleCatalogueLinks({ ...context, releaseDate: '' }, 'SE')).toEqual([]);
    vi.mocked(getMovieCredits).mockResolvedValue({ id: 1, cast: [], crew: [] });
    expect(await getAppleCatalogueLinks(context, 'SE')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('queries TV seasons without fetching movie credits and rejects season destinations', async () => {
    const { getAppleCatalogueLinks } = await import('./apple-catalogue');
    fetchMock.mockResolvedValue(
      Response.json({
        results: [
          {
            wrapperType: 'collection',
            collectionType: 'TV Season',
            artistName: 'Arcadian',
            collectionName: 'Arcadian, Season 1',
            releaseDate: movie.releaseDate,
            artistViewUrl: 'https://itunes.apple.com/se/tv-season/id1735930123',
          },
        ],
      }),
    );
    expect(await getAppleCatalogueLinks({ ...context, type: 'tv' }, 'SE')).toEqual([]);
    expect(getMovieCredits).not.toHaveBeenCalled();
    const [url] = fetchMock.mock.calls[0];
    expect(url.searchParams.get('media')).toBe('tvShow');
    expect(url.searchParams.get('entity')).toBe('tvSeason');
    expect(url.searchParams.get('attribute')).toBe('showTerm');
  });

  it.each([503, 'network', 'json', 'schema'])(
    'preserves fallback after %s failure without retrying immediately',
    async (failure) => {
      const { getAppleCatalogueLinks } = await import('./apple-catalogue');
      if (typeof failure === 'number')
        fetchMock.mockResolvedValue(new Response(null, { status: failure }));
      else if (failure === 'network')
        fetchMock.mockRejectedValue(new Error('secret upstream text'));
      else if (failure === 'json') fetchMock.mockResolvedValue(new Response('invalid json'));
      else fetchMock.mockResolvedValue(Response.json({ results: null }));
      expect(await getAppleCatalogueLinks(context, 'SE')).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'Apple catalogue links unavailable; using existing watch options.',
      );
    },
  );

  it('limits process-local cold requests and permits a later request', async () => {
    const { getAppleCatalogueLinks } = await import('./apple-catalogue');
    expect(await getAppleCatalogueLinks(context, 'SE')).toHaveLength(1);
    expect(await getAppleCatalogueLinks(context, 'US')).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
    vi.mocked(Date.now).mockReturnValue(103100);
    await getAppleCatalogueLinks(context, 'US');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('cools down after rate limiting and can recover afterwards', async () => {
    const { getAppleCatalogueLinks } = await import('./apple-catalogue');
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
    expect(await getAppleCatalogueLinks(context, 'SE')).toEqual([]);
    vi.mocked(Date.now).mockReturnValue(104000);
    expect(await getAppleCatalogueLinks(context, 'SE')).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.mocked(Date.now).mockReturnValue(160000);
    expect(await getAppleCatalogueLinks(context, 'SE')).toHaveLength(1);
  });
});
