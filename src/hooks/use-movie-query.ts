import { Movie } from '@/types/movie';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Example custom hook demonstrating TanStack Query usage for movie data.
 *
 * This hook shows best practices for:
 * - Query key management
 * - Type-safe data fetching
 * - Error handling
 * - Cache invalidation with mutations
 */

// Example query keys - helps with cache management and consistency
export const movieKeys = {
  all: ['movies'] as const,
  lists: () => [...movieKeys.all, 'list'] as const,
  list: (filters: string) => [...movieKeys.lists(), { filters }] as const,
  details: () => [...movieKeys.all, 'detail'] as const,
  detail: (id: number) => [...movieKeys.details(), id] as const,
};

/**
 * Hook to fetch a single movie by ID
 */
export function useMovie(movieId: number) {
  return useQuery({
    queryKey: movieKeys.detail(movieId),
    queryFn: async (): Promise<Movie> => {
      const response = await fetch(`/api/movies/${movieId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch movie');
      }
      return response.json();
    },
    // Only run query if movieId is provided
    enabled: !!movieId,
    // Cache data for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Show cached data while refetching in background
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch popular movies with optional filters
 */
export function usePopularMovies(filters?: string) {
  return useQuery({
    queryKey: movieKeys.list(filters || ''),
    queryFn: async (): Promise<Movie[]> => {
      const searchParams = new URLSearchParams();
      if (filters) {
        searchParams.set('filters', filters);
      }

      const response = await fetch(`/api/movies/popular?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch popular movies');
      }
      return response.json();
    },
    // Cache for 2 minutes since popular movies change frequently
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Example mutation hook for adding a movie to watchlist
 */
export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movieId: number): Promise<void> => {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add movie to watchlist');
      }
    },
    onSuccess: () => {
      // Invalidate watchlist queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      // Also invalidate movie lists that might show watchlist status
      queryClient.invalidateQueries({ queryKey: movieKeys.lists() });
    },
    onError: (error) => {
      console.error('Error adding to watchlist:', error);
    },
  });
}

