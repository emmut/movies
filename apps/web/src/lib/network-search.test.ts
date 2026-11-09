import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));
vi.mock('./network-catalog', () => ({ getNetworkCatalog: vi.fn() }));
vi.mock('./tmdb', () => ({
  tmdbFetch: vi.fn(),
  optional: async (promise: Promise<unknown>, fallback: unknown) => promise.catch(() => fallback),
}));

import { getNetworkCatalog } from './network-catalog';
import { getNetworks, searchNetworks } from './network-search';
import { tmdbFetch } from './tmdb';

beforeEach(() => vi.clearAllMocks());

describe('network search', () => {
  it('matches names case-insensitively, trims the query and puts exact matches first', async () => {
    vi.mocked(getNetworkCatalog).mockResolvedValue([
      { id: 2, name: 'HBO Europe' },
      { id: 49, name: 'HBO' },
      { id: 213, name: 'Netflix' },
    ]);
    await expect(searchNetworks('  hBo ')).resolves.toEqual([
      { id: 49, name: 'HBO' },
      { id: 2, name: 'HBO Europe' },
    ]);
    await expect(searchNetworks('unknown')).resolves.toEqual([]);
  });
  it('limits suggestions', async () => {
    vi.mocked(getNetworkCatalog).mockResolvedValue(
      Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Network ${i}` })),
    );
    expect(await searchNetworks('network')).toHaveLength(20);
  });
  it.each(['', ' ', 'a', 'x'.repeat(101)])(
    'avoids catalogue requests for invalid query %j',
    async (query) => {
      await expect(searchNetworks(query)).resolves.toEqual([]);
      expect(getNetworkCatalog).not.toHaveBeenCalled();
    },
  );
  it('propagates errors so the search supports retry', async () => {
    vi.mocked(getNetworkCatalog).mockRejectedValue(new Error('Unavailable'));
    await expect(searchNetworks('HBO')).rejects.toThrow('Unavailable');
  });
});

describe('selected network names', () => {
  it('loads names and deduplicates network IDs', async () => {
    vi.mocked(tmdbFetch).mockResolvedValue({ id: 49, name: 'HBO' });
    await expect(getNetworks([49, 49])).resolves.toEqual([{ id: 49, name: 'HBO' }]);
    expect(tmdbFetch).toHaveBeenCalledTimes(1);
    expect(tmdbFetch).toHaveBeenCalledWith('/network/49', {
      errorMessage: 'Failed loading network',
    });
  });
  it.each([[-1], [0], [1.2], Array(51).fill(2)])('rejects invalid IDs %j', async (ids) => {
    await expect(getNetworks(ids)).resolves.toEqual([]);
    expect(tmdbFetch).not.toHaveBeenCalled();
  });
  it('keeps unavailable networks removable', async () => {
    vi.mocked(tmdbFetch).mockRejectedValue(new Error('Not found'));
    await expect(getNetworks([49])).resolves.toEqual([{ id: 49, name: 'Network 49' }]);
  });
});
