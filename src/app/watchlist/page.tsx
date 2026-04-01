import ItemCard from '@/components/item-card';
import { getUser } from '@/lib/auth-server';
import { getWatchlistCount, getWatchlistWithResourceDetailsPaginated } from '@/lib/watchlist';
import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WatchlistContent } from './watchlist-content';

type WatchlistPageProps = {
  searchParams: Promise<{
    mediaType?: string;
    page?: string;
  }>;
};

/**
 * Displays the user's watchlist page, allowing filtering between saved movies and TV shows.
 *
 * Redirects unauthenticated users to the login page. Shows a grid of saved items for the selected media type, or an empty state with a prompt to explore if no items are present.
 *
 * @param props - Contains a promise resolving to search parameters, including the selected media type.
 * @returns The JSX for the watchlist page, with dynamic content based on authentication, media type selection, and saved items.
 */
export default async function WatchlistPage(props: WatchlistPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const mediaType = (searchParams.mediaType ?? 'movie') as 'movie' | 'tv';
  const page = Number(searchParams.page ?? '1');

  const [paginatedData, totalMovies, totalTvShows] = await Promise.all([
    getWatchlistWithResourceDetailsPaginated(mediaType, page),
    getWatchlistCount('movie'),
    getWatchlistCount('tv'),
  ]);

  const items = paginatedData.items.filter((item) => item !== null);

  const grid =
    items.length === 0 ? (
      <div className="py-12 text-center col-span-full">
        <div className="mb-4 text-6xl opacity-50">{mediaType === 'movie' ? '🎬' : '📺'}</div>
        <h2 className="mb-2 text-xl font-semibold">
          No {mediaType === 'movie' ? 'movies' : 'TV shows'} in your watchlist
        </h2>
        <p className="mb-6 text-zinc-400">
          Add some {mediaType === 'movie' ? 'movies' : 'TV shows'} to see them here
        </p>
        <Link
          href={`/discover?mediaType=${mediaType}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
        >
          Explore {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
        </Link>
      </div>
    ) : (
      <div
        id="content-container"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      >
        {items.map((item) => {
          const resourceType = item.resourceType as 'movie' | 'tv';
          return (
            <ItemCard
              key={`${resourceType}-${item.id}`}
              resource={item.resource as MovieDetails | TvDetails}
              type={resourceType}
              userId={user?.id}
            />
          );
        })}
      </div>
    );

  return (
    <WatchlistContent
      userId={user?.id}
      grid={grid}
      totalMovies={totalMovies}
      totalTvShows={totalTvShows}
      totalPages={paginatedData.totalPages}
    />
  );
}
