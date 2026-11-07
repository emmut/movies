import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('./tmdb', () => ({ tmdbFetch: vi.fn() }));

import { searchKeywords } from './keyword-search';
import { tmdbFetch } from './tmdb';

beforeEach(() => vi.clearAllMocks());

describe('keyword search', () => {
  it('trims the query and returns TMDB keyword suggestions', async () => {
    const keywords = [{ id: 4379, name: 'time travel' }];
    vi.mocked(tmdbFetch).mockResolvedValue({ results: keywords });
    await expect(searchKeywords('  time travel  ')).resolves.toEqual(keywords);
    expect(tmdbFetch).toHaveBeenCalledWith('/search/keyword', {
      searchParams: { query: 'time travel', page: 1 },
      errorMessage: 'Failed searching tags',
    });
  });

  it.each(['', ' ', 'a', ' a ', 'x'.repeat(101)])(
    'avoids requests for an invalid query %j',
    async (query) => {
      await expect(searchKeywords(query)).resolves.toEqual([]);
      expect(tmdbFetch).not.toHaveBeenCalled();
    },
  );

  it('returns empty suggestions when TMDB has no matches', async () => {
    vi.mocked(tmdbFetch).mockResolvedValue({ results: [] });
    await expect(searchKeywords('unmatched tag')).resolves.toEqual([]);
  });

  it('propagates failures so the search can show an error and retry', async () => {
    vi.mocked(tmdbFetch).mockRejectedValue(new Error('Unavailable'));
    await expect(searchKeywords('time travel')).rejects.toThrow('Unavailable');
  });
});
