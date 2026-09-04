import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { select: vi.fn() } }));
vi.mock('@/lib/movies', () => ({ getMovieDetails: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowDetails: vi.fn() }));
vi.mock('@/lib/persons', () => ({ getPersonDetails: vi.fn() }));

import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { getPersonDetails } from '@/lib/persons';
import { getTvShowDetails } from '@/lib/tv-shows';
import { chain } from '@/test/db-chain';

import {
  fuzzyMatch,
  fuzzyScore,
  fuzzySimilarity,
  MIN_FUZZY_QUERY_LENGTH,
  searchIndexFuzzy,
  searchIndexResults,
} from './search-index';

function render(fragment: SQL) {
  const query = new PgDialect().sqlToQuery(fragment);
  return { sql: query.sql.replace(/\s+/g, ' '), params: query.params };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SQL fragments', () => {
  it('fuzzySimilarity takes the better of trigram and word similarity', () => {
    const { sql, params } = render(fuzzySimilarity('interst'));

    expect(sql).toBe(
      'greatest(similarity("search_index"."search_title", $1::text), word_similarity($2::text, "search_index"."search_title"))',
    );
    expect(params).toEqual(['interst', 'interst']);
  });

  it('fuzzyMatch uses both index-backed trigram operators', () => {
    const { sql, params } = render(fuzzyMatch('interst')!);

    expect(sql).toContain('"search_index"."search_title" % $1::text');
    expect(sql).toContain('$2::text <% "search_index"."search_title"');
    expect(params).toEqual(['interst', 'interst']);
  });

  it('fuzzyScore adds a prefix boost and a log-popularity term', () => {
    const { sql, params } = render(fuzzyScore('inter'));

    expect(sql).toContain(
      'case when "search_index"."search_title" like $3::text then 0.25 else 0 end',
    );
    expect(sql).toContain('0.05 * ln(1 + "search_index"."popularity")');
    expect(params).toEqual(['inter', 'inter', 'inter%']);
  });
});

describe('searchIndexFuzzy', () => {
  it('returns nothing for queries too short to trigram-match, without querying', async () => {
    expect(MIN_FUZZY_QUERY_LENGTH).toBe(2);

    await expect(searchIndexFuzzy('a', { limit: 5 })).resolves.toEqual([]);
    await expect(searchIndexFuzzy('  ', { limit: 5 })).resolves.toEqual([]);
    await expect(searchIndexFuzzy('!!', { limit: 5 })).resolves.toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns ranked hits with a numeric score', async () => {
    vi.mocked(db.select).mockReturnValue(
      chain([
        {
          tmdbId: 157336,
          mediaType: 'movie',
          title: 'Interstellar',
          popularity: 120,
          score: '1.4',
        },
      ]),
    );

    const hits = await searchIndexFuzzy('Intersteller', { limit: 5 });

    expect(hits).toEqual([
      { tmdbId: 157336, mediaType: 'movie', title: 'Interstellar', popularity: 120, score: 1.4 },
    ]);
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it('accepts a media type restriction', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));

    await expect(searchIndexFuzzy('brad pit', { mediaType: 'person', limit: 5 })).resolves.toEqual(
      [],
    );
    expect(db.select).toHaveBeenCalledTimes(1);
  });
});

describe('searchIndexResults', () => {
  const hits = [
    { tmdbId: 1, mediaType: 'movie', title: 'A', popularity: 1, score: 1 },
    { tmdbId: 2, mediaType: 'tv', title: 'B', popularity: 1, score: 0.9 },
    { tmdbId: 3, mediaType: 'person', title: 'C', popularity: 1, score: 0.8 },
  ];

  beforeEach(() => {
    vi.mocked(db.select).mockReturnValue(chain(hits));
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
    vi.mocked(db.select).mockReturnValue(chain([]));

    await expect(searchIndexResults('zzz', { limit: 5 })).resolves.toEqual([]);
    expect(getMovieDetails).not.toHaveBeenCalled();
  });
});
