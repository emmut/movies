import MovieCard from '@/components/movie-card';
import { env } from '@/env';
import { MovieResponse } from '@/types/Movie';
import { unstable_cacheLife as cacheLife } from 'next/cache';

async function fetchNowPlayingMovies() {
  'use cache';
  cacheLife('minutes');

  const res = await fetch('https://api.themoviedb.org/3/movie/now_playing', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading now playing movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export default async function NowPlayingMovies() {
  const movies = await fetchNowPlayingMovies();

  return movies.map((movie) => <MovieCard key={movie.id} movie={movie} />);
}
