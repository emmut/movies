import { Movie } from '@/types/Movie';
import { env } from 'process';

export async function getMovieDetails(movie: Movie) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
    next: {
      revalidate: 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading movie details');
  }

  return res.json();
}
