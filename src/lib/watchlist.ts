'use server';

import { watchlist } from '@/db/schema/watchlist';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { pageSchema, resourceIdSchema } from '@/lib/validations';
import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';
import { and, count, eq } from 'drizzle-orm';
import { ITEMS_PER_PAGE } from './config';
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

/**
 * Retrieves a paginated list of the authenticated user's watchlist entries of a specified resource type, each augmented with detailed information.
 *
 * @param resourceType - The type of resource to include ('movie' or 'tv').
 * @param page - The page number (1-based).
 * @param itemsPerPage - The number of items per page.
 * @returns An object containing the paginated watchlist items and pagination metadata.
 */
export async function getWatchlistWithResourceDetailsPaginated(
  resourceType: 'movie' | 'tv',
  page: number = 1
) {
  if (
    !resourceIdSchema.safeParse(resourceType).success ||
    !pageSchema.safeParse(page).success
  ) {
    throw new Error('Invalid resource type or page number');
  }

  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const totalCountResult = await db
      .select({ count: count() })
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceType, resourceType)
        )
      );

    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalItems === 0) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        itemsPerPage: ITEMS_PER_PAGE,
      };
    }

    const offset = (page - 1) * ITEMS_PER_PAGE;
    const paginatedWatchlist = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceType, resourceType)
        )
      )
      .limit(ITEMS_PER_PAGE)
      .offset(offset);

    const resourcesWithDetails = await Promise.allSettled(
      paginatedWatchlist.map(async (item) => {
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

    const items = resourcesWithDetails
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)
      .filter((item) => item !== null);

    return {
      items,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  } catch (error) {
    console.error('Error fetching paginated watchlist:', error);
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: page,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  }
}

/**
 * Gets the total count of watchlist items for a specific resource type.
 *
 * @param resourceType - The type of resource to count ('movie' or 'tv').
 * @returns The total number of items in the watchlist for the specified resource type.
 */
export async function getWatchlistCount(resourceType: string) {
  const user = await getUser();
  if (!user) {
    return 0;
  }

  try {
    const result = await db
      .select({ count: count() })
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceType, resourceType)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error counting watchlist items:', error);
    return 0;
  }
}
