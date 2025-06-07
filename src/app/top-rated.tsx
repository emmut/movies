import ResourceCard from '@/components/resource-card';
import { env } from '@/env';
import { MovieResponse } from '@/types/Movie';

async function fetchTopRatedMovies() {
  const url = new URL('https://api.themoviedb.org/3/discover/movie');
  url.searchParams.set('sort_by', 'vote_average.desc');
  url.searchParams.set('region', 'SE');
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('include_video', 'false');

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
    next: {
      revalidate: 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading now top rated movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export default async function TopRated() {
  const movies = await fetchTopRatedMovies();

  return movies.map((movie) => (
    <ResourceCard
      className="max-w-[150px]"
      key={movie.id}
      resource={movie}
      type="movie"
    />
  ));
}
