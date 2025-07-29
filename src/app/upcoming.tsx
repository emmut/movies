import ItemCard from '@/components/item-card';
import { getUser } from '@/lib/auth-server';
import { fetchUpcomingMovies, fetchUserUpcomingMovies } from '@/lib/movies';

/**
 * Displays a list of upcoming movies as resource cards.
 *
 * Fetches upcoming movies and renders each as a {@link ItemCard} component with movie-specific props.
 *
 * @returns An array of {@link ItemCard} components representing upcoming movies.
 */
export default async function UpcomingMovies() {
  const user = await getUser();
  const movies = user
    ? await fetchUserUpcomingMovies()
    : await fetchUpcomingMovies();

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
