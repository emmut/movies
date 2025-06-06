import MovieCard from '@/components/movie-card';
import { getUser } from '@/lib/auth-server';
import { getWatchlistWithMovieDetails } from '@/lib/watchlist';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function WatchlistPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const watchlistMovies = await getWatchlistWithMovieDetails();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">My Watchlist</h1>
        <p className="text-zinc-400">Movies you've saved to watch later</p>
      </div>

      {watchlistMovies.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">🎬</div>
          <h2 className="mb-2 text-xl font-semibold">
            Your watchlist is empty
          </h2>
          <p className="mb-6 text-zinc-400">
            Start adding movies by clicking the star on any movie page
          </p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
          >
            Explore Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {watchlistMovies.map((item) => (
            <MovieCard key={item.id} movie={item.movie} />
          ))}
        </div>
      )}
    </div>
  );
}
