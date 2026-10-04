import { describe, expect, it } from 'vitest';

import { parseSearchQuery } from './parse-search-query';

describe('parseSearchQuery years', () => {
  it('extracts a trailing year', () => {
    expect(parseSearchQuery('heat 1995')).toEqual({ title: 'heat', year: 1995 });
  });

  it('extracts a parenthesized trailing year', () => {
    expect(parseSearchQuery('heat (1995)')).toEqual({ title: 'heat', year: 1995 });
  });

  it('returns the trimmed query as title when no year is present', () => {
    expect(parseSearchQuery('  the matrix  ')).toEqual({ title: 'the matrix' });
  });

  it('keeps a leading year as part of the title', () => {
    expect(parseSearchQuery('2001: A Space Odyssey')).toEqual({
      title: '2001: A Space Odyssey',
    });
  });

  it('keeps a query that is only a year as the title', () => {
    expect(parseSearchQuery('1917')).toEqual({ title: '1917' });
  });

  it('keeps implausibly old numbers as part of the title', () => {
    expect(parseSearchQuery('area 1500')).toEqual({ title: 'area 1500' });
  });

  it('keeps far-future numbers as part of the title', () => {
    expect(parseSearchQuery('blade runner 2049', 2027)).toEqual({
      title: 'blade runner 2049',
    });
  });

  it('accepts next year as a valid year', () => {
    expect(parseSearchQuery('dune 2027', 2027)).toEqual({ title: 'dune', year: 2027 });
  });

  it('defaults maxYear to next calendar year', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(parseSearchQuery(`dune ${nextYear}`)).toEqual({ title: 'dune', year: nextYear });
    expect(parseSearchQuery(`dune ${nextYear + 1}`)).toEqual({ title: `dune ${nextYear + 1}` });
  });

  it('uses the last number when several trail the title', () => {
    expect(parseSearchQuery('star wars 1977 1977')).toEqual({
      title: 'star wars 1977',
      year: 1977,
    });
  });

  it('handles an empty query', () => {
    expect(parseSearchQuery('')).toEqual({ title: '' });
  });
});

describe('parseSearchQuery media types', () => {
  it('extracts a trailing movie keyword', () => {
    expect(parseSearchQuery('heat movie')).toEqual({ title: 'heat', mediaType: 'movie' });
  });

  it('matches fuzzy movie variants', () => {
    expect(parseSearchQuery('heat movi')).toEqual({ title: 'heat', mediaType: 'movie' });
    expect(parseSearchQuery('heat movies')).toEqual({ title: 'heat', mediaType: 'movie' });
  });

  it('is case-insensitive', () => {
    expect(parseSearchQuery('Heat MOVIE')).toEqual({ title: 'Heat', mediaType: 'movie' });
  });

  it('extracts tv and its variants', () => {
    expect(parseSearchQuery('the office tv')).toEqual({ title: 'the office', mediaType: 'tv' });
    expect(parseSearchQuery('the office tvshow')).toEqual({
      title: 'the office',
      mediaType: 'tv',
    });
    expect(parseSearchQuery('the office tv-show')).toEqual({
      title: 'the office',
      mediaType: 'tv',
    });
  });

  it('extracts two-token tv suffixes', () => {
    expect(parseSearchQuery('the office tv show')).toEqual({
      title: 'the office',
      mediaType: 'tv',
    });
    expect(parseSearchQuery('the office tv series')).toEqual({
      title: 'the office',
      mediaType: 'tv',
    });
  });

  it('extracts person keywords', () => {
    expect(parseSearchQuery('brad pitt person')).toEqual({
      title: 'brad pitt',
      mediaType: 'person',
    });
    expect(parseSearchQuery('brad pitt persons')).toEqual({
      title: 'brad pitt',
      mediaType: 'person',
    });
  });

  it('combines a year and a media type in either order', () => {
    expect(parseSearchQuery('heat 1995 movie')).toEqual({
      title: 'heat',
      year: 1995,
      mediaType: 'movie',
    });
    expect(parseSearchQuery('heat movie 1995')).toEqual({
      title: 'heat',
      year: 1995,
      mediaType: 'movie',
    });
    expect(parseSearchQuery('the office tv 2005')).toEqual({
      title: 'the office',
      year: 2005,
      mediaType: 'tv',
    });
  });

  it('keeps a keyword-only query as the title', () => {
    expect(parseSearchQuery('movie')).toEqual({ title: 'movie' });
    expect(parseSearchQuery('tv show')).toEqual({ title: 'tv show' });
  });

  it('does not treat ambiguous title words as keywords', () => {
    expect(parseSearchQuery('the truman show')).toEqual({ title: 'the truman show' });
    expect(parseSearchQuery('ordinary people')).toEqual({ title: 'ordinary people' });
    expect(parseSearchQuery('this is not a film')).toEqual({ title: 'this is not a film' });
  });

  it('strips at most one media-type keyword', () => {
    expect(parseSearchQuery('heat movie movie')).toEqual({
      title: 'heat movie',
      mediaType: 'movie',
    });
  });
});
