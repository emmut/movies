import { watchlist } from '@/db/schema';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { and, eq } from 'drizzle-orm';

/**
 * Retrieves the authenticated user's movie watchlist entries.
 *
 * Returns an empty array if the user is not authenticated or if an error occurs during retrieval.
 */
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

/**
 * Determines whether a specific movie is present in the authenticated user's watchlist.
 *
 * @param movieId - The ID of the movie to check.
 * @returns `true` if the movie is in the user's watchlist; otherwise, `false`.
 */
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

/**
 * Retrieves the authenticated user's watchlist entries, each augmented with detailed movie information.
 *
 * For each movie in the user's watchlist, fetches additional details and returns only those entries where movie details were successfully retrieved.
 *
 * @returns An array of watchlist items, each including a `movie` property with detailed information.
 */
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
