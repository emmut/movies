'use server';

import { fetchNowPlayingMovies, fetchTopRatedMovies, fetchUpcomingMovies } from '@/lib/movies';
import { DEFAULT_REGION } from '@/lib/regions';
import { fetchOnTheAirTvShows, fetchPopularTvShows, fetchTopRatedTvShows } from '@/lib/tv-shows';
import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';

export type HomeMediaCategory =
  | 'now-playing-movies'
  | 'on-the-air-tv'
  | 'upcoming-movies'
  | 'popular-tv'
  | 'top-rated-movies'
  | 'top-rated-tv';

const FETCHERS: Record<HomeMediaCategory, (region: string) => Promise<Movie[] | TvShow[]>> = {
  'now-playing-movies': fetchNowPlayingMovies,
  'on-the-air-tv': fetchOnTheAirTvShows,
  'upcoming-movies': fetchUpcomingMovies,
  'popular-tv': fetchPopularTvShows,
  'top-rated-movies': fetchTopRatedMovies,
  'top-rated-tv': fetchTopRatedTvShows,
};

/**
 * Resolves a home-page media list for the given category and region.
 *
 * Dispatches to the matching cached (`'use cache: remote'`) fetcher, which keys its cache on the
 * region argument. Safe to call as a server action from the client: the homepage prerenders the
 * default-region list, then the client swaps in the user's region without reading the session on
 * the server during the homepage render (which would force the sliders to stream and crash
 * hydration under cacheComponents on next@16.2.9).
 */
export async function getHomeMediaList(
  category: HomeMediaCategory,
  region: string = DEFAULT_REGION,
): Promise<Movie[] | TvShow[]> {
  return FETCHERS[category](region);
}
