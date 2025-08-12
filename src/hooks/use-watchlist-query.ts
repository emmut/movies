import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Watchlist query keys for cache management
export const watchlistKeys = {
  all: ['watchlist'] as const,
  lists: () => [...watchlistKeys.all, 'list'] as const,
  list: (resourceType?: string) =>
    [...watchlistKeys.lists(), { resourceType }] as const,
  user: () => [...watchlistKeys.all, 'user'] as const,
  check: (resourceId: number, resourceType: string) =>
    [...watchlistKeys.all, 'check', { resourceId, resourceType }] as const,
};

// Types for watchlist data
export type WatchlistItem = {
  id: number;
  userId: string;
  resourceId: number;
  resourceType: string;
  createdAt: Date;
  resource?: MovieDetails | TvDetails;
};

export type WatchlistWithDetails = WatchlistItem & {
  resource: MovieDetails | TvDetails;
};

/**
 * Hook to fetch user's complete watchlist
 */
export function useWatchlist() {
  return useQuery({
    queryKey: watchlistKeys.user(),
    queryFn: async (): Promise<WatchlistItem[]> => {
      const response = await fetch('/api/watchlist');
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch watchlist with resource details for a specific type
 */
export function useWatchlistWithDetails(resourceType: 'movie' | 'tv') {
  return useQuery({
    queryKey: watchlistKeys.list(resourceType),
    queryFn: async (): Promise<WatchlistWithDetails[]> => {
      const response = await fetch(
        `/api/watchlist/details?resourceType=${resourceType}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch ${resourceType} watchlist`);
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Only fetch if resourceType is provided
    enabled: !!resourceType,
  });
}

/**
 * Hook to check if a specific resource is in the watchlist
 */
export function useIsInWatchlist(resourceId: number, resourceType: string) {
  return useQuery({
    queryKey: watchlistKeys.check(resourceId, resourceType),
    queryFn: async (): Promise<boolean> => {
      const response = await fetch(
        `/api/watchlist/check?resourceId=${resourceId}&resourceType=${resourceType}`
      );
      if (!response.ok) {
        throw new Error('Failed to check watchlist status');
      }
      const data = await response.json();
      return data.isInWatchlist;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    // Only fetch if we have valid parameters
    enabled: !!resourceId && !!resourceType,
  });
}

/**
 * Hook to add a resource to the watchlist
 */
export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resourceId,
      resourceType,
    }: {
      resourceId: number;
      resourceType: string;
    }): Promise<void> => {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId, resourceType }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to add to watchlist');
      }
    },
    onSuccess: (_, { resourceId, resourceType }) => {
      // Invalidate all watchlist queries
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });

      // Optimistically update the check query
      queryClient.setQueryData(
        watchlistKeys.check(resourceId, resourceType),
        true
      );
    },
    onError: (error) => {
      console.error('Error adding to watchlist:', error);
    },
  });
}

/**
 * Hook to remove a resource from the watchlist
 */
export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resourceId,
      resourceType,
    }: {
      resourceId: number;
      resourceType: string;
    }): Promise<void> => {
      const response = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId, resourceType }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to remove from watchlist');
      }
    },
    onSuccess: (_, { resourceId, resourceType }) => {
      // Invalidate all watchlist queries
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });

      // Optimistically update the check query
      queryClient.setQueryData(
        watchlistKeys.check(resourceId, resourceType),
        false
      );
    },
    onError: (error) => {
      console.error('Error removing from watchlist:', error);
    },
  });
}

/**
 * Combined hook for toggling watchlist status
 */
export function useToggleWatchlist(resourceId: number, resourceType: string) {
  const { data: isInWatchlist } = useIsInWatchlist(resourceId, resourceType);
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  const toggle = () => {
    const params = { resourceId, resourceType };
    if (isInWatchlist) {
      removeMutation.mutate(params);
    } else {
      addMutation.mutate(params);
    }
  };

  return {
    isInWatchlist,
    toggle,
    isPending: addMutation.isPending || removeMutation.isPending,
    error: addMutation.error || removeMutation.error,
  };
}

