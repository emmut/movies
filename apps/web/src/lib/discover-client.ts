// Client-callable entry point; the underlying TMDB fetchers are server-only.
'use server';

import type { DiscoverParams } from '@movies/api/discover-params';
import type { Movie } from '@movies/api/tmdb-types/movie';
import type { TvShow } from '@movies/api/tmdb-types/tv-show';

import { fetchDiscoverMovies } from '@/lib/movies';
import { fetchDiscoverTvShows } from '@/lib/tv-shows';

export type DiscoverResult = {
  results: Movie[] | TvShow[];
  totalPages: number;
};

export async function getDiscoverMedia(
  mediaType: 'movie' | 'tv',
  params: DiscoverParams,
): Promise<DiscoverResult> {
  if (mediaType === 'tv') {
    const { tvShows, totalPages } = await fetchDiscoverTvShows(params);
    return { results: tvShows, totalPages };
  }

  const { movies, totalPages } = await fetchDiscoverMovies(params);
  return { results: movies, totalPages };
}
