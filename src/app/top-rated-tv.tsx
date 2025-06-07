import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { fetchTopRatedTvShows, fetchUserTopRatedTvShows } from '@/lib/tv-shows';

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
    />
  ));
}
