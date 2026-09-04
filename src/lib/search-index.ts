import 'server-only';
import { and, desc, eq, or, sql } from 'drizzle-orm';

import { searchIndex } from '@/db/schema/search-index';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { getPersonDetails } from '@/lib/persons';
import { normalizeSearchTitle, type SearchIndexMediaType } from '@/lib/search-index-ingest';
import { getTvShowDetails } from '@/lib/tv-shows';
import type { MovieDetails, MultiSearchResult } from '@/types/movie';
import type { PersonDetails } from '@/types/person';
import type { TvDetails } from '@/types/tv-show';

export type SearchIndexHit = {
  tmdbId: number;
  mediaType: SearchIndexMediaType;
  title: string;
  popularity: number;
  score: number;
};

export type SearchIndexOptions = {
  /** Restrict to one media type; omit to search all three. */
  mediaType?: SearchIndexMediaType;
  limit: number;
};

// Trigrams need at least a couple of characters to say anything; a one-letter
// query would match half the index. Shorter queries go to TMDB as before.
export const MIN_FUZZY_QUERY_LENGTH = 2;

/**
 * How well the folded title matches the folded query: plain trigram
 * similarity for typos and word-order swaps, or word similarity for a query
 * that is a prefix or fragment of the title ("interst" → "interstellar").
 */
export function fuzzySimilarity(query: string) {
  return sql`greatest(similarity(${searchIndex.searchTitle}, ${query}::text), word_similarity(${query}::text, ${searchIndex.searchTitle}))`;
}

/**
 * Index-backed predicate: the title is within pg_trgm's similarity threshold
 * of the query, or the query is a close match to a fragment of it. Both
 * operators are served by the GIN trigram index.
 */
export function fuzzyMatch(query: string) {
  return or(
    sql`${searchIndex.searchTitle} % ${query}::text`,
    sql`${query}::text <% ${searchIndex.searchTitle}`,
  );
}

/**
 * Ranking: similarity in [0, 1], a flat boost for titles that start with the
 * query (what a person typing expects to see first), and a gentle popularity
 * term so a near-miss on a well-known title outranks an exact match on an
 * obscure one. The folded query holds only letters, digits, and spaces, so it
 * is safe inside LIKE without escaping.
 */
export function fuzzyScore(query: string) {
  return sql<number>`${fuzzySimilarity(query)} + case when ${searchIndex.searchTitle} like ${`${query}%`}::text then 0.25 else 0 end + 0.05 * ln(1 + ${searchIndex.popularity})`;
}

/**
 * Ranks the local index against a free-text query. Returns nothing for
 * queries too short to trigram-match; callers fall back to TMDB.
 */
export async function searchIndexFuzzy(
  query: string,
  { mediaType, limit }: SearchIndexOptions,
): Promise<SearchIndexHit[]> {
  const folded = normalizeSearchTitle(query);
  if (folded.length < MIN_FUZZY_QUERY_LENGTH) {
    return [];
  }

  const score = fuzzyScore(folded);
  const rows = await db
    .select({
      tmdbId: searchIndex.tmdbId,
      mediaType: searchIndex.mediaType,
      title: searchIndex.title,
      popularity: searchIndex.popularity,
      score,
    })
    .from(searchIndex)
    .where(and(fuzzyMatch(folded), mediaType ? eq(searchIndex.mediaType, mediaType) : undefined))
    .orderBy(desc(score), desc(searchIndex.popularity))
    .limit(limit);

  return rows.map((row) => ({ ...row, score: Number(row.score) }));
}

function movieResult(details: MovieDetails): MultiSearchResult {
  return {
    adult: details.adult,
    backdrop_path: details.backdrop_path,
    id: details.id,
    title: details.title,
    original_language: details.original_language,
    original_title: details.original_title,
    overview: details.overview,
    poster_path: details.poster_path,
    media_type: 'movie',
    genre_ids: (details.genres ?? []).map((genre) => genre.id),
    popularity: details.popularity,
    release_date: details.release_date,
    video: details.video,
    vote_average: details.vote_average,
    vote_count: details.vote_count,
  };
}

function tvResult(details: TvDetails): MultiSearchResult {
  return {
    id: details.id,
    name: details.name,
    original_name: details.original_name,
    overview: details.overview,
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    vote_average: details.vote_average,
    vote_count: details.vote_count,
    first_air_date: details.first_air_date,
    genre_ids: (details.genres ?? []).map((genre) => genre.id),
    popularity: details.popularity,
    media_type: 'tv',
    origin_country: details.origin_country,
    original_language: details.original_language,
  };
}

function personResult(details: PersonDetails): MultiSearchResult {
  return {
    id: details.id,
    name: details.name,
    profile_path: details.profile_path,
    popularity: details.popularity,
    known_for_department: details.known_for_department,
    known_for: details.known_for ?? [],
    media_type: 'person',
  };
}

/**
 * Turns an index hit into the shape TMDB's search endpoints return, using the
 * cached details fetchers — the index stores no metadata of its own.
 */
async function hydrateHit(hit: SearchIndexHit): Promise<MultiSearchResult> {
  if (hit.mediaType === 'movie') {
    return movieResult(await getMovieDetails(hit.tmdbId));
  }
  if (hit.mediaType === 'tv') {
    return tvResult(await getTvShowDetails(hit.tmdbId));
  }
  return personResult(await getPersonDetails(hit.tmdbId));
}

/**
 * Fuzzy-searches the local index and hydrates the hits into search results,
 * preserving rank. Hits whose details fetch fails (a title TMDB has since
 * removed, a transient error) are dropped rather than failing the search.
 */
export async function searchIndexResults(
  query: string,
  options: SearchIndexOptions,
): Promise<MultiSearchResult[]> {
  const hits = await searchIndexFuzzy(query, options);
  const settled = await Promise.allSettled(hits.map(hydrateHit));

  return settled.filter((result) => result.status === 'fulfilled').map((result) => result.value);
}
