import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { fetchOnTheAirTvShows, fetchUserOnTheAirTvShows } from '@/lib/tv-shows';

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
    />
  ));
}
