import 'server-only';
import { normalizeSearchTitle } from '@movies/config/search-title';
import { sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { searchIndex } from './schema/search-index';

type SearchIndexMediaType = typeof searchIndex.$inferSelect.mediaType;
type SearchIndexOptions = { mediaType?: SearchIndexMediaType; limit: number };

// Two characters make one real trigram, which matches half the index equally
// well. Shorter queries stay with TMDB.
export const MIN_FUZZY_QUERY_LENGTH = 3;

// Similar candidates retained per match operator before re-ranking.
export const CANDIDATE_LIMIT = 40;

// Candidates below this similarity are noise for a nonsense query; matches the
// pg_trgm default threshold for the `%` operator.
export const MIN_SIMILARITY = 0.3;

// Word matches ignore the rest of the title. Use pg_trgm's stricter default
// for this scan to avoid fetching thousands of weak fragment matches.
const MIN_WORD_SIMILARITY = 0.6;

// The index is a convenience layer over TMDB. A database that is slow to
// answer (a preview instance waking from sleep) must not hold the search
// hostage; give up and let the caller fall through.
export const FUZZY_QUERY_TIMEOUT_MS = 1500;

/**
 * Fuzzy search over the index, as one statement.
 *
 * GIN-backed similarity predicates select plausible whole-title and word
 * matches before sorting by distance. An unfiltered GiST nearest-neighbour
 * scan can traverse most of the catalog even with LIMIT 40, exhausting the
 * preview database's memory. Each filtered scan retains `CANDIDATE_LIMIT`
 * rows. Common fragments can still match many rows, so the caller also sets
 * a database statement timeout. The union is then re-ranked:
 * similarity in [0, 1], a flat boost for titles that start with the query
 * (what someone typing expects first), and a gentle log-popularity term so a
 * near-miss on a well-known title outranks an exact hit on an obscure one.
 *
 * The folded query holds only letters, digits, and spaces, so it is safe in
 * LIKE without escaping.
 */
export function fuzzyQuery(folded: string, { mediaType, limit }: SearchIndexOptions): SQL {
  const typeFilter = mediaType ? sql`and ${searchIndex.mediaType} = ${mediaType}::text` : sql``;
  const q = sql`${folded}::text`;

  return sql`
    with candidates as (
      (
        select ${searchIndex.tmdbId}, ${searchIndex.mediaType}, ${searchIndex.title},
               ${searchIndex.searchTitle}, ${searchIndex.popularity}
        from ${searchIndex}
        where ${searchIndex.searchTitle} % ${q} ${typeFilter}
        order by ${searchIndex.searchTitle} <-> ${q}
        limit ${CANDIDATE_LIMIT}
      )
      union
      (
        select ${searchIndex.tmdbId}, ${searchIndex.mediaType}, ${searchIndex.title},
               ${searchIndex.searchTitle}, ${searchIndex.popularity}
        from ${searchIndex}
        where ${q} <% ${searchIndex.searchTitle} ${typeFilter}
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
export function createSearchIndexReader<TSchema extends Record<string, unknown>>(
  db: NodePgDatabase<TSchema>,
) {
  async function searchIndexFuzzy(query: string, options: SearchIndexOptions) {
    const folded = normalizeSearchTitle(query);
    if (folded.length < MIN_FUZZY_QUERY_LENGTH) {
      return [];
    }

    const result = await withTimeout(
      db.transaction(async (tx) => {
        // Transaction-local settings cannot leak to the next pooled request.
        // The server cancels expensive statements even after our caller times out.
        await tx.execute(sql`
        select set_config('statement_timeout', ${String(FUZZY_QUERY_TIMEOUT_MS)}, true),
               set_config('pg_trgm.similarity_threshold', ${String(MIN_SIMILARITY)}, true),
               set_config('pg_trgm.word_similarity_threshold', ${String(MIN_WORD_SIMILARITY)}, true)
      `);
        return await tx.execute<FuzzyRow>(fuzzyQuery(folded, options));
      }),
    );
    if (result === null) {
      console.warn(
        `Fuzzy search index did not answer within ${FUZZY_QUERY_TIMEOUT_MS}ms; skipping`,
      );
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

  return { searchIndexFuzzy };
}
