import { describe, expect, it } from 'vite-plus/test';

import type { DirectWatchLink } from '@/types/watch-provider';

import { getDirectWatchLink, getTmdbWatchUrl } from './watch-links';

const link: DirectWatchLink = {
  source: 'wikidata',
  providerId: 8,
  types: ['flatrate'],
  url: 'https://www.netflix.com/title/80057281',
};

describe('watch link matching', () => {
  it('matches exact provider IDs and offer types only', () => {
    expect(getDirectWatchLink([link], 8, 'US', 'flatrate')?.url).toBe(link.url);
    expect(getDirectWatchLink([link], 8, 'SE', 'flatrate')?.url).toBe(link.url);
    expect(getDirectWatchLink([link], 8, 'US', 'rent')?.url).toBeUndefined();
    expect(getDirectWatchLink([link], 1796, 'US', 'flatrate')?.url).toBeUndefined();
    expect(getDirectWatchLink([], 8, 'US', 'flatrate')?.url).toBeUndefined();
  });

  it('does not reuse market-specific identifiers in other regions', () => {
    const usOnly = { ...link, regions: ['US'] };
    expect(getDirectWatchLink([usOnly], 8, 'US', 'flatrate')?.url).toBe(link.url);
    expect(getDirectWatchLink([usOnly], 8, 'SE', 'flatrate')?.url).toBeUndefined();
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
