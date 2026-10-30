// Client-callable entry point; the underlying TMDB fetchers are server-only.
'use server';

import type { DiscoverParams } from '@/lib/discover-params';
import { fetchDiscoverMovies } from '@/lib/movies';
import { fetchDiscoverTvShows } from '@/lib/tv-shows';
import type { Movie } from '@/types/movie';
import type { TvShow } from '@/types/tv-show';

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
