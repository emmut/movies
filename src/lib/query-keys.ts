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
  withRuntimeLte?: number;
};

// Key factory shared by the system lists (watchlist, watched) so both expose
// the same hierarchy under their own root.
function systemListKeys<Root extends string>(root: Root) {
  const all = [root] as const;
  const lists = () => [...all, 'list'] as const;
  const counts = () => [...all, 'counts'] as const;
  return {
    all,
    lists,
    list: (
      mediaType: 'movie' | 'tv',
      page: number,
      watchProviders?: number[],
      watchRegion?: string,
    ) => [...lists(), mediaType, page, watchProviders, watchRegion] as const,
    counts,
    count: (mediaType: 'movie' | 'tv') => [...counts(), mediaType] as const,
    status: (resourceId: number, resourceType: string) =>
      [...all, 'status', resourceId, resourceType] as const,
  };
}

export const queryKeys = {
  user: {
    all: ['user'] as const,
    region: () => [...queryKeys.user.all, 'region'] as const,
    watchProviders: (region: string, userProviders?: number[]) =>
      [...queryKeys.user.all, 'watchProviders', region, userProviders] as const,
  },
  home: {
    all: ['home'] as const,
    lists: () => [...queryKeys.home.all, 'list'] as const,
    list: (category: string, region: string) =>
      [...queryKeys.home.lists(), category, region] as const,
  },
  watchlist: systemListKeys('watchlist'),
  watched: systemListKeys('watched'),
  lists: {
    all: ['lists'] as const,
    details: () => [...queryKeys.lists.all, 'detail'] as const,
    detail: (listId: string, page: number, watchProviders?: number[], watchRegion?: string) =>
      [...queryKeys.lists.details(), listId, page, watchProviders, watchRegion] as const,
    withStatus: (mediaId: number, mediaType: string) =>
      [...queryKeys.lists.all, 'withStatus', mediaId, mediaType] as const,
  },
  discover: {
    all: ['discover'] as const,
    lists: () => [...queryKeys.discover.all, 'list'] as const,
    list: (params: DiscoverParams) => [...queryKeys.discover.lists(), params] as const,
    movies: (params: Omit<DiscoverParams, 'mediaType'>) =>
      [
        ...queryKeys.discover.lists(),
        'movies',
        params.genreId,
        params.page,
        params.sortBy,
        params.watchProviders,
        params.watchRegion,
        params.withRuntimeLte,
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
        params.withRuntimeLte,
      ] as const,
  },
  search: {
    all: ['search'] as const,
    lists: () => [...queryKeys.search.all, 'list'] as const,
    movies: (query: string, page: number) =>
      [...queryKeys.search.lists(), 'movies', query, page] as const,
    tvShows: (query: string, page: number) =>
      [...queryKeys.search.lists(), 'tv', query, page] as const,
    persons: (query: string, page: number) =>
      [...queryKeys.search.lists(), 'persons', query, page] as const,
    multi: (query: string, page: number) =>
      [...queryKeys.search.lists(), 'multi', query, page] as const,
  },
} as const;
