import ItemCard from '@/components/item-card';
import { getUser } from '@/lib/auth-server';
import { fetchNowPlayingMovies, fetchUserNowPlayingMovies } from '@/lib/movies';

/**
 * Displays a list of now-playing movies as resource cards.
 *
 * Fetches either personalized or general now-playing movies depending on user authentication, and renders each as a {@link ItemCard} with type "movie".
 *
 * @returns An array of {@link ItemCard} elements representing now-playing movies.
 */
export default async function NowPlayingMovies() {
  const user = await getUser();
  const movies = user
    ? await fetchUserNowPlayingMovies()
    : await fetchNowPlayingMovies();

  return movies.map((movie) => (
    <ItemCard
      className="max-w-[150px]"
      key={movie.id}
      resource={movie}
      type="movie"
      userId={user?.id}
    />
  ));
}
