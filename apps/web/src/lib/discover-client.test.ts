import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('./tmdb', () => ({ tmdbFetch: vi.fn(), addPosterImageUrls: (item: unknown) => item }));

import { getDiscoverMedia } from './discover-client';
import { getDiscoverWatchProviders } from './discover-params';
import { queryKeys } from './query-keys';
import { tmdbFetch } from './tmdb';

const params = { keywordIds: [818], genreIds: [], page: 2 };

beforeEach(() => vi.clearAllMocks());

describe('keyword discovery', () => {
  it.each(['movie', 'tv'] as const)(
    'ignores saved providers for %s keywords and honors URL selections',
    async (type) => {
      vi.mocked(tmdbFetch).mockResolvedValue({ results: [], total_pages: 1 });
      const savedProviders = [8, 9];
      await getDiscoverMedia(type, {
        ...params,
        watchRegion: 'US',
        watchProviders: getDiscoverWatchProviders([], savedProviders, params.keywordIds),
      });
      const unfiltered = vi.mocked(tmdbFetch).mock.calls[0][1]?.searchParams;
      expect(unfiltered).toHaveProperty('with_keywords', '818');
      expect(unfiltered).not.toHaveProperty('with_watch_providers');

      await getDiscoverMedia(type, {
        ...params,
        watchRegion: 'US',
        watchProviders: getDiscoverWatchProviders([337], savedProviders, params.keywordIds),
      });
      expect(tmdbFetch).toHaveBeenLastCalledWith(
        `/discover/${type}`,
        expect.objectContaining({
          searchParams: expect.objectContaining({
            with_keywords: '818',
            with_watch_providers: '337',
            watch_region: 'US',
          }),
        }),
      );
    },
  );
  it.each(['movie', 'tv'] as const)(
    'forwards %s keywords to TMDB and caps pagination',
    async (type) => {
      vi.mocked(tmdbFetch).mockResolvedValue({ results: [{ id: 1 }], total_pages: 600 });
      await expect(getDiscoverMedia(type, params)).resolves.toEqual({
        results: [{ id: 1 }],
        totalPages: 500,
      });
      expect(tmdbFetch).toHaveBeenCalledWith(
        `/discover/${type}`,
        expect.objectContaining({
          searchParams: expect.objectContaining({
            with_keywords: '818',
            page: 2,
            include_adult: 'false',
          }),
        }),
      );
    },
  );

  it.each(['movies', 'tvShows'] as const)(
    'isolates %s keyword results in the query cache',
    (type) => {
      const key = queryKeys.discover[type];
      expect(key(params)).not.toEqual(key({ ...params, keywordIds: [] }));
      expect(key(params)).not.toEqual(key({ ...params, keywordIds: [4379] }));
      expect(key(params)).not.toEqual(key({ ...params, page: 3 }));
    },
  );
});

it.each(['movie', 'tv'] as const)('forwards %s production companies to TMDB', async (type) => {
  vi.mocked(tmdbFetch).mockResolvedValue({ results: [], total_pages: 1 });
  await getDiscoverMedia(type, { ...params, companyIds: [41077, 2] });
  expect(tmdbFetch).toHaveBeenCalledWith(
    `/discover/${type}`,
    expect.objectContaining({
      searchParams: expect.objectContaining({ with_companies: '41077|2' }),
    }),
  );
});

it.each(['movies', 'tvShows'] as const)(
  'isolates %s production company results in the cache',
  (type) => {
    const key = queryKeys.discover[type];
    expect(key({ ...params, companyIds: [2] })).not.toEqual(
      key({ ...params, companyIds: [41077] }),
    );
    expect(key({ ...params, companyIds: [2] })).not.toEqual(key({ ...params, companyIds: [] }));
  },
);

it('forwards networks to TV discovery and preserves explicit provider choices', async () => {
  vi.mocked(tmdbFetch).mockResolvedValue({ results: [], total_pages: 1 });
  await getDiscoverMedia('tv', {
    ...params,
    networkIds: [49, 213],
    watchProviders: '8',
    watchRegion: 'US',
  });
  expect(tmdbFetch).toHaveBeenCalledWith(
    '/discover/tv',
    expect.objectContaining({
      searchParams: expect.objectContaining({ with_networks: '49|213', with_watch_providers: '8' }),
    }),
  );
  expect(getDiscoverWatchProviders([], [8], [], [], [49])).toBeUndefined();
  expect(getDiscoverWatchProviders([9], [8], [], [], [49])).toBe('9');
});

it('ignores networks for movie discovery', async () => {
  vi.mocked(tmdbFetch).mockResolvedValue({ results: [], total_pages: 1 });
  await getDiscoverMedia('movie', { ...params, networkIds: [49] });
  expect(vi.mocked(tmdbFetch).mock.calls[0][1]?.searchParams).not.toHaveProperty('with_networks');
});

it('isolates network results in the TV query cache', () => {
  const key = queryKeys.discover.tvShows;
  expect(key({ ...params, networkIds: [49] })).not.toEqual(key({ ...params, networkIds: [213] }));
  expect(key({ ...params, networkIds: [49] })).not.toEqual(key(params));
});
