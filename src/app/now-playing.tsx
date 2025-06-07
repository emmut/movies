import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { fetchNowPlayingMovies, fetchUserNowPlayingMovies } from '@/lib/movies';

export default async function NowPlayingMovies() {
  const user = await getUser();
  const movies = user
    ? await fetchUserNowPlayingMovies()
    : await fetchNowPlayingMovies();

  return movies.map((movie) => (
    <ResourceCard
      className="max-w-[150px]"
      key={movie.id}
      resource={movie}
      type="movie"
    />
  ));
}
