import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/popcorntime', () => ({ getPopcornTimeAvailability: vi.fn() }));
vi.mock('@/lib/wikidata', () => ({ getWikidataWatchLinks: vi.fn() }));

import { getPopcornTimeAvailability } from '@/lib/popcorntime';
import { getWikidataWatchLinks } from '@/lib/wikidata';

import { getProviderWatchOptions } from './provider-watch-links';

const fallback = {
  providerId: 8,
  types: ['flatrate' as const],
  url: 'https://www.netflix.com/title/80057281',
};
beforeEach(() => vi.clearAllMocks());

describe('provider source resolution', () => {
  it('fetches primary availability without requiring any TMDB provider mapping', async () => {
    const primary = { region: 'SE', offers: [] };
    vi.mocked(getPopcornTimeAvailability).mockResolvedValue(primary);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([fallback]);
    expect(await getProviderWatchOptions('movie', 1, 'Title', 'SE')).toEqual({
      popcornTime: primary,
      directLinks: [{ ...fallback, source: 'wikidata' }],
    });
    expect(getPopcornTimeAvailability).toHaveBeenCalledWith('movie', 1, 'Title', 'SE');
  });

  it('keeps Wikidata when the primary source is unavailable or unconfigured', async () => {
    vi.mocked(getPopcornTimeAvailability).mockResolvedValue(null);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([fallback]);
    expect(await getProviderWatchOptions('tv', 2, 'Title', 'SE')).toEqual({
      popcornTime: null,
      directLinks: [{ ...fallback, source: 'wikidata' }],
    });
    expect(getWikidataWatchLinks).toHaveBeenCalledWith('tv', 2);
  });

  it('returns usable empty options when neither source has data', async () => {
    vi.mocked(getPopcornTimeAvailability).mockResolvedValue(null);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
    expect(await getProviderWatchOptions('movie', 1, 'Title', 'SE')).toEqual({
      popcornTime: null,
      directLinks: [],
    });
  });
});
