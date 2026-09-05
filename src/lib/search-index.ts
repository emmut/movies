import 'server-only';
import { sql, SQL } from 'drizzle-orm';

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
  similarity: number;
  score: number;
};

export type SearchIndexOptions = {
  /** Restrict to one media type; omit to search all three. */
  mediaType?: SearchIndexMediaType;
  limit: number;
};

// Two characters make one real trigram, which matches half the index equally
// well. Shorter queries stay with TMDB.
export const MIN_FUZZY_QUERY_LENGTH = 3;

// Nearest neighbours pulled per distance operator before re-ranking. The GiST
// index walks in distance order and stops here, so the cost of a query does
// not depend on how many titles happen to contain it ("the", "man").
export const CANDIDATE_LIMIT = 40;

// Candidates below this similarity are noise for a nonsense query; matches the
// pg_trgm default threshold for the `%` operator.
export const MIN_SIMILARITY = 0.3;

// The index is a convenience layer over TMDB. A database that is slow to
// answer (a preview instance waking from sleep) must not hold the search
// hostage; give up and let the caller fall through.
export const FUZZY_QUERY_TIMEOUT_MS = 1500;

/**
 * Bounded fuzzy search over the index, as one statement.
 *
 * Candidate generation is two k-nearest-neighbour scans on the trigram GiST
 * index: `<->` (trigram distance, for typos and swapped words) and `<<->`
 * (word-similarity distance, for a query that is a prefix or fragment of the
 * title, "interst" → "interstellar"). Each returns its closest
 * `CANDIDATE_LIMIT` rows straight from the index, so the work is bounded even
 * for a query that appears in a million titles. The union is then re-ranked:
 * similarity in [0, 1], a flat boost for titles that start with the query
 * (what someone typing expects first), and a gentle log-popularity term so a
 * near-miss on a well-known title outranks an exact hit on an obscure one.
 *
 * The folded query holds only letters, digits, and spaces, so it is safe in
 * LIKE without escaping.
 */
export function fuzzyQuery(folded: string, { mediaType, limit }: SearchIndexOptions): SQL {
  const typeFilter = mediaType ? sql`where ${searchIndex.mediaType} = ${mediaType}::text` : sql``;
  const q = sql`${folded}::text`;

  return sql`
    with candidates as (
      (
        select ${searchIndex.tmdbId}, ${searchIndex.mediaType}, ${searchIndex.title},
               ${searchIndex.searchTitle}, ${searchIndex.popularity}
        from ${searchIndex} ${typeFilter}
        order by ${searchIndex.searchTitle} <-> ${q}
        limit ${CANDIDATE_LIMIT}
      )
      union
      (
        select ${searchIndex.tmdbId}, ${searchIndex.mediaType}, ${searchIndex.title},
               ${searchIndex.searchTitle}, ${searchIndex.popularity}
        from ${searchIndex} ${typeFilter}
        order by ${q} <<-> ${searchIndex.searchTitle}
        limit ${CANDIDATE_LIMIT}
      )
    ),
    scored as (
      select tmdb_id, media_type, title, popularity,
             greatest(similarity(search_title, ${q}), word_similarity(${q}, search_title)) as similarity,
             case when search_title like ${`${folded}%`}::text then 0.25 else 0 end as prefix_boost
      from candidates
    )
    select tmdb_id, media_type, title, popularity, similarity,
           similarity + prefix_boost + 0.05 * ln(1 + popularity) as score
    from scored
    where similarity >= ${MIN_SIMILARITY}
    order by score desc, popularity desc
    limit ${limit}
  `;
}

type FuzzyRow = {
  tmdb_id: number;
  media_type: SearchIndexMediaType;
  title: string;
  popularity: number;
  similarity: number | string;
  score: number | string;
};

/**
 * Ranks the local index against a free-text query. Returns nothing for
 * queries too short to trigram-match, and nothing (after a warning) when the
 * database does not answer within {@link FUZZY_QUERY_TIMEOUT_MS}; callers
 * fall back to TMDB in both cases.
 */
export async function searchIndexFuzzy(
  query: string,
  options: SearchIndexOptions,
): Promise<SearchIndexHit[]> {
  const folded = normalizeSearchTitle(query);
  if (folded.length < MIN_FUZZY_QUERY_LENGTH) {
    return [];
  }

  const result = await withTimeout(db.execute<FuzzyRow>(fuzzyQuery(folded, options)));
  if (result === null) {
    console.warn(`Fuzzy search index did not answer within ${FUZZY_QUERY_TIMEOUT_MS}ms; skipping`);
    return [];
  }

  return result.rows.map((row) => ({
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    title: row.title,
    popularity: Number(row.popularity),
    similarity: Number(row.similarity),
    score: Number(row.score),
  }));
}

/** Resolves to `null` if `promise` has not settled within the fuzzy query timeout. */
function withTimeout<T>(promise: Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), FUZZY_QUERY_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
