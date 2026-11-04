import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/popcorntime', () => ({ getPopcornTimeWatchLinks: vi.fn() }));
vi.mock('@/lib/wikidata', () => ({ getWikidataWatchLinks: vi.fn() }));

import { getPopcornTimeWatchLinks } from '@/lib/popcorntime';
import { getDirectWatchLink } from '@/lib/watch-links';
import { getWikidataWatchLinks } from '@/lib/wikidata';
import type { DirectWatchLink } from '@/types/watch-provider';

import { getProviderWatchLinks } from './provider-watch-links';

const primary: DirectWatchLink = {
  providerId: 8,
  regions: ['SE'],
  types: ['flatrate'],
  url: 'https://popcorntime.app/go/3xK9mPv2bQ7nRtYs?platform=web',
};
const fallback: DirectWatchLink = {
  providerId: 8,
  types: ['flatrate'],
  url: 'https://www.netflix.com/title/80057281',
};

beforeEach(() => vi.clearAllMocks());

describe('provider link precedence', () => {
  it('prefers Popcorn Time only for its matching region and offer, retaining individual fallbacks', async () => {
    vi.mocked(getPopcornTimeWatchLinks).mockResolvedValue([primary]);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([
      fallback,
      { ...fallback, providerId: 337, url: 'https://www.disneyplus.com/browse/entity-example' },
    ]);
    const links = await getProviderWatchLinks('movie', 1, 'Title', 'SE', undefined);
    expect(getDirectWatchLink(links, 8, 'SE', 'flatrate')?.source).toBe('popcorntime');
    expect(getDirectWatchLink(links, 8, 'US', 'flatrate')?.source).toBe('wikidata');
    expect(getDirectWatchLink(links, 337, 'SE', 'flatrate')?.source).toBe('wikidata');
    expect(getDirectWatchLink(links, 8, 'SE', 'rent')).toBeUndefined();
  });

  it('keeps Wikidata when the primary source is unavailable, unconfigured or unmatched', async () => {
    vi.mocked(getPopcornTimeWatchLinks).mockResolvedValue([]);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([fallback]);
    expect(await getProviderWatchLinks('tv', 2, 'Title', 'SE', undefined)).toEqual([
      { ...fallback, source: 'wikidata' },
    ]);
    expect(getWikidataWatchLinks).toHaveBeenCalledWith('tv', 2);
  });

  it('returns no destinations when neither source has a link', async () => {
    vi.mocked(getPopcornTimeWatchLinks).mockResolvedValue([]);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([]);
    expect(await getProviderWatchLinks('movie', 1, 'Title', 'SE', undefined)).toEqual([]);
  });
});
