import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';

/**
 * Shared React Query wiring for per-user resource collections (watchlist,
 * watched): both change infrequently, so pages and counts share the same
 * cache windows.
 */
export const COLLECTION_STALE_TIME = 1000 * 60 * 5; // 5 minutes
export const COLLECTION_GC_TIME = 1000 * 60 * 30; // 30 minutes

export type CollectionMediaType = 'movie' | 'tv';

export type CollectionQueryKeys = {
  list: (mediaType: CollectionMediaType, page: number) => readonly unknown[];
  count: (mediaType: CollectionMediaType) => readonly unknown[];
};

export type CollectionPageData = {
  items: Array<{ id: string; resourceType: string; resource: MovieDetails | TvDetails }>;
  totalPages: number;
};

export type CollectionPageFetcher = (
  mediaType: CollectionMediaType,
  page: number,
) => Promise<CollectionPageData>;

export type CollectionCountFetcher = (mediaType: CollectionMediaType) => Promise<number>;
