import { fetchDiscoverMovies } from '@/lib/movies';
import { fetchDiscoverTvShows } from '@/lib/tv-shows';
import ResourceGrid from './resource-grid';

type DiscoverGridProps = {
  currentGenreId: number;
  currentPage: number;
  mediaType: 'movie' | 'tv';
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  userId?: string;
};

/**
 * Displays a grid of movies or TV shows based on the selected filters.
 *
 * Fetches data based on the media type and applied filters, then renders a ResourceGrid with the results.
 *
 * @param currentGenreId - The ID of the genre to filter by.
 * @param currentPage - The page number of results to display.
 * @param mediaType - Whether to show movies or TV shows.
 * @param sortBy - The sort order for the results.
 * @param watchProviders - Comma-separated list of watch provider IDs.
 * @param watchRegion - The region code for watch providers.
 * @param userId - Optional user ID to enable list functionality.
 */
export default async function DiscoverGrid({
  currentGenreId,
  currentPage,
  mediaType,
  sortBy,
  watchProviders,
  watchRegion,
  userId,
}: DiscoverGridProps) {
  if (mediaType === 'tv') {
    const { tvShows } = await fetchDiscoverTvShows(
      currentGenreId,
      currentPage,
      sortBy,
      watchProviders,
      watchRegion
    );
    return <ResourceGrid resources={tvShows} type="tv" userId={userId} />;
  }

  const { movies } = await fetchDiscoverMovies(
    currentGenreId,
    currentPage,
    sortBy,
    watchProviders,
    watchRegion
  );
  return <ResourceGrid resources={movies} type="movie" userId={userId} />;
}
