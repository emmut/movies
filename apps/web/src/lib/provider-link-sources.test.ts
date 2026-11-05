import { describe, expect, it } from 'vite-plus/test';

import { getDirectWatchUrl } from '@/lib/watch-links';
import type { DirectWatchLink, WatchTitleContext } from '@/types/watch-provider';

import {
  homepageWatchLinks,
  needsAppleCatalogue,
  primaryWatchLinks,
} from './provider-link-sources';

const context: WatchTitleContext = {
  type: 'movie',
  id: 1,
  title: 'Example',
  originalTitle: 'Example',
  releaseDate: '2024-01-01',
  homepage: 'https://www.netflix.com/title/80057281',
};
const store = {
  provider_id: 2,
  provider_name: 'Apple TV Store',
  logo_path: '/logo.png',
  display_priority: 1,
};
const apple: DirectWatchLink = {
  providerId: 2,
  regions: ['SE'],
  types: ['rent', 'buy'],
  url: 'https://itunes.apple.com/se/movie/id1735930123',
};

describe('free direct-link sources', () => {
  it('accepts only reviewed provider title routes from TMDB homepages', () => {
    expect(homepageWatchLinks(context, 'SE')).toContainEqual({
      providerId: 8,
      types: ['flatrate'],
      regions: ['SE'],
      url: context.homepage,
      source: 'tmdb-homepage',
    });
    for (const homepage of [
      null,
      'https://www.netflix.com/',
      'https://marketing.example/film',
      'javascript:alert(1)',
    ]) {
      expect(homepageWatchLinks({ ...context, homepage }, 'SE')).toEqual([]);
    }
  });

  it('gives verified Wikidata links priority over homepage fallbacks', () => {
    const wikidata = [
      {
        providerId: 8,
        types: ['flatrate'] as const,
        url: 'https://www.netflix.com/title/12345678',
      },
    ];
    const links = primaryWatchLinks(
      wikidata.map((link) => ({ ...link, types: [...link.types] })),
      homepageWatchLinks(context, 'SE'),
    );
    expect(getDirectWatchUrl(links, 8, 'SE', 'flatrate')).toBe(wikidata[0].url);
    expect(links[0].source).toBe('wikidata');
  });

  it('searches Apple only for an unresolved reported store offer', () => {
    expect(
      needsAppleCatalogue(
        { link: 'https://www.themoviedb.org/movie/1/watch', rent: [store] },
        [],
        'SE',
      ),
    ).toBe(true);
    expect(
      needsAppleCatalogue(
        { link: 'https://www.themoviedb.org/movie/1/watch', buy: [store] },
        [apple],
        'SE',
      ),
    ).toBe(false);
    expect(
      needsAppleCatalogue(
        { link: 'https://www.themoviedb.org/movie/1/watch', buy: [store] },
        [apple],
        'US',
      ),
    ).toBe(true);
    expect(
      needsAppleCatalogue(
        { link: 'https://www.themoviedb.org/movie/1/watch', rent: [store], buy: [store] },
        [{ ...apple, types: ['rent'] }],
        'SE',
      ),
    ).toBe(true);
    expect(needsAppleCatalogue(undefined, [], 'SE')).toBe(false);
    expect(
      needsAppleCatalogue(
        { link: 'https://www.themoviedb.org/movie/1/watch', flatrate: [store] },
        [],
        'SE',
      ),
    ).toBe(false);
    expect(
      needsAppleCatalogue(
        {
          link: 'https://www.themoviedb.org/movie/1/watch',
          buy: [
            { ...store, provider_id: 350 },
            { ...store, provider_id: 2243 },
          ],
        },
        [],
        'SE',
      ),
    ).toBe(false);
  });
});
