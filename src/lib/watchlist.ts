import { watchlist } from '@/db/schema';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { resourceIdSchema } from '@/lib/validations';
import { MovieDetails } from '@/types/Movie';
import { TvDetails } from '@/types/TvShow';
import { and, eq } from 'drizzle-orm';
import { getTvShowDetails } from './tv-shows';

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
 * @param resourceId - The ID of the resource to check (as string, will be converted to number).
 * @param resourceType - The type of resource to check.
 * @returns `true` if the movie is in the user's watchlist; otherwise, `false`.
 */
export async function isResourceInWatchlist(
  resourceId: number,
  resourceType: string
) {
  const user = await getUser();
  if (!user) {
    return false;
  }

  try {
    const validatedResourceId = resourceIdSchema.parse({
      resourceId,
      resourceType,
    });

    const result = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceId, validatedResourceId.resourceId),
          eq(watchlist.resourceType, validatedResourceId.resourceType)
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
 * @returns An array of watchlist items, each including a `resource` property with detailed information.
 */
export async function getWatchlistWithResourceDetails(resourceType: string) {
  const userWatchlist = await getUserWatchlist();

  const resourcesWithDetails = await Promise.allSettled(
    userWatchlist.map(async (item) => {
      let resourceDetails: MovieDetails | TvDetails | null = null;
      if (resourceType === 'movie') {
        resourceDetails = await getMovieDetails(item.resourceId);
      } else if (resourceType === 'tv') {
        resourceDetails = await getTvShowDetails(item.resourceId);
      }

      if (!resourceDetails) {
        return null;
      }

      return {
        ...item,
        resource: resourceDetails,
      };
    })
  );

  return resourcesWithDetails
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
}
