import { TmdbRequestError } from '@movies/api/tmdb-fetch';
import { describe, expect, it, vi } from 'vitest';

import { createCatalogService } from './catalog-service';

const movie = {
  id: 42,
  title: 'A movie',
  original_title: 'Original movie',
  release_date: '2026-10-10',
  overview: 'An overview',
  tagline: 'A tagline',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  genres: [{ id: 12, name: 'Adventure' }],
  vote_average: 8.21,
  vote_count: 1200,
  popularity: 15.6,
  spoken_languages: [{ english_name: 'English' }],
  origin_country: ['US'],
  homepage: 'https://example.com',
  runtime: 125,
  budget: 1000,
  revenue: 2000,
  status: 'Released',
  sensitiveUpstreamField: 'should not leave the host',
};
const movieRating = {
  results: [{ iso_3166_1: 'US', release_dates: [{ type: 3, certification: 'R' }] }],
};

describe('catalog service', () => {
  it('normalizes movie metadata and selects the canonical fallback certification', async () => {
    const fetchTmdb = vi.fn().mockResolvedValueOnce(movie).mockResolvedValueOnce(movieRating);
    const result = await createCatalogService(fetchTmdb).details({
      id: 42,
      type: 'movie',
      region: 'SE',
    });
    expect(result).toEqual({
      id: 42,
      type: 'movie',
      title: 'A movie',
      originalTitle: 'Original movie',
      releaseDate: '2026-10-10',
      overview: 'An overview',
      tagline: 'A tagline',
      genres: movie.genres,
      rating: 8.21,
      voteCount: 1200,
      popularity: 15.6,
      languages: ['English'],
      originCountries: ['US'],
      homepage: 'https://example.com/',
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
      runtime: 125,
      budget: 1000,
      revenue: 2000,
      status: 'Released',
      certification: { value: 'R', region: 'US' },
    });
    expect(fetchTmdb.mock.calls.map(([path]) => path)).toEqual([
      '/movie/42',
      '/movie/42/release_dates',
    ]);
  });
  it('uses TV identifiers, facts and content ratings', async () => {
    const series = {
      id: 7,
      name: 'A series',
      original_name: 'An original name',
      first_air_date: '2020-01-02',
      last_air_date: '2025-01-02',
      number_of_seasons: 3,
      number_of_episodes: 24,
      episode_run_time: [40, 50],
      networks: [{ name: 'A network' }],
    };
    const fetchTmdb = vi
      .fn()
      .mockResolvedValueOnce(series)
      .mockResolvedValueOnce({ results: [{ iso_3166_1: 'SE', rating: '15' }] });
    const result = await createCatalogService(fetchTmdb).details({
      id: 7,
      type: 'tv',
      region: 'SE',
    });
    expect(result).toMatchObject({
      id: 7,
      type: 'tv',
      title: 'A series',
      originalTitle: 'An original name',
      releaseDate: '2020-01-02',
      lastAirDate: '2025-01-02',
      seasons: 3,
      episodes: 24,
      episodeRuntimes: [40, 50],
      networks: ['A network'],
      certification: { value: '15', region: 'SE' },
      posterUrl: null,
      backdropUrl: null,
      homepage: null,
    });
    expect(result).not.toHaveProperty('runtime');
    expect(fetchTmdb.mock.calls.map(([path]) => path)).toEqual(['/tv/7', '/tv/7/content_ratings']);
  });
  it('keeps missing optional metadata as explicit fallbacks', async () => {
    const fetchTmdb = vi
      .fn()
      .mockResolvedValueOnce({
        id: 42,
        title: 'Untitled',
        poster_path: null,
        backdrop_path: null,
        runtime: null,
      })
      .mockResolvedValueOnce({ results: [] });
    const result = await createCatalogService(fetchTmdb).details({
      id: 42,
      type: 'movie',
      region: 'SE',
    });
    expect(result).toMatchObject({
      posterUrl: null,
      backdropUrl: null,
      runtime: null,
      genres: [],
      overview: '',
      releaseDate: '',
      languages: [],
      certification: null,
      homepage: null,
    });
  });
  it.each(['javascript:alert(1)', 'invalid', 'file:///secret'])(
    'omits unsafe homepage metadata %s',
    async (homepage) => {
      const fetchTmdb = vi
        .fn()
        .mockResolvedValueOnce({ ...movie, homepage })
        .mockResolvedValueOnce(movieRating);
      expect(
        (await createCatalogService(fetchTmdb).details({ id: 42, type: 'movie', region: 'SE' }))
          .homepage,
      ).toBeNull();
    },
  );
  it('supports an ordinary HTTP homepage', async () => {
    const fetchTmdb = vi
      .fn()
      .mockResolvedValueOnce({ ...movie, homepage: 'http://example.com' })
      .mockResolvedValueOnce(movieRating);
    expect(
      (await createCatalogService(fetchTmdb).details({ id: 42, type: 'movie', region: 'SE' }))
        .homepage,
    ).toBe('http://example.com/');
  });
  it('keeps core details usable when certification fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchTmdb = vi
      .fn()
      .mockResolvedValueOnce(movie)
      .mockRejectedValueOnce(new Error('rating outage'));
    const result = await createCatalogService(fetchTmdb).details({
      id: 42,
      type: 'movie',
      region: 'SE',
    });
    expect(result.title).toBe('A movie');
    expect(result.certification).toBeNull();
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
  it('distinguishes missing core titles from upstream outages', async () => {
    for (const status of [404, 503]) {
      const upstream = new TmdbRequestError('upstream message', status);
      const fetchTmdb = vi.fn().mockRejectedValueOnce(upstream).mockResolvedValueOnce(movieRating);
      const operation = createCatalogService(fetchTmdb).details({
        id: 42,
        type: 'movie',
        region: 'SE',
      });
      if (status === 404)
        await expect(operation).rejects.toMatchObject({
          code: 'NOT_FOUND',
          message: 'Title not found',
        });
      else await expect(operation).rejects.toBe(upstream);
    }
  });
  it.each([
    { id: 7 },
    { id: 42 },
    { id: 42, vote_count: -1 },
    { id: 42, title: 'Bad', genres: [{ id: -1 }] },
  ])('rejects malformed or mismatched core records', async (record) => {
    const fetchTmdb = vi.fn().mockResolvedValueOnce(record).mockResolvedValueOnce(movieRating);
    await expect(
      createCatalogService(fetchTmdb).details({ id: 42, type: 'movie', region: 'SE' }),
    ).rejects.toThrow();
  });
});
