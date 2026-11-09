import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('./tmdb', () => ({
  tmdbFetch: vi.fn(),
  optional: async (promise: Promise<unknown>, fallback: unknown) => promise.catch(() => fallback),
}));

import { getCompanies, searchCompanies } from './company-search';
import { tmdbFetch } from './tmdb';

beforeEach(() => vi.clearAllMocks());

describe('production company search', () => {
  it('trims the query and returns only the company identity', async () => {
    vi.mocked(tmdbFetch).mockResolvedValue({
      results: [{ id: 41077, name: 'A24', logo_path: '/logo.png' }],
    });
    await expect(searchCompanies('  A24  ')).resolves.toEqual([{ id: 41077, name: 'A24' }]);
    expect(tmdbFetch).toHaveBeenCalledWith('/search/company', {
      searchParams: { query: 'A24', page: 1 },
      errorMessage: 'Failed searching production companies',
    });
  });
  it.each(['', ' ', 'a', ' a ', 'x'.repeat(101)])('rejects invalid query %j', async (query) => {
    await expect(searchCompanies(query)).resolves.toEqual([]);
    expect(tmdbFetch).not.toHaveBeenCalled();
  });
  it('returns no matches and propagates search errors for retry', async () => {
    vi.mocked(tmdbFetch).mockResolvedValue({ results: [] });
    await expect(searchCompanies('unknown')).resolves.toEqual([]);
    vi.mocked(tmdbFetch).mockRejectedValue(new Error('Unavailable'));
    await expect(searchCompanies('A24')).rejects.toThrow('Unavailable');
  });
});

describe('selected production company names', () => {
  it('loads and deduplicates company IDs from a shared link', async () => {
    vi.mocked(tmdbFetch).mockResolvedValue({ id: 41077, name: 'A24' });
    await expect(getCompanies([41077, 41077])).resolves.toEqual([{ id: 41077, name: 'A24' }]);
    expect(tmdbFetch).toHaveBeenCalledTimes(1);
    expect(tmdbFetch).toHaveBeenCalledWith('/company/41077', {
      errorMessage: 'Failed loading production company',
    });
  });
  it.each([[-1], [0], [1.2], Array(51).fill(2)])('rejects invalid IDs %j', async (ids) => {
    await expect(getCompanies(ids)).resolves.toEqual([]);
    expect(tmdbFetch).not.toHaveBeenCalled();
  });
  it('keeps unavailable companies removable', async () => {
    vi.mocked(tmdbFetch).mockRejectedValue(new Error('Not found'));
    await expect(getCompanies([2])).resolves.toEqual([{ id: 2, name: 'Company 2' }]);
  });
});
