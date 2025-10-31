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
