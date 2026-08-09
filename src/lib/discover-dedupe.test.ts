import { describe, expect, it } from 'vitest';

import type { DiscoverResult } from '@/lib/discover-client';
import type { Movie } from '@/types/movie';

import { dedupeDiscoverResults } from './discover-dedupe';

function movie(id: number): Movie {
  return {
    adult: false,
    backdrop_path: '',
    id,
    title: `Movie ${id}`,
    original_language: 'en',
    original_title: `Movie ${id}`,
    overview: '',
    poster_path: null,
    media_type: 'movie',
    genre_ids: [],
    popularity: 1,
    release_date: '2024-01-01',
    video: false,
    vote_average: 7,
    vote_count: 100,
  };
}

function page(...ids: number[]): DiscoverResult {
  return { results: ids.map(movie), totalPages: 10 };
}

describe('dedupeDiscoverResults', () => {
  it('removes results already present on the previous page', () => {
    const current = page(20, 21, 22);
    const deduped = dedupeDiscoverResults(current, page(1, 2, 20).results);

    expect(deduped.results.map((result) => result.id)).toEqual([21, 22]);
    expect(deduped.totalPages).toBe(current.totalPages);
  });

  it('returns the same reference when there is no overlap', () => {
    const current = page(21, 22);

    expect(dedupeDiscoverResults(current, page(1, 2).results)).toBe(current);
  });

  it('returns the same reference when the previous page is unknown or empty', () => {
    const current = page(1, 2);

    expect(dedupeDiscoverResults(current, undefined)).toBe(current);
    expect(dedupeDiscoverResults(current, [])).toBe(current);
  });

  it('does not mutate the current page when filtering', () => {
    const current = page(20, 21);
    dedupeDiscoverResults(current, page(20).results);

    expect(current.results.map((result) => result.id)).toEqual([20, 21]);
  });
});
