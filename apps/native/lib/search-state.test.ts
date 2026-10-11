import { catalogPath } from '@native/lib/catalog-navigation';
import { readSearchState } from '@native/lib/search-state';
import { describe, expect, it } from 'vitest';

describe('native search context', () => {
  it('keeps media choice before a query has been submitted', () => {
    expect(readSearchState({ mediaType: 'person' })).toEqual({
      query: '',
      type: 'person',
      page: 1,
    });
  });
  it('preserves independent valid filters when a deep-link bound is malformed', () => {
    expect(readSearchState({ q: [' Alien '], mediaType: 'movie', page: '501' })).toEqual({
      query: 'Alien',
      type: 'movie',
      page: 1,
    });
  });
  it('handles missing/invalid types, whitespace and query length', () => {
    expect(readSearchState({ q: ' ', mediaType: 'invalid' })).toEqual({
      query: '',
      type: 'all',
      page: 1,
    });
    expect(readSearchState({ q: 'a'.repeat(600), page: '2' }).query).toHaveLength(500);
  });
  it.each([
    ['/search', '/search/[type]/[id]'],
    ['/search/person/7', '/search/[type]/[id]'],
    ['/discover', '/discover/[type]/[id]'],
    ['/movie/42', '/[type]/[id]'],
  ])('keeps result navigation inside its source stack %s', (source, destination) => {
    expect(catalogPath(source)).toBe(destination);
  });
});
