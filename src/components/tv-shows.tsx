import { fetchDiscoverTvShows } from '@/lib/tv-shows';
import ResourceCard from './resource-card';

type TvShowsProps = {
  currentGenreId: number;
  currentPage: number;
};

/**
 * Displays a list of TV shows based on the selected genre and page.
 *
 * Fetches TV show data asynchronously and renders a `ResourceCard` for each show. If no TV shows are found, displays a message indicating this.
 *
 * @param currentGenreId - The genre ID to filter TV shows.
 * @param currentPage - The page number for pagination.
 */
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

/**
 * Renders a set of 20 skeleton placeholder cards for TV shows.
 *
 * Typically used to indicate a loading state while TV show data is being fetched.
 */
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
