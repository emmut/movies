import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/popcorntime', () => ({ getPopcorntimeWatchLinks: vi.fn() }));
vi.mock('@/lib/wikidata', () => ({ getWikidataWatchLinks: vi.fn() }));

import { getPopcorntimeWatchLinks } from '@/lib/popcorntime';
import { getWikidataWatchLinks } from '@/lib/wikidata';
import type { DirectWatchLink } from '@/types/watch-provider';

import { getDirectWatchLinks } from './direct-watch-links';
import { getDirectWatchLink } from './watch-links';

const popcorn: DirectWatchLink = {
  source: 'popcorntime',
  providerId: 8,
  regions: ['SE'],
  types: ['flatrate'],
  url: 'https://popcorntime.app/go/test',
};
const wikidata: DirectWatchLink = {
  source: 'wikidata',
  providerId: 8,
  types: ['flatrate'],
  url: 'https://www.netflix.com/title/123',
};

beforeEach(() => vi.clearAllMocks());

describe('direct watch link sources', () => {
  it('prefers an exact regional offer and keeps Wikidata for other markets', async () => {
    vi.mocked(getPopcorntimeWatchLinks).mockResolvedValue([popcorn]);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([wikidata]);
    const links = await getDirectWatchLinks('movie', 123);
    expect(getDirectWatchLink(links, 8, 'SE', 'flatrate')).toBe(popcorn);
    expect(getDirectWatchLink(links, 8, 'US', 'flatrate')).toBe(wikidata);
    expect(getDirectWatchLink(links, 8, 'SE', 'rent')).toBeUndefined();
    expect(getPopcorntimeWatchLinks).toHaveBeenCalledWith('movie', 123);
    expect(getWikidataWatchLinks).toHaveBeenCalledWith('movie', 123);
  });

  it('retains Wikidata when no snapshot has been imported', async () => {
    vi.mocked(getPopcorntimeWatchLinks).mockResolvedValue([]);
    vi.mocked(getWikidataWatchLinks).mockResolvedValue([wikidata]);
    expect(await getDirectWatchLinks('tv', 123)).toEqual([wikidata]);
  });
});
