import { index, integer, pgTable, primaryKey, real, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Fuzzy-search index over TMDB's daily id exports: every movie, TV show, and
 * person with its original title and popularity. Loaded nightly by
 * `ingest:search`, queried with pg_trgm when TMDB's literal search finds
 * nothing (typos, partial words, word order) and for the command palette.
 * Holds no metadata beyond what the exports carry; results are hydrated
 * from TMDB on demand.
 */
export const searchIndex = pgTable(
  'search_index',
  {
    tmdbId: integer('tmdb_id').notNull(),
    mediaType: text('media_type', { enum: ['movie', 'tv', 'person'] }).notNull(),
    /** The original title (or person name) as TMDB exports it, for display. */
    title: text('title').notNull(),
    /**
     * `title` folded for matching: lowercased, diacritics stripped,
     * punctuation collapsed to spaces (see `normalizeSearchTitle`). Queries
     * are folded the same way before comparing.
     */
    searchTitle: text('search_title').notNull(),
    popularity: real('popularity').notNull().default(0),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.mediaType, table.tmdbId] }),
    // GiST rather than GIN: the fuzzy query orders by trigram distance
    // (`<->`, `<<->`) with a LIMIT, and only GiST can walk that k-nearest-
    // neighbour order straight from the index. Requires pg_trgm (created by
    // migration 0015); the wider signature cuts false positives on 4–5M rows.
    index('search_index_search_title_trgm_idx').using(
      'gist',
      table.searchTitle.op('gist_trgm_ops(siglen=64)'),
    ),
  ],
);
