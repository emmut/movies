import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { fetchPopularTvShows, fetchUserPopularTvShows } from '@/lib/tv-shows';

export default async function PopularTvShows() {
  const user = await getUser();
  const tvShows = user
    ? await fetchUserPopularTvShows()
    : await fetchPopularTvShows();

  return tvShows.map((tvShow) => (
    <ResourceCard
      className="max-w-[150px]"
      key={tvShow.id}
      resource={tvShow}
      type="tv"
    />
  ));
}
