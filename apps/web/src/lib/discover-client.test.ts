import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('./tmdb', () => ({ tmdbFetch: vi.fn(), addPosterImageUrls: (item: unknown) => item }));

import { getDiscoverMedia } from './discover-client';
import { queryKeys } from './query-keys';
import { tmdbFetch } from './tmdb';

const params = { keywordIds: [818], genreIds: [], page: 2 };

beforeEach(() => vi.clearAllMocks());

describe('keyword discovery', () => {
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
