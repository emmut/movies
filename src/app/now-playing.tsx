import MovieCard from '@/components/movie-card';
import { getUser } from '@/lib/auth-server';
import { fetchNowPlayingMovies, fetchUserNowPlayingMovies } from '@/lib/movies';

export default async function NowPlayingMovies() {
  const user = await getUser();
  const movies = user
    ? await fetchUserNowPlayingMovies()
    : await fetchNowPlayingMovies();

  return movies.map((movie) => <MovieCard key={movie.id} movie={movie} />);
}
