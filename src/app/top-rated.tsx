import { env } from 'process';
import MovieCard from '@/components/MovieCard';
import { MovieResponse } from '@/types/Movie';

async function fetchTopRatedMovies() {
  const res = await fetch(
    'https://api.themoviedb.org/3/discover/movie?sort_by=vote_average.desc&region=SE&include_adult=false&include_video=false',
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
      next: {
        revalidate: 60 * 5,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed loading now top rated movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export default async function TopRatedMovies() {
  const movies = await fetchTopRatedMovies();

  return movies.map((movie) => <MovieCard key={movie.id} movie={movie} />);
}
