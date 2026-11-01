import { describe, expect, it } from 'vite-plus/test';

import type { DirectWatchOffer } from '@/types/watch-provider';

import { getDirectWatchUrl, getTmdbWatchUrl } from './watch-links';

const offer: DirectWatchOffer = {
  providerName: 'Netflix',
  region: 'US',
  type: 'flatrate',
  url: 'https://www.netflix.com/title/123',
};

describe('watch link matching', () => {
  it('requires the exact region, service and offer type', () => {
    expect(getDirectWatchUrl([offer], 'Netflix', 'US', 'flatrate')).toBe(offer.url);
    expect(getDirectWatchUrl([offer], 'Netflix', 'SE', 'flatrate')).toBeUndefined();
    expect(getDirectWatchUrl([offer], 'Netflix', 'US', 'rent')).toBeUndefined();
    expect(
      getDirectWatchUrl([offer], 'Netflix Standard with Ads', 'US', 'flatrate'),
    ).toBeUndefined();
    expect(getDirectWatchUrl([], 'Netflix', 'US', 'flatrate')).toBeUndefined();
  });

  it('matches equivalent Prime names without merging channel bundles', () => {
    const prime = { ...offer, providerName: 'Amazon Prime' };
    expect(getDirectWatchUrl([prime], 'Amazon Prime Video', 'US', 'flatrate')).toBe(offer.url);
    expect(getDirectWatchUrl([prime], 'Prime Video', 'US', 'flatrate')).toBe(offer.url);
    expect(getDirectWatchUrl([prime], 'Amazon Video', 'US', 'flatrate')).toBeUndefined();
    expect(
      getDirectWatchUrl([prime], 'Paramount+ Amazon Channel', 'US', 'flatrate'),
    ).toBeUndefined();
  });

  it('preserves regional TMDB links and builds country-specific movie and TV fallbacks', () => {
    const link = 'https://www.themoviedb.org/movie/1/watch?locale=SE';
    expect(getTmdbWatchUrl('movie', 1, 'SE', link)).toBe(link);
    expect(getTmdbWatchUrl('movie', 1, 'US')).toBe(
      'https://www.themoviedb.org/movie/1/watch?locale=US',
    );
    expect(getTmdbWatchUrl('tv', 2, 'SE', '')).toBe(
      'https://www.themoviedb.org/tv/2/watch?locale=SE',
    );
  });

  it.each([
    'invalid',
    'javascript:alert(1)',
    'https://example.com',
    'https://www.themoviedb.org.evil.com',
    'https://user@www.themoviedb.org',
  ])('rejects invalid TMDB links: %s', (link) => {
    expect(getTmdbWatchUrl('tv', 2, 'SE', link)).toBe(
      'https://www.themoviedb.org/tv/2/watch?locale=SE',
    );
  });
});
