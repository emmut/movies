import MovieCard from '@/components/movie-card';
import { getUser } from '@/lib/auth-server';
import { fetchUpcomingMovies, fetchUserUpcomingMovies } from '@/lib/movies';

export default async function UpcomingMovies() {
  const user = await getUser();
  const movies = user
    ? await fetchUserUpcomingMovies()
    : await fetchUpcomingMovies();

  return movies.map((movie) => (
    <MovieCard className="max-w-[150px]" key={movie.id} movie={movie} />
  ));
}
