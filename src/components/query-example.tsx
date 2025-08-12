'use client';

import { Spinner } from '@/components/spinner';
import { Button } from '@/components/ui/button';
import {
  useAddToWatchlist,
  useMovie,
  usePopularMovies,
} from '@/hooks/use-movie-query';

/**
 * Example component demonstrating TanStack Query usage.
 *
 * This component shows how to:
 * - Use query hooks for data fetching
 * - Handle loading and error states
 * - Use mutation hooks for data modification
 * - Display real-time data updates
 */
export function QueryExample() {
  // Example usage of usePopularMovies hook
  const {
    data: popularMovies,
    isLoading: isLoadingPopular,
    error: popularError,
    refetch: refetchPopular,
  } = usePopularMovies();

  // Example usage of useMovie hook for a specific movie
  const {
    data: movie,
    isLoading: isLoadingMovie,
    error: movieError,
  } = useMovie(550); // Fight Club movie ID

  // Example usage of mutation hook
  const addToWatchlistMutation = useAddToWatchlist();

  function handleAddToWatchlist(movieId: number) {
    addToWatchlistMutation.mutate(movieId, {
      onSuccess: () => {
        console.log('Movie added to watchlist successfully!');
      },
      onError: (error) => {
        console.error('Failed to add movie to watchlist:', error);
      },
    });
  }

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">TanStack Query Example</h2>

      {/* Popular Movies Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Popular Movies</h3>
          <Button onClick={() => refetchPopular()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {isLoadingPopular && (
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Loading popular movies...</span>
          </div>
        )}

        {popularError && (
          <div className="text-red-500">
            Error loading popular movies: {popularError.message}
          </div>
        )}

        {popularMovies && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popularMovies.slice(0, 6).map((movie) => (
              <div key={movie.id} className="rounded-lg border p-4">
                <h4 className="font-medium">{movie.title}</h4>
                <p className="mb-2 text-sm text-gray-600">
                  {movie.overview?.slice(0, 100)}...
                </p>
                <Button
                  onClick={() => handleAddToWatchlist(movie.id)}
                  disabled={addToWatchlistMutation.isPending}
                  size="sm"
                >
                  {addToWatchlistMutation.isPending
                    ? 'Adding...'
                    : 'Add to Watchlist'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Single Movie Section */}
      <section>
        <h3 className="mb-4 text-xl font-semibold">
          Featured Movie (Fight Club)
        </h3>

        {isLoadingMovie && (
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Loading movie details...</span>
          </div>
        )}

        {movieError && (
          <div className="text-red-500">
            Error loading movie: {movieError.message}
          </div>
        )}

        {movie && (
          <div className="rounded-lg border p-6">
            <h4 className="mb-2 text-lg font-medium">{movie.title}</h4>
            <p className="mb-4 text-gray-600">{movie.overview}</p>
            <div className="flex gap-2">
              <span className="rounded bg-gray-100 px-2 py-1 text-sm">
                Rating: {movie.vote_average}/10
              </span>
              <span className="rounded bg-gray-100 px-2 py-1 text-sm">
                Release: {movie.release_date}
              </span>
            </div>
            <Button
              onClick={() => handleAddToWatchlist(movie.id)}
              disabled={addToWatchlistMutation.isPending}
              className="mt-4"
            >
              {addToWatchlistMutation.isPending
                ? 'Adding...'
                : 'Add to Watchlist'}
            </Button>
          </div>
        )}
      </section>

      {/* Query Status Info */}
      <section className="text-sm text-gray-500">
        <h4 className="mb-2 font-medium">Query Status (for development)</h4>
        <ul className="space-y-1">
          <li>Popular Movies: {isLoadingPopular ? 'Loading' : 'Loaded'}</li>
          <li>Featured Movie: {isLoadingMovie ? 'Loading' : 'Loaded'}</li>
          <li>
            Watchlist Mutation:{' '}
            {addToWatchlistMutation.isPending ? 'Pending' : 'Idle'}
          </li>
        </ul>
      </section>
    </div>
  );
}

