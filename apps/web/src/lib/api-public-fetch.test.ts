import { readWikidataClaims } from '@movies/services/watch-links-service';
import { cacheLife } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@movies/services/watch-links-service', () => ({ readWikidataClaims: vi.fn() }));
vi.mock('@/lib/tmdb', () => ({ tmdbFetch: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));

import { apiWikidataClaims } from './api-public-fetch';

beforeEach(() => vi.clearAllMocks());
describe('optional upstream cache boundary', () => {
  it('caches validated claims with the existing daily refresh window', async () => {
    const claims = { P1874: [] };
    vi.mocked(readWikidataClaims).mockResolvedValue(claims);
    expect(await apiWikidataClaims('Q123')).toBe(claims);
    expect(cacheLife).toHaveBeenCalledWith({ stale: 3600, revalidate: 86400, expire: 604800 });
  });
  it('propagates failures so Next never stores a success-shaped empty fallback', async () => {
    vi.mocked(readWikidataClaims)
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValue({ P1874: [] });
    await expect(apiWikidataClaims('Q123')).rejects.toThrow('temporary outage');
    await expect(apiWikidataClaims('Q123')).resolves.toEqual({ P1874: [] });
    expect(readWikidataClaims).toHaveBeenCalledTimes(2);
  });
});
