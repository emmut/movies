import { env } from 'process';
import MovieCard from '@/components/MovieCard';
import { MovieResponse } from '@/types/Movie';

async function fetchNowPlayingMovies() {
  const res = await fetch('https://api.themoviedb.org/3/movie/now_playing', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
    next: {
      revalidate: 60 * 5,
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
