import { describe, expect, it } from 'vitest';
import { SYSTEM_LIST_COPY, SYSTEM_LIST_MEDIA } from './system-list-copy';

describe('system list copy', () => {
  it('keeps the web watchlist hint and lets native name its own interaction', () => {
    const { watchlist } = SYSTEM_LIST_COPY;
    expect(watchlist.emptyHintAll('movies')).toBe(
      'Start adding movies by clicking the star on any detail page',
    );
    expect(watchlist.emptyHintAll('movies', 'tapping')).toBe(
      'Start adding movies by tapping the star on any detail page',
    );
    expect(watchlist.emptyTitleMedia('movies')).toBe('No movies in your watchlist');
    expect(watchlist.emptyHintMedia('movies')).toBe('Add some movies to see them here');
  });
  it('words the watched hints without an interaction verb', () => {
    const { watched } = SYSTEM_LIST_COPY;
    const allHint = 'Mark TV shows as watched from any detail page to track them here';
    expect(watched.emptyHintAll('TV shows')).toBe(allHint);
    expect(watched.emptyHintAll('TV shows', 'tapping')).toBe(allHint);
    expect(watched.emptyTitleMedia('TV shows')).toBe('No TV shows watched yet');
    expect(watched.emptyHintMedia('TV shows')).toBe('Mark some TV shows as watched to see them here');
  });
  it('labels media tabs without the explore prefix', () => {
    expect(SYSTEM_LIST_MEDIA.movie.tabLabel).toBe('Movies');
    expect(SYSTEM_LIST_MEDIA.tv.tabLabel).toBe('TV Shows');
  });
});
