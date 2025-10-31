/**
 * Query key factory for React Query.
 * Provides type-safe, hierarchical query keys for consistent caching and invalidation.
 */

type DiscoverParams = {
  genreId: number;
  page: number;
  mediaType: 'movie' | 'tv';
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
};

export const queryKeys = {
  user: {
    all: ['user'] as const,
    region: () => [...queryKeys.user.all, 'region'] as const,
    watchProviders: (region: string, userProviders?: number[]) =>
      [...queryKeys.user.all, 'watchProviders', region, userProviders] as const,
  },
  watchlist: {
    all: ['watchlist'] as const,
    lists: () => [...queryKeys.watchlist.all, 'list'] as const,
    list: (mediaType: 'movie' | 'tv', page: number) =>
      [...queryKeys.watchlist.lists(), mediaType, page] as const,
    counts: () => [...queryKeys.watchlist.all, 'counts'] as const,
    count: (mediaType: 'movie' | 'tv') =>
      [...queryKeys.watchlist.counts(), mediaType] as const,
  },
  lists: {
    all: ['lists'] as const,
    details: () => [...queryKeys.lists.all, 'detail'] as const,
    detail: (listId: string, page: number) =>
      [...queryKeys.lists.details(), listId, page] as const,
  },
  discover: {
    all: ['discover'] as const,
    lists: () => [...queryKeys.discover.all, 'list'] as const,
    list: (params: DiscoverParams) =>
      [...queryKeys.discover.lists(), params] as const,
    movies: (params: Omit<DiscoverParams, 'mediaType'>) =>
      [
        ...queryKeys.discover.lists(),
        'movies',
        params.genreId,
        params.page,
        params.sortBy,
        params.watchProviders,
        params.watchRegion,
      ] as const,
    tvShows: (params: Omit<DiscoverParams, 'mediaType'>) =>
      [
        ...queryKeys.discover.lists(),
        'tv',
        params.genreId,
        params.page,
        params.sortBy,
        params.watchProviders,
        params.watchRegion,
      ] as const,
  },
} as const;
