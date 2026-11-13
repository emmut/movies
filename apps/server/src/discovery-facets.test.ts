import { createDiscoveryFacetService } from '@server/discovery-facets';
import { describe, expect, it, vi } from 'vite-plus/test';

describe('named discovery choices', () => {
  it('hydrates selected names, deduplicates matches and uses canonical company/keyword endpoints', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ id: 2, name: 'Studio' })
      .mockResolvedValueOnce({
        results: [
          { id: 2, name: 'Studio' },
          { id: 3, name: 'Studio Three' },
        ],
      })
      .mockResolvedValueOnce({ results: [{ id: 9, name: 'space travel' }] });
    const facets = createDiscoveryFacetService(fetcher);
    expect(await facets({ kind: 'company', ids: [2, 2], query: 'Studio' })).toEqual([
      { id: 2, name: 'Studio' },
      { id: 3, name: 'Studio Three' },
    ]);
    expect(fetcher).toHaveBeenCalledWith('/company/2');
    expect(fetcher).toHaveBeenCalledWith('/search/company', {
      searchParams: { query: 'Studio', page: 1 },
    });
    expect(await facets({ kind: 'keyword', ids: [], query: 'space' })).toEqual([
      { id: 9, name: 'space travel' },
    ]);
    expect(fetcher).toHaveBeenCalledWith('/search/keyword', {
      searchParams: { query: 'space', page: 1 },
    });
  });
  it('searches the cached daily network export, with exact names first', async () => {
    const loader = vi.fn().mockResolvedValue([
      { id: 1, name: 'HBO Family' },
      { id: 49, name: 'HBO' },
    ]);
    const fetcher = vi.fn();
    const facets = createDiscoveryFacetService(fetcher, loader);
    expect(await facets({ kind: 'network', ids: [], query: 'hbo' })).toEqual([
      { id: 49, name: 'HBO' },
      { id: 1, name: 'HBO Family' },
    ]);
    await facets({ kind: 'network', ids: [], query: 'Family' });
    expect(loader).toHaveBeenCalledTimes(1);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('retries failed catalogues and keeps selected IDs removable when detail lookups fail', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    const facets = createDiscoveryFacetService(vi.fn().mockResolvedValue({ id: -1 }), loader);
    expect(await facets({ kind: 'company', ids: [2], query: '' })).toEqual([
      { id: 2, name: 'Company 2' },
    ]);
    await expect(facets({ kind: 'network', ids: [], query: 'hbo' })).rejects.toThrow('offline');
    expect(await facets({ kind: 'network', ids: [], query: 'hbo' })).toEqual([]);
    expect(loader).toHaveBeenCalledTimes(2);
  });
  it('avoids searches for short input and propagates failed or malformed upstream results', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ results: [{ id: -1, name: 'Bad' }] });
    const facets = createDiscoveryFacetService(fetcher);
    expect(await facets({ kind: 'keyword', ids: [], query: 'a' })).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
    await expect(facets({ kind: 'company', ids: [], query: 'aa' })).rejects.toThrow('offline');
    await expect(facets({ kind: 'keyword', ids: [], query: 'aa' })).rejects.toThrow();
  });
});
