import { Movie } from '@/types/Movies';
import { env } from 'process';

export async function getTrendingMovies() {
  const res = await fetch('https://api.themoviedb.org/3/trending/movie/day', {
    headers: new Headers({
      Authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      Accept: 'application/json',
      'Cache-Control': 'max-age: 3600',
    }),
  });

  if (!res.ok) {
    throw new Error('Faild loading trending movies');
  }

  return res.json();
}

export async function getMovieDetails(movie: Movie) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}`, {
    headers: new Headers({
      Authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,

      Accept: 'application/json',
    }),
  });

  if (!res.ok) {
    throw new Error('Failed loading movie details');
  }

  return res.json();
}
