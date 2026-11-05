import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/apple-catalogue', () => ({ getAppleCatalogueLinks: vi.fn() }));

import { getAppleCatalogueLinks } from '@/lib/apple-catalogue';
import { getDirectWatchLink } from '@/lib/watch-links';
import type {
  DirectWatchLink,
  RegionWatchProviders,
  ResolvedWatchLink,
  WatchTitleContext,
} from '@/types/watch-provider';

import { getMarketFallbackWatchLinks } from './watch-link-fallbacks';

const context: WatchTitleContext = {
  type: 'movie',
  id: 1,
  title: 'Example',
  originalTitle: 'Example',
  releaseDate: '2024-01-01',
  homepage: null,
};
function provider(id: number) {
  return {
    provider_id: id,
    provider_name: `Provider ${id}`,
    display_priority: 1,
    logo_path: '/logo.png',
  };
}
const providers: RegionWatchProviders = {
  link: 'https://www.themoviedb.org/movie/1/watch',
  flatrate: [provider(8)],
  buy: [provider(2)],
  rent: [provider(2)],
};
const netflix: ResolvedWatchLink = {
  providerId: 8,
  types: ['flatrate'],
  regions: ['US'],
  url: 'https://www.netflix.com/title/80057281',
  source: 'wikidata',
};
const apple: DirectWatchLink = {
  providerId: 2,
  types: ['rent', 'buy'],
  regions: ['US'],
  url: 'https://itunes.apple.com/us/movie/id1735930123',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getAppleCatalogueLinks).mockResolvedValue([]);
});

describe('country fallback order', () => {
  it('does not query another market once every local offer is resolved', async () => {
    const local: ResolvedWatchLink[] = [
      { ...netflix, regions: ['SE'] },
      { ...apple, regions: ['SE'], source: 'apple' },
    ];
    expect(await getMarketFallbackWatchLinks(context, 'SE', providers, local)).toEqual(local);
    expect(getAppleCatalogueLinks).not.toHaveBeenCalled();
  });

  it('prefers a local Apple match over US Wikidata, filling only the remaining provider', async () => {
    const local: ResolvedWatchLink[] = [
      { ...apple, regions: ['SE'], source: 'apple' },
      netflix,
      { ...apple, source: 'wikidata' },
    ];
    const links = await getMarketFallbackWatchLinks(context, 'SE', providers, local);
    expect(getDirectWatchLink(links, 2, 'SE', 'buy')).toEqual(local[0]);
    expect(getDirectWatchLink(links, 8, 'SE', 'flatrate')).toMatchObject({
      fallbackRegion: 'US',
      source: 'wikidata',
    });
    expect(getAppleCatalogueLinks).not.toHaveBeenCalled();
  });

  it('exhausts US sources before GB, and fills gaps per offer', async () => {
    vi.mocked(getAppleCatalogueLinks).mockResolvedValue([{ ...apple, types: ['buy'] }]);
    const british: ResolvedWatchLink = {
      ...apple,
      types: ['rent', 'buy'],
      regions: ['GB'],
      source: 'wikidata',
      url: 'https://itunes.apple.com/gb/movie/id1735930124',
    };
    const links = await getMarketFallbackWatchLinks(context, 'SE', providers, [netflix, british]);
    expect(getAppleCatalogueLinks).toHaveBeenCalledExactlyOnceWith(context, 'US');
    expect(getDirectWatchLink(links, 2, 'SE', 'buy')).toMatchObject({
      ...apple,
      types: ['buy'],
      regions: ['SE'],
      source: 'apple',
      fallbackRegion: 'US',
    });
    expect(getDirectWatchLink(links, 2, 'SE', 'rent')).toMatchObject({
      ...british,
      types: ['rent'],
      regions: ['SE'],
      fallbackRegion: 'GB',
    });
  });

  it('uses GB only after the US catalogue has no match', async () => {
    vi.mocked(getAppleCatalogueLinks).mockImplementation(async (_context, region) =>
      region === 'US'
        ? []
        : [{ ...apple, regions: ['GB'], url: 'https://itunes.apple.com/gb/movie/id1735930124' }],
    );
    const links = await getMarketFallbackWatchLinks(
      context,
      'SE',
      { ...providers, flatrate: [] },
      [],
    );
    expect(vi.mocked(getAppleCatalogueLinks).mock.calls.map((call) => call[1])).toEqual([
      'US',
      'GB',
    ]);
    expect(getDirectWatchLink(links, 2, 'SE', 'buy')).toMatchObject({ fallbackRegion: 'GB' });
  });

  it('can use a reviewed US homepage without an Apple search', async () => {
    const onlyNetflix = { ...providers, buy: [], rent: [] };
    const links = await getMarketFallbackWatchLinks(
      { ...context, homepage: netflix.url },
      'SE',
      onlyNetflix,
      [],
    );
    expect(links[0]).toMatchObject({
      providerId: 8,
      source: 'tmdb-homepage',
      fallbackRegion: 'US',
    });
    expect(getAppleCatalogueLinks).not.toHaveBeenCalled();
  });

  it('does not invent local offers or substitute subscriptions for purchases/channels', async () => {
    const candidates: ResolvedWatchLink[] = [
      { ...netflix, providerId: 119 },
      { ...apple, providerId: 350, source: 'wikidata' },
    ];
    const links = await getMarketFallbackWatchLinks(undefined, 'SE', providers, candidates);
    expect(links).toEqual(candidates);
    expect(getDirectWatchLink(links, 2, 'SE', 'buy')).toBeUndefined();
    expect(getDirectWatchLink(links, 8, 'SE', 'flatrate')).toBeUndefined();
    expect(getAppleCatalogueLinks).not.toHaveBeenCalled();
    expect(await getMarketFallbackWatchLinks(context, 'SE', undefined, [])).toEqual([]);
  });

  it.each([
    ['US', 'GB'],
    ['GB', 'US'],
  ] as const)('does not repeat the selected %s catalogue', async (region, expected) => {
    await getMarketFallbackWatchLinks(context, region, providers, []);
    expect(getAppleCatalogueLinks).toHaveBeenCalledExactlyOnceWith(context, expected);
  });
});
