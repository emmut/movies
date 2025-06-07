import { fetchDiscoverMovies } from '@/lib/movies';
import { fetchDiscoverTvShows } from '@/lib/tv-shows';
import ResourceGrid from './resource-grid';

type DiscoverGridProps = {
  currentGenreId: number;
  currentPage: number;
  mediaType: 'movie' | 'tv';
};

/**
 * Displays a grid of movies or TV shows based on the selected genre, page, and media type.
 *
 * Fetches data based on the media type and renders a ResourceGrid with the results.
 *
 * @param currentGenreId - The ID of the genre to filter by.
 * @param currentPage - The page number of results to display.
 * @param mediaType - Whether to show movies or TV shows.
 */
export default async function DiscoverGrid({
  currentGenreId,
  currentPage,
  mediaType,
}: DiscoverGridProps) {
  if (mediaType === 'tv') {
    const { tvShows } = await fetchDiscoverTvShows(currentGenreId, currentPage);
    return <ResourceGrid resources={tvShows} type="tv" />;
  }

  const { movies } = await fetchDiscoverMovies(currentGenreId, currentPage);
  return <ResourceGrid resources={movies} type="movie" />;
}
