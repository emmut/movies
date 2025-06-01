import MovieCard from '@/components/movie-card';
import { fetchUpcomingMovies } from '@/lib/homepage';

export default async function UpcomingMovies() {
  const movies = await fetchUpcomingMovies();

  return movies.map((movie) => <MovieCard key={movie.id} movie={movie} />);
}
