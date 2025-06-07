import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { fetchUpcomingMovies, fetchUserUpcomingMovies } from '@/lib/movies';

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
