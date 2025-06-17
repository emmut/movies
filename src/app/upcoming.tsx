import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { fetchUpcomingMovies, fetchUserUpcomingMovies } from '@/lib/tmdb';

/**
 * Displays a list of upcoming movies as resource cards.
 *
 * Fetches and renders either personalized or general upcoming movies based on the user's authentication status.
 *
 * @returns An array of {@link ResourceCard} components representing upcoming movies.
 */
export default async function Upcoming() {
  const user = await getUser();
  const movies = user
    ? await fetchUserUpcomingMovies()
    : await fetchUpcomingMovies();

  return movies.map((movie) => (
    <ResourceCard
      className="max-w-[150px]"
      key={movie.id}
      resource={movie}
      type="movie"
    />
  ));
}
