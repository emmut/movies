'use server';

import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';

import { listItems, lists } from '@/db/schema/lists';
import { getUser } from '@/lib/auth-server';
import { SYSTEM_LIST_CACHE_TAGS } from '@/lib/cache-tags';
import { db } from '@/lib/db';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';
import { getMovieDetails } from '@/lib/movies';
import {
  pageSchema,
  resourceIdSchema,
  resourceTypeSchema,
  SystemListType,
  systemListTypeSchema,
} from '@/lib/validations';
import { MovieDetails } from '@/types/movie';
import type { ProxyImageUrls } from '@/types/proxy-image';
import { TvDetails } from '@/types/tv-show';

import { ITEMS_PER_PAGE } from './config';
import { getTvShowDetails } from './tv-shows';

type ResourceDetailsWithImage = (MovieDetails | TvDetails) & {
  posterImageUrls?: ProxyImageUrls;
};

const DETAILS_FETCHERS: Record<
  'movie' | 'tv',
  (resourceId: number) => Promise<MovieDetails | TvDetails>
> = {
  movie: getMovieDetails,
  tv: getTvShowDetails,
};

/**
 * Filters list_items joined with lists down to the user's system list of the
 * given type. Use with a `listItems` innerJoin on `lists`.
 */
function systemListItemsFilter(userId: string, listType: SystemListType): SQL | undefined {
  return and(eq(lists.userId, userId), eq(lists.type, listType));
}

/**
 * Checks if a specific resource is present in the authenticated user's system
 * list of the given type.
 *
 * @returns `true` if the resource is in the list; otherwise, `false`.
 */
export async function isResourceInSystemList(
  listType: SystemListType,
  resourceId: number,
  resourceType: string,
) {
  const user = await getUser();
  if (!user) {
    return false;
  }

  return await getCachedSystemListMembership(user.id, listType, resourceId, resourceType);
}

async function getCachedSystemListMembership(
  userId: string,
  listType: SystemListType,
  resourceId: number,
  resourceType: string,
) {
  'use cache: private';
  const tags = SYSTEM_LIST_CACHE_TAGS[systemListTypeSchema.parse(listType)];
  cacheTag(tags.item(userId, resourceType, resourceId));
  cacheTag(tags.list(userId, resourceType));
  cacheLife('privateShort');

  try {
    const validatedResourceId = resourceIdSchema.parse({
      resourceId,
      resourceType,
    });

    const result = await db
      .select({ id: listItems.id })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(
        and(
          systemListItemsFilter(userId, listType),
          eq(listItems.resourceId, validatedResourceId.resourceId),
          eq(listItems.resourceType, validatedResourceId.resourceType),
        ),
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error(`Error checking ${listType}:`, error);
    return false;
  }
}

/**
 * Membership of a resource in each system list, for the detail-page buttons.
 * Both checks short-circuit to false for anonymous visitors.
 */
export async function getSystemListMemberships(resourceId: number, resourceType: string) {
  const [inWatchlist, watched] = await Promise.all([
    isResourceInSystemList('watchlist', resourceId, resourceType),
    isResourceInSystemList('watched', resourceId, resourceType),
  ]);

  return { inWatchlist, watched };
}

/**
 * Retrieves a paginated list of the authenticated user's system list entries
 * of a specified resource type, each augmented with detailed information.
 * Most recently added first.
 *
 * @param listType - The system list to read ('watchlist' or 'watched').
 * @param resourceType - The type of resource to include ('movie' or 'tv').
 * @param page - The page number (1-based).
 * @returns An object containing the paginated items and pagination metadata.
 */
export async function getSystemListWithResourceDetailsPaginated(
  listType: SystemListType,
  resourceType: 'movie' | 'tv',
  page: number = 1,
) {
  if (!resourceTypeSchema.safeParse(resourceType).success || !pageSchema.safeParse(page).success) {
    throw new Error('Invalid resource type or page number');
  }
  systemListTypeSchema.parse(listType);

  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    return await queryPageWithResourceDetails(user.id, listType, resourceType, page);
  } catch (error) {
    console.error(`Error fetching paginated ${listType}:`, error);
    return emptyPage(page);
  }
}

async function queryPageWithResourceDetails(
  userId: string,
  listType: SystemListType,
  resourceType: 'movie' | 'tv',
  page: number,
) {
  const filter = and(
    systemListItemsFilter(userId, listType),
    eq(listItems.resourceType, resourceType),
  );

  const totalCountResult = await db
    .select({ count: count() })
    .from(listItems)
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .where(filter);

  const totalItems = totalCountResult[0]?.count || 0;
  if (totalItems === 0) {
    return emptyPage(page);
  }

  const rows = await db
    .select({
      id: listItems.id,
      resourceId: listItems.resourceId,
      resourceType: listItems.resourceType,
      createdAt: listItems.createdAt,
    })
    .from(listItems)
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .where(filter)
    .orderBy(asc(listItems.position), desc(listItems.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset((page - 1) * ITEMS_PER_PAGE);

  return {
    items: await hydrateResourceDetails(rows, resourceType),
    totalItems,
    totalPages: Math.ceil(totalItems / ITEMS_PER_PAGE),
    currentPage: page,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

type SystemListItemRow = {
  id: string;
  resourceId: number;
  resourceType: string;
  createdAt: Date;
};

/**
 * Attaches TMDB details and proxied poster urls to each row. Rows whose
 * details fetch fails are dropped rather than failing the page.
 */
async function hydrateResourceDetails(rows: SystemListItemRow[], resourceType: 'movie' | 'tv') {
  const settled = await Promise.allSettled(
    rows.map(async (row) => {
      const details = await DETAILS_FETCHERS[resourceType](row.resourceId);
      const resource: ResourceDetailsWithImage = {
        ...details,
        posterImageUrls: buildProxyImageUrls(details.poster_path, {
          width: 500,
          fill: true,
        }),
      };
      return { ...row, resource };
    }),
  );

  return settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
}

function emptyPage(page: number) {
  return {
    items: [] as Awaited<ReturnType<typeof hydrateResourceDetails>>,
    totalItems: 0,
    totalPages: 0,
    currentPage: page,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

/**
 * Gets the total count of items in the user's system list for a specific
 * resource type.
 *
 * @param listType - The system list to count ('watchlist' or 'watched').
 * @param resourceType - The type of resource to count ('movie' or 'tv').
 * @returns The total number of items for the specified resource type.
 */
export async function getSystemListCount(listType: SystemListType, resourceType: string) {
  const user = await getUser();
  if (!user) {
    return 0;
  }

  return await getCachedSystemListCount(user.id, listType, resourceType);
}

async function getCachedSystemListCount(
  userId: string,
  listType: SystemListType,
  resourceType: string,
) {
  'use cache: private';
  const tags = SYSTEM_LIST_CACHE_TAGS[systemListTypeSchema.parse(listType)];
  cacheTag(tags.count(userId, resourceType));
  cacheTag(tags.list(userId, resourceType));
  cacheLife('privateShort');

  try {
    const result = await db
      .select({ count: count() })
      .from(listItems)
      .innerJoin(lists, eq(listItems.listId, lists.id))
      .where(and(systemListItemsFilter(userId, listType), eq(listItems.resourceType, resourceType)));

    return result[0]?.count || 0;
  } catch (error) {
    console.error(`Error counting ${listType} items:`, error);
    return 0;
  }
}
