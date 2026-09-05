import { PgDialect } from 'drizzle-orm/pg-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { execute: vi.fn() } }));
vi.mock('@/lib/movies', () => ({ getMovieDetails: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowDetails: vi.fn() }));
vi.mock('@/lib/persons', () => ({ getPersonDetails: vi.fn() }));

import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { getPersonDetails } from '@/lib/persons';
import { getTvShowDetails } from '@/lib/tv-shows';

import {
  CANDIDATE_LIMIT,
  FUZZY_QUERY_TIMEOUT_MS,
  fuzzyQuery,
  MIN_FUZZY_QUERY_LENGTH,
  MIN_SIMILARITY,
  searchIndexFuzzy,
  searchIndexResults,
} from './search-index';

function render(query: string, options: { mediaType?: 'movie' | 'tv' | 'person'; limit: number }) {
  const rendered = new PgDialect().sqlToQuery(fuzzyQuery(query, options));
  return { sql: rendered.sql.replace(/\s+/g, ' ').trim(), params: rendered.params };
}

function rows(list: Record<string, unknown>[]) {
  return { rows: list } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fuzzyQuery', () => {
  it('pulls nearest neighbours by both trigram distances straight from the index', () => {
    const { sql, params } = render('intersteller', { limit: 5 });

    expect(sql).toContain('order by "search_index"."search_title" <-> $1::text limit');
    expect(sql).toContain('<<-> "search_index"."search_title" limit');
    expect(params.filter((param) => param === CANDIDATE_LIMIT)).toHaveLength(2);
    // Two candidate scans, unioned so a title found by both appears once.
    expect(sql.match(/\) union \(/g)).toHaveLength(1);
  });

  it('re-ranks candidates by similarity, prefix boost, and log popularity', () => {
    const { sql, params } = render('inter', { limit: 5 });

    expect(sql).toContain('greatest(similarity(search_title, $');
    expect(sql).toContain('word_similarity($');
    expect(sql).toContain('case when search_title like $');
    expect(sql).toContain('similarity + prefix_boost + 0.05 * ln(1 + popularity) as score');
    expect(sql).toContain('order by score desc, popularity desc limit');
    expect(params).toContain('inter%');
    expect(params).toContain(MIN_SIMILARITY);
    expect(params[params.length - 1]).toBe(5);
  });

  it('applies the media type filter inside both candidate scans', () => {
    const { sql, params } = render('brad pit', { mediaType: 'person', limit: 5 });

    expect(sql.match(/where "search_index"."media_type" = \$\d+::text/g)).toHaveLength(2);
    expect(params.filter((param) => param === 'person')).toHaveLength(2);
  });

  it('omits the filter when no media type is given', () => {
    const { sql } = render('brad pit', { limit: 5 });

    expect(sql).not.toContain('media_type" =');
  });
});

describe('searchIndexFuzzy', () => {
  it('returns nothing for queries too short to trigram-match, without querying', async () => {
    expect(MIN_FUZZY_QUERY_LENGTH).toBe(3);

    await expect(searchIndexFuzzy('ab', { limit: 5 })).resolves.toEqual([]);
    await expect(searchIndexFuzzy('  ', { limit: 5 })).resolves.toEqual([]);
    await expect(searchIndexFuzzy('!!!', { limit: 5 })).resolves.toEqual([]);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('maps rows to hits with numeric similarity and score', async () => {
    vi.mocked(db.execute).mockResolvedValue(
      rows([
        {
          tmdb_id: 157336,
          media_type: 'movie',
          title: 'Interstellar',
          popularity: 120,
          similarity: '0.77',
          score: '1.4',
        },
      ]),
    );

    await expect(searchIndexFuzzy('Intersteller', { limit: 5 })).resolves.toEqual([
      {
        tmdbId: 157336,
        mediaType: 'movie',
        title: 'Interstellar',
        popularity: 120,
        similarity: 0.77,
        score: 1.4,
      },
    ]);
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it('folds the query before searching', async () => {
    vi.mocked(db.execute).mockResolvedValue(rows([]));

    await searchIndexFuzzy('  Amélie! ', { limit: 5 });

    const statement = vi.mocked(db.execute).mock.calls[0][0];
    const { params } = new PgDialect().sqlToQuery(statement as never);
    expect(params).toContain('amelie');
    expect(params).toContain('amelie%');
  });

  describe('when the database is slow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('gives up after the timeout and returns nothing', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(db.execute).mockReturnValue(new Promise(() => {}) as never);

      const pending = searchIndexFuzzy('intersteller', { limit: 5 });
      await vi.advanceTimersByTimeAsync(FUZZY_QUERY_TIMEOUT_MS);

      await expect(pending).resolves.toEqual([]);
      expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('did not answer'));
      consoleWarn.mockRestore();
    });

    it('returns the rows when the database answers in time', async () => {
      vi.mocked(db.execute).mockResolvedValue(rows([]));

      await expect(searchIndexFuzzy('intersteller', { limit: 5 })).resolves.toEqual([]);
    });
  });
});

describe('searchIndexResults', () => {
  const hits = [
    { tmdb_id: 1, media_type: 'movie', title: 'A', popularity: 1, similarity: 1, score: 1 },
    { tmdb_id: 2, media_type: 'tv', title: 'B', popularity: 1, similarity: 1, score: 0.9 },
    { tmdb_id: 3, media_type: 'person', title: 'C', popularity: 1, similarity: 1, score: 0.8 },
  ];

  beforeEach(() => {
    vi.mocked(db.execute).mockResolvedValue(rows(hits));
    vi.mocked(getMovieDetails).mockResolvedValue({
      id: 1,
      title: 'A',
      poster_path: '/a.jpg',
      release_date: '2020-01-01',
      genres: [{ id: 18, name: 'Drama' }],
      vote_average: 7,
      popularity: 1,
    } as never);
    vi.mocked(getTvShowDetails).mockResolvedValue({
      id: 2,
      name: 'B',
      poster_path: '/b.jpg',
      first_air_date: '2019-01-01',
      genres: [],
      origin_country: ['US'],
    } as never);
    vi.mocked(getPersonDetails).mockResolvedValue({
      id: 3,
      name: 'C',
      profile_path: null,
      known_for_department: 'Acting',
    } as never);
  });

  it('hydrates each hit into the multi-search shape, preserving rank', async () => {
    const results = await searchIndexResults('abc', { limit: 5 });

    expect(results.map((result) => [result.media_type, result.id])).toEqual([
      ['movie', 1],
      ['tv', 2],
      ['person', 3],
    ]);
    expect(results[0]).toMatchObject({
      media_type: 'movie',
      title: 'A',
      release_date: '2020-01-01',
      genre_ids: [18],
    });
    expect(results[1]).toMatchObject({ media_type: 'tv', name: 'B', genre_ids: [] });
    expect(results[2]).toMatchObject({
      media_type: 'person',
      name: 'C',
      known_for_department: 'Acting',
      known_for: [],
    });
  });

  it('drops hits whose details fetch fails instead of failing the search', async () => {
    vi.mocked(getTvShowDetails).mockRejectedValue(new Error('gone'));

    const results = await searchIndexResults('abc', { limit: 5 });

    expect(results.map((result) => result.id)).toEqual([1, 3]);
  });

  it('returns nothing without hydrating when the index has no hits', async () => {
    vi.mocked(db.execute).mockResolvedValue(rows([]));

    await expect(searchIndexResults('zzz', { limit: 5 })).resolves.toEqual([]);
    expect(getMovieDetails).not.toHaveBeenCalled();
  });
});
