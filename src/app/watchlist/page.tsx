import ResourceCard from '@/components/resource-card';
import { getUser } from '@/lib/auth-server';
import { getWatchlistWithResourceDetails } from '@/lib/watchlist';
import { MovieDetails } from '@/types/Movie';
import { TvDetails } from '@/types/TvShow';
import Link from 'next/link';
import { redirect } from 'next/navigation';

/**
 * Renders the user's movie watchlist page, displaying saved movies or a prompt to explore movies if the watchlist is empty.
 *
 * Redirects unauthenticated users to the login page.
 *
 * @returns The JSX for the watchlist page, showing either a grid of saved movies or an empty state message with a navigation link.
 */
export default async function WatchlistPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const [watchlistMovies, watchlistTvShows] = await Promise.all([
    getWatchlistWithResourceDetails('movie'),
    getWatchlistWithResourceDetails('tv'),
  ]);

  const allWatchlistItems = [...watchlistMovies, ...watchlistTvShows];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">My Watchlist</h1>
        <p className="text-zinc-400">
          Movies and TV shows you&apos;ve saved to watch later
        </p>
      </div>

      {allWatchlistItems.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">🎬</div>
          <h2 className="mb-2 text-xl font-semibold">
            Your watchlist is empty
          </h2>
          <p className="mb-6 text-zinc-400">
            Start adding movies and TV shows by clicking the star on any detail
            page
          </p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
          >
            Explore Content
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {allWatchlistItems
            .filter((item) => item !== null)
            .map((item) => {
              const resourceType = item.resourceType as 'movie' | 'tv';
              return (
                <ResourceCard
                  key={`${resourceType}-${item.id}`}
                  resource={item.resource as MovieDetails | TvDetails}
                  type={resourceType}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
