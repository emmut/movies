import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { fetchTopRatedTvShows, fetchUserTopRatedTvShows } from '@/lib/tv-shows';

/**
 * Asynchronously renders a list of top-rated TV shows as `ResourceCard` components.
 *
 * Fetches top-rated TV shows and renders each as a {@link ResourceCard} with type "tv".
 *
 * @returns An array of `ResourceCard` React elements representing top-rated TV shows.
 */
export default async function TopRatedTvShows() {
  const user = await getUser();
  const tvShows = user
    ? await fetchUserTopRatedTvShows()
    : await fetchTopRatedTvShows();

  return tvShows.map((tvShow) => (
    <ResourceCard
      className="max-w-[150px]"
      key={tvShow.id}
      resource={tvShow}
      type="tv"
      userId={user?.id}
    />
  ));
}
