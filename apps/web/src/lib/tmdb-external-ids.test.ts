import { cacheLife, cacheTag } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('./tmdb', () => ({ tmdbFetch: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { tmdbFetch } from './tmdb';
import { getTmdbExternalIds } from './tmdb-external-ids';

beforeEach(() => vi.clearAllMocks());

describe('shared TMDB external IDs', () => {
  it.each(['movie', 'tv'] as const)(
    'caches the complete %s response with one refresh schedule',
    async (type) => {
      const data = { imdb_id: 'tt4574334', wikidata_id: 'Q19798734' };
      vi.mocked(tmdbFetch).mockResolvedValue(data);
      expect(await getTmdbExternalIds(type, 123)).toEqual(data);
      expect(tmdbFetch).toHaveBeenCalledExactlyOnceWith(`/${type}/123/external_ids`);
      expect(cacheLife).toHaveBeenCalledExactlyOnceWith('hours');
      expect(cacheTag).toHaveBeenCalledWith(`public:${type}:123:details`);
      if (type === 'tv') {
        expect(cacheTag).toHaveBeenCalledWith('public:tv:123:imdb-id');
      }
    },
  );

  it('propagates failures to the readers without caching a fallback', async () => {
    vi.mocked(tmdbFetch).mockRejectedValue(new Error('unavailable'));
    await expect(getTmdbExternalIds('tv', 123)).rejects.toThrow('unavailable');
  });
});
