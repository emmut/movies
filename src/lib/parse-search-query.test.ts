import { describe, expect, it } from 'vitest';

import { parseSearchQuery } from './parse-search-query';

describe('parseSearchQuery', () => {
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
