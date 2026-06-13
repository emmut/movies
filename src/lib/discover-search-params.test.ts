import { describe, expect, it } from 'vitest';

import { loadDiscoverSearchParams } from './discover-search-params';

describe('loadDiscoverSearchParams', () => {
  it('applies defaults when no params are present', () => {
    expect(loadDiscoverSearchParams({})).toEqual({
      page: 1,
      genreId: 0,
      mediaType: 'movie',
      sort_by: 'popularity.desc',
      with_watch_providers: [],
      watch_region: null,
      runtime: null,
    });
  });

  it('parses provided params, including comma-separated provider ids', () => {
    expect(
      loadDiscoverSearchParams({
        page: '3',
        genreId: '28',
        mediaType: 'tv',
        sort_by: 'vote_average.desc',
        with_watch_providers: '8,9',
        watch_region: 'US',
        runtime: '120',
      }),
    ).toEqual({
      page: 3,
      genreId: 28,
      mediaType: 'tv',
      sort_by: 'vote_average.desc',
      with_watch_providers: [8, 9],
      watch_region: 'US',
      runtime: 120,
    });
  });

  it('falls back to the default media type for values outside the literal set', () => {
    expect(loadDiscoverSearchParams({ mediaType: 'book' }).mediaType).toBe('movie');
  });

  it('falls back to default page for a non-integer value', () => {
    expect(loadDiscoverSearchParams({ page: 'abc' }).page).toBe(1);
  });
});
