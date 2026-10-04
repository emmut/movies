// The single client-callable entry point for discover queries; the underlying
// fetchers in movies.ts/tv-shows.ts are server-only.
'use server';

import { fetchDiscoverMovies } from '@/lib/movies';
import { fetchDiscoverTvShows } from '@/lib/tv-shows';
import type { Movie } from '@/types/movie';
import type { TvShow } from '@/types/tv-show';

export type DiscoverResult = {
  results: Movie[] | TvShow[];
  totalPages: number;
};

type DiscoverMoviesResult = {
  movies: Movie[];
  totalPages: number;
};

type DiscoverTvShowsResult = {
  tvShows: TvShow[];
  totalPages: number;
};

/**
 * Fetches discover movies data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param genreIds - Genre IDs to filter by (any may match; empty for all genres)
 * @param page - The page number to fetch
 * @param sortBy - Optional sort parameter
 * @param watchProviders - Optional watch provider filter
 * @param watchRegion - Optional region filter
 * @param withRuntimeLte - Optional maximum runtime filter
 * @param withOriginCountry - Optional pipe-separated origin country filter
 * @returns Object containing movies array and total pages
 */
async function getDiscoverMovies(
  genreIds: number[],
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string,
  withRuntimeLte?: number,
  withOriginCountry?: string,
): Promise<DiscoverMoviesResult> {
  return await fetchDiscoverMovies(
    genreIds,
    page,
    sortBy,
    watchProviders,
    watchRegion,
    withRuntimeLte,
    withOriginCountry,
  );
}

/**
 * Fetches discover TV shows data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param genreIds - Genre IDs to filter by (any may match; empty for all genres)
 * @param page - The page number to fetch
 * @param sortBy - Optional sort parameter
 * @param watchProviders - Optional watch provider filter
 * @param watchRegion - Optional region filter
 * @param withRuntimeLte - Optional maximum runtime filter
 * @param withOriginCountry - Optional pipe-separated origin country filter
 * @returns Object containing TV shows array and total pages
 */
async function getDiscoverTvShows(
  genreIds: number[],
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string,
  withRuntimeLte?: number,
  withOriginCountry?: string,
): Promise<DiscoverTvShowsResult> {
  return await fetchDiscoverTvShows(
    genreIds,
    page,
    sortBy,
    watchProviders,
    watchRegion,
    withRuntimeLte,
    withOriginCountry,
  );
}

/**
 * Generic discover function that fetches either movies or TV shows based on media type.
 * Used by React Query hooks for unified data fetching.
 *
 * @param mediaType - Either 'movie' or 'tv'
 * @param genreIds - Genre IDs to filter by (any may match; empty for all genres)
 * @param page - The page number to fetch
 * @param sortBy - Optional sort parameter
 * @param watchProviders - Optional watch provider filter
 * @param watchRegion - Optional region filter
 * @param withRuntimeLte - Optional maximum runtime filter
 * @param withOriginCountry - Optional pipe-separated origin country filter
 * @returns Object containing results array and total pages
 */
export async function getDiscoverMedia(
  mediaType: 'movie' | 'tv',
  genreIds: number[],
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string,
  withRuntimeLte?: number,
  withOriginCountry?: string,
): Promise<DiscoverResult> {
  if (mediaType === 'tv') {
    const { tvShows, totalPages } = await getDiscoverTvShows(
      genreIds,
      page,
      sortBy,
      watchProviders,
      watchRegion,
      withRuntimeLte,
      withOriginCountry,
    );
    return { results: tvShows, totalPages };
  }

  const { movies, totalPages } = await getDiscoverMovies(
    genreIds,
    page,
    sortBy,
    watchProviders,
    watchRegion,
    withRuntimeLte,
    withOriginCountry,
  );
  return { results: movies, totalPages };
}
