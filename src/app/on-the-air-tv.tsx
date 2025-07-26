import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { fetchOnTheAirTvShows, fetchUserOnTheAirTvShows } from '@/lib/tv-shows';

/**
 * Asynchronously renders a list of currently airing TV shows as `ResourceCard` components.
 *
 * Fetches currently airing TV shows and renders each as a {@link ResourceCard} with type "tv".
 *
 * @returns An array of `ResourceCard` React elements representing currently airing TV shows.
 */
export default async function OnTheAirTvShows() {
  const user = await getUser();
  const tvShows = user
    ? await fetchUserOnTheAirTvShows()
    : await fetchOnTheAirTvShows();

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
