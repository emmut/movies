import { watchlist } from '@/db/schema';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { and, eq } from 'drizzle-orm';

export async function getUserWatchlist() {
  const user = await getUser();
  if (!user) {
    return [];
  }

  try {
    const userWatchlist = await db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, user.id));

    return userWatchlist;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
}

export async function isMovieInWatchlist(movieId: number) {
  const user = await getUser();
  if (!user) {
    return false;
  }

  try {
    const result = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.movieId, String(movieId))
        )
      );

    return result.length > 0;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}

export async function getWatchlistWithMovieDetails() {
  const userWatchlist = await getUserWatchlist();

  const moviesWithDetails = await Promise.allSettled(
    userWatchlist.map(async (item) => {
      const movieDetails = await getMovieDetails(parseInt(item.movieId));
      return {
        ...item,
        movie: movieDetails,
      };
    })
  );

  return moviesWithDetails
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
}
