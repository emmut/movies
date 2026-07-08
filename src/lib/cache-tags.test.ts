import { describe, expect, it } from 'vitest';

import { CACHE_TAGS } from './cache-tags';

// These tags are persisted cache keys: a silent format change would orphan
// existing cache entries and break revalidation. Lock the exact shape.
describe('CACHE_TAGS public', () => {
  it('produces stable static tags', () => {
    expect(CACHE_TAGS.public.home.trendingMovies).toBe('public:home:trending:movies');
    expect(CACHE_TAGS.public.discover.tv).toBe('public:discover:tv');
    expect(CACHE_TAGS.public.genres.movies).toBe('public:genres:movies');
  });

  it('lowercases the watch-provider region', () => {
    expect(CACHE_TAGS.public.watchProvidersByRegion('SE')).toBe('public:watch-providers:se');
    expect(CACHE_TAGS.public.watchProvidersByRegion('us')).toBe('public:watch-providers:us');
  });

  it('builds resource-scoped tags', () => {
    expect(CACHE_TAGS.public.movie.details(42)).toBe('public:movie:42:details');
    expect(CACHE_TAGS.public.tv.imdbId(7)).toBe('public:tv:7:imdb-id');
    expect(CACHE_TAGS.public.person.movieCredits(9)).toBe('public:person:9:movie-credits');
  });
});

describe('CACHE_TAGS private', () => {
  it('scopes tags by user', () => {
    expect(CACHE_TAGS.private.userRegion('u1')).toBe('private:user:u1:region');
    expect(CACHE_TAGS.private.lists('u1')).toBe('private:user:u1:lists');
    expect(CACHE_TAGS.private.listDetails('u1', 'l1')).toBe('private:user:u1:list:l1');
  });

  it('builds watchlist and list-status tags with resource scope', () => {
    expect(CACHE_TAGS.private.watchlistItem('u1', 'movie', 5)).toBe(
      'private:user:u1:watchlist:movie:5',
    );
    expect(CACHE_TAGS.private.listStatus('u1', 'tv', 8)).toBe('private:user:u1:list-status:tv:8');
  });

  it('builds watched tags with resource scope', () => {
    expect(CACHE_TAGS.private.watchedItem('u1', 'movie', 5)).toBe(
      'private:user:u1:watched:movie:5',
    );
    expect(CACHE_TAGS.private.watchedList('u1', 'tv')).toBe('private:user:u1:watched-list:tv');
    expect(CACHE_TAGS.private.watchedCount('u1', 'movie')).toBe(
      'private:user:u1:watched-count:movie',
    );
  });

  it('separates a user’s tags from another user’s', () => {
    expect(CACHE_TAGS.private.lists('a')).not.toBe(CACHE_TAGS.private.lists('b'));
  });
});
