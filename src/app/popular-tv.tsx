import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { fetchPopularTvShows } from '@/lib/tv-shows';

/**
 * Displays a list of popular TV shows as resource cards.
 *
 * Fetches popular TV shows and renders each as a {@link ResourceCard} component with TV show-specific props.
 *
 * @returns An array of {@link ResourceCard} components representing popular TV shows.
 */
export default async function PopularTvShows() {
  const user = await getUser();
  const tvShows = await fetchPopularTvShows();

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
