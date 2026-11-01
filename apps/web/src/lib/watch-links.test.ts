import { describe, expect, it } from 'vite-plus/test';

import type { DirectWatchLink } from '@/types/watch-provider';

import { getDirectWatchUrl, getTmdbWatchUrl } from './watch-links';

const link: DirectWatchLink = {
  providerId: 8,
  types: ['flatrate'],
  url: 'https://www.netflix.com/title/80057281',
};

describe('watch link matching', () => {
  it('matches exact provider IDs and offer types only', () => {
    expect(getDirectWatchUrl([link], 8, 'US', 'flatrate')).toBe(link.url);
    expect(getDirectWatchUrl([link], 8, 'SE', 'flatrate')).toBe(link.url);
    expect(getDirectWatchUrl([link], 8, 'US', 'rent')).toBeUndefined();
    expect(getDirectWatchUrl([link], 1796, 'US', 'flatrate')).toBeUndefined();
    expect(getDirectWatchUrl([], 8, 'US', 'flatrate')).toBeUndefined();
  });

  it('does not reuse market-specific identifiers in other regions', () => {
    const usOnly = { ...link, regions: ['US'] };
    expect(getDirectWatchUrl([usOnly], 8, 'US', 'flatrate')).toBe(link.url);
    expect(getDirectWatchUrl([usOnly], 8, 'SE', 'flatrate')).toBeUndefined();
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
