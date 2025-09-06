import ItemCard from '@/components/item-card';
import MediaTypeSelector from '@/components/media-type-selector';
import { PaginationControls } from '@/components/pagination-controls';
import SectionTitle from '@/components/section-title';
import { getUser } from '@/lib/auth-server';
import {
  getWatchlistCount,
  getWatchlistWithResourceDetailsPaginated,
} from '@/lib/watchlist';
import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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
  const itemsPerPage = 20;

  // Get paginated data for the current media type and total counts for both types
  const [paginatedData, totalMovies, totalTvShows] = await Promise.all([
    getWatchlistWithResourceDetailsPaginated(mediaType, page, itemsPerPage),
    getWatchlistCount('movie'),
    getWatchlistCount('tv'),
  ]);

  const { items: filteredItems, totalPages } = paginatedData;
  const totalItems = totalMovies + totalTvShows;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <SectionTitle>My Watchlist</SectionTitle>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-zinc-400">
              {mediaType === 'movie'
                ? `${totalMovies} movie${totalMovies !== 1 ? 's' : ''} saved`
                : `${totalTvShows} TV show${totalTvShows !== 1 ? 's' : ''} saved`}
            </p>
            {totalItems > 0 && (
              <span className="text-zinc-500">
                • Total: {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <MediaTypeSelector currentMediaType={mediaType} />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">
            {mediaType === 'movie' ? '🎬' : '📺'}
          </div>
          <h2 className="mb-2 text-xl font-semibold">
            {totalItems === 0
              ? 'Your watchlist is empty'
              : `No ${mediaType === 'movie' ? 'movies' : 'TV shows'} in your watchlist`}
          </h2>
          <p className="mb-6 text-zinc-400">
            {totalItems === 0
              ? `Start adding ${mediaType === 'movie' ? 'movies' : 'TV shows'} by clicking the star on any detail page`
              : `Add some ${mediaType === 'movie' ? 'movies' : 'TV shows'} to see them here`}
          </p>
          <Link
            href={`/discover?mediaType=${mediaType}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
          >
            Explore {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredItems
            .filter((item) => item !== null)
            .map((item) => {
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
      )}

      {filteredItems.length > 0 && totalPages > 1 && (
        <PaginationControls totalPages={totalPages} pageType="watchlist" />
      )}
    </div>
  );
}
