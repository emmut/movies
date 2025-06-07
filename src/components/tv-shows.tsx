import { fetchDiscoverTvShows } from '@/lib/tv-shows';
import ResourceCard from './resource-card';

type TvShowsProps = {
  currentGenreId: number;
  currentPage: number;
};

export async function TvShows({ currentGenreId, currentPage }: TvShowsProps) {
  const { tvShows } = await fetchDiscoverTvShows(currentGenreId, currentPage);

  return (
    <>
      {tvShows.map((tvShow) => (
        <ResourceCard key={tvShow.id} resource={tvShow} type="tv" />
      ))}
      {tvShows.length === 0 && (
        <p className="col-span-full text-center">No TV shows was found</p>
      )}
    </>
  );
}

function TvShowsSkeletons() {
  return (
    <>
      {Array.from({ length: 20 }).map((_, index) => (
        <ResourceCard.Skeleton key={index} />
      ))}
    </>
  );
}

TvShows.Skeletons = TvShowsSkeletons;

export default TvShows;
