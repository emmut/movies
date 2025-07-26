'use server';

import { watchlist } from '@/db/schema/watchlist';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { resourceIdSchema } from '@/lib/validations';
import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';
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
 * Checks if a specific resource is present in the authenticated user's watchlist.
 *
 * @param resourceId - The unique identifier of the resource to check.
 * @param resourceType - The type of resource (e.g., 'movie', 'tv').
 * @returns `true` if the resource is in the user's watchlist; otherwise, `false`.
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
 * Retrieves the authenticated user's watchlist entries of a specified resource type, each augmented with detailed information.
 *
 * For each watchlist entry matching the given {@link resourceType}, fetches detailed data (movie or TV show) and returns only those entries where details were successfully retrieved.
 *
 * @param resourceType - The type of resource to include ('movie' or 'tv').
 * @returns An array of watchlist items, each including a `resource` property with detailed information.
 */
export async function getWatchlistWithResourceDetails(resourceType: string) {
  const userWatchlist = await getUserWatchlist();

  // Filter watchlist items by resourceType first
  const filteredWatchlist = userWatchlist.filter(
    (item) => item.resourceType === resourceType
  );

  const resourcesWithDetails = await Promise.allSettled(
    filteredWatchlist.map(async (item) => {
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
