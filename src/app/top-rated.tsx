import ItemCard from '@/components/item-card';
import { env } from '@/env';
import { getUser } from '@/lib/auth-server';
import { TMDB_API_URL } from '@/lib/constants';
import { DEFAULT_REGION } from '@/lib/regions';
import { MovieResponse } from '@/types/movie';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * Retrieves a list of top-rated movies from the Movie Database API for the SE region.
 *
 * Filters out adult content and videos, sorts results by highest vote average, and returns the resulting movie array.
 *
 * @returns An array of top-rated movie objects.
 *
 * @throws {Error} If the API request fails or returns a non-successful response.
 */
async function fetchTopRatedMovies() {
  'use cache';
  cacheTag('top-rated');
  cacheLife('minutes');

  const url = new URL(`${TMDB_API_URL}/movie/top_rated`);
  url.searchParams.set('region', DEFAULT_REGION);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading now top rated movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

/**
 * Renders a list of top-rated movies as resource cards.
 *
 * Fetches top-rated movies and displays each as a {@link ItemCard} component with movie-specific props.
 *
 * @returns An array of {@link ItemCard} elements representing top-rated movies.
 */
export default async function TopRated() {
  const user = await getUser();
  const movies = await fetchTopRatedMovies();

  return movies.map((movie) => (
    <ItemCard
      className="max-w-[150px]"
      key={movie.id}
      resource={movie}
      type="movie"
      userId={user?.id}
    />
  ));
}
