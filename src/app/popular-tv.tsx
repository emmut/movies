import ItemCard from '@/components/item-card';
import { getUser } from '@/lib/auth-server';
import { fetchPopularTvShows, fetchUserPopularTvShows } from '@/lib/tv-shows';

/**
 * Displays a list of popular TV shows as resource cards.
 *
 * Fetches popular TV shows and renders each as a {@link ItemCard} component with TV show-specific props.
 *
 * @returns An array of {@link ItemCard} components representing popular TV shows.
 */
export default async function PopularTvShows() {
  const user = await getUser();
  const tvShows = user
    ? await fetchUserPopularTvShows()
    : await fetchPopularTvShows();

  return tvShows.map((tvShow) => (
    <ItemCard
      className="max-w-[150px]"
      key={tvShow.id}
      resource={tvShow}
      type="tv"
      userId={user?.id}
    />
  ));
}
