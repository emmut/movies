import { fetchDiscoverTvShows } from '@/lib/tv-shows';
import TvShowCard from './tv-show-card';

type TvShowsProps = {
  currentGenreId: number;
  currentPage: number;
};

export async function TvShows({ currentGenreId, currentPage }: TvShowsProps) {
  const { tvShows } = await fetchDiscoverTvShows(currentGenreId, currentPage);

  return (
    <>
      {tvShows.map((tvShow) => (
        <TvShowCard key={tvShow.id} tvShow={tvShow} />
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
        <TvShowSkeleton key={index} />
      ))}
    </>
  );
}

function TvShowSkeleton() {
  return (
    <div className="group aspect-2/3 overflow-hidden rounded-lg bg-zinc-900">
      <div className="relative h-full">
        <div className="h-full w-full animate-pulse bg-neutral-50/10" />

        <div className="absolute right-0 bottom-0 left-0 p-3">
          <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-neutral-50/10" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-12 animate-pulse rounded bg-neutral-50/10" />
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 animate-pulse rounded bg-neutral-50/10" />
              <div className="h-3 w-6 animate-pulse rounded bg-neutral-50/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

TvShows.Skeletons = TvShowsSkeletons;

export default TvShows;
