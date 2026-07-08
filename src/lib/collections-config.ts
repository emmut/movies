/**
 * Client-safe configuration for per-user resource collections.
 *
 * A "collection" is a flat set of TMDB resources a user has flagged —
 * currently the watchlist and the watched history. Adding a new kind means
 * extending COLLECTION_KINDS and COLLECTION_ROUTES; the schema, queries,
 * cache tags, and UI are all keyed by kind.
 */
export const COLLECTION_KINDS = ['watchlist', 'watched'] as const;

export type CollectionKind = (typeof COLLECTION_KINDS)[number];

export const COLLECTION_ROUTES: Record<CollectionKind, string> = {
  watchlist: '/watchlist',
  watched: '/watched',
};

// Collections change infrequently; pages and counts share the same
// React Query cache windows.
export const COLLECTION_STALE_TIME = 1000 * 60 * 5; // 5 minutes
export const COLLECTION_GC_TIME = 1000 * 60 * 30; // 30 minutes
