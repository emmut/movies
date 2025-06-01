import MovieCard from '@/components/movie-card';
import { fetchNowPlayingMovies } from '@/lib/homepage';

export default async function NowPlayingMovies() {
  const movies = await fetchNowPlayingMovies();

  return movies.map((movie) => <MovieCard key={movie.id} movie={movie} />);
}
