import { fetchDiscoverMovies } from '@/lib/movies';
import { fetchDiscoverTvShows } from '@/lib/tv-shows';
import type { Movie } from '@/types/movie';
import type { TvShow } from '@/types/tv-show';

export type DiscoverResult = {
  results: Movie[] | TvShow[];
  totalPages: number;
};

export type DiscoverMoviesResult = {
  movies: Movie[];
  totalPages: number;
};

export type DiscoverTvShowsResult = {
  tvShows: TvShow[];
  totalPages: number;
};

/**
 * Fetches discover movies data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param genreId - The genre ID to filter by (0 for all genres)
 * @param page - The page number to fetch
 * @param sortBy - Optional sort parameter
 * @param watchProviders - Optional watch provider filter
 * @param watchRegion - Optional region filter
 * @returns Object containing movies array and total pages
 */
export async function getDiscoverMovies(
  genreId: number,
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string
): Promise<DiscoverMoviesResult> {
  return await fetchDiscoverMovies(
    genreId,
    page,
    sortBy,
    watchProviders,
    watchRegion
  );
}

/**
 * Fetches discover TV shows data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param genreId - The genre ID to filter by (0 for all genres)
 * @param page - The page number to fetch
 * @param sortBy - Optional sort parameter
 * @param watchProviders - Optional watch provider filter
 * @param watchRegion - Optional region filter
 * @returns Object containing TV shows array and total pages
 */
export async function getDiscoverTvShows(
  genreId: number,
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string
): Promise<DiscoverTvShowsResult> {
  return await fetchDiscoverTvShows(
    genreId,
    page,
    sortBy,
    watchProviders,
    watchRegion
  );
}

/**
 * Generic discover function that fetches either movies or TV shows based on media type.
 * Used by React Query hooks for unified data fetching.
 *
 * @param mediaType - Either 'movie' or 'tv'
 * @param genreId - The genre ID to filter by (0 for all genres)
 * @param page - The page number to fetch
 * @param sortBy - Optional sort parameter
 * @param watchProviders - Optional watch provider filter
 * @param watchRegion - Optional region filter
 * @returns Object containing results array and total pages
 */
export async function getDiscoverMedia(
  mediaType: 'movie' | 'tv',
  genreId: number,
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string
): Promise<DiscoverResult> {
  if (mediaType === 'tv') {
    const { tvShows, totalPages } = await getDiscoverTvShows(
      genreId,
      page,
      sortBy,
      watchProviders,
      watchRegion
    );
    return { results: tvShows, totalPages };
  }

  const { movies, totalPages } = await getDiscoverMovies(
    genreId,
    page,
    sortBy,
    watchProviders,
    watchRegion
  );
  return { results: movies, totalPages };
}
