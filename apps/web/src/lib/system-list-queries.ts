'use server';

import { MovieDetails } from '@movies/api/tmdb-types/movie';
import { TvDetails } from '@movies/api/tmdb-types/tv-show';
import { parseWatchProviderFilter } from '@movies/api/system-lists';
import { createSystemListStore } from '@movies/db/system-lists';
import { cacheLife, cacheTag } from 'next/cache';

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
  WatchProviderFilter,
} from '@/lib/validations';
import {
  ensureAvailabilityKnown,
} from '@/lib/watch-provider-availability';
import type { ProxyImageUrls } from '@/types/proxy-image';

import { ITEMS_PER_PAGE } from './config';
import { getTvShowDetails } from './tv-shows';

type SystemListItemFields<T extends 'movie' | 'tv'> = {
  resourceType: T;
  /** The list_items row id — what the reorder actions operate on. */
  listItemId: string;
  posterImageUrls?: ProxyImageUrls;
};

/**
 * A grid-ready system-list entry: TMDB details with the `resourceType`
 * discriminant paired to the matching details type, so consumers need no
 * casts.
 */
export type SystemListItem =
  | (MovieDetails & SystemListItemFields<'movie'>)
  | (TvDetails & SystemListItemFields<'tv'>);

const systemLists = createSystemListStore(db);

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

    return await systemLists.membership(userId, listType, validatedResourceId.resourceId, validatedResourceId.resourceType);
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
 * @param watchProviders - When non-empty, only items streamable on any of
 * these TMDB provider ids (in `watchRegion`) are returned.
 * @param watchRegion - The region used for the provider availability check.
 * @returns An object containing the paginated items and pagination metadata.
 */
export async function getSystemListWithResourceDetailsPaginated(
  listType: SystemListType,
  resourceType: 'movie' | 'tv',
  page: number = 1,
  watchProviders?: number[],
  watchRegion?: string,
) {
  if (!resourceTypeSchema.safeParse(resourceType).success || !pageSchema.safeParse(page).success) {
    throw new Error('Invalid resource type or page number');
  }
  systemListTypeSchema.parse(listType);
  const providerFilter = parseWatchProviderFilter(watchProviders, watchRegion);

  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    return await queryPageWithResourceDetails(
      user.id,
      listType,
      resourceType,
      page,
      providerFilter,
    );
  } catch (error) {
    console.error(`Error fetching paginated ${listType}:`, error);
    // With a provider filter active, an empty page reads as "nothing matches
    // your providers" — a lie during an outage. Let the client show an error.
    if (providerFilter) {
      throw error;
    }
    return emptyPage(page);
  }
}

async function queryPageWithResourceDetails(
  userId: string,
  listType: SystemListType,
  resourceType: 'movie' | 'tv',
  page: number,
  providerFilter: WatchProviderFilter | null,
) {
  const result = await systemLists.pageRows(userId, listType, resourceType, page, providerFilter, ensureAvailabilityKnown);
  return { ...result, items: await hydrateResourceDetails(result.items, resourceType) };
}

type SystemListItemRow = {
  id: string;
  resourceId: number;
  resourceType: string;
  createdAt: Date;
};

/**
 * Fetches TMDB details for one row and shapes it for the list grid. Fetched
 * per branch so the `resourceType` literal stays paired with the matching
 * details type.
 */
async function fetchListItem(
  row: SystemListItemRow,
  resourceType: 'movie' | 'tv',
): Promise<SystemListItem> {
  if (resourceType === 'movie') {
    const details = await getMovieDetails(row.resourceId);
    return { ...details, resourceType, listItemId: row.id, posterImageUrls: posterUrls(details) };
  }
  const details = await getTvShowDetails(row.resourceId);
  return { ...details, resourceType, listItemId: row.id, posterImageUrls: posterUrls(details) };
}

function posterUrls(details: MovieDetails | TvDetails) {
  return buildProxyImageUrls(details.poster_path, { width: 500, fill: true });
}

/**
 * Attaches TMDB details and proxied poster urls to each row. Rows whose
 * details fetch fails are dropped rather than failing the page.
 */
async function hydrateResourceDetails(
  rows: SystemListItemRow[],
  resourceType: 'movie' | 'tv',
): Promise<SystemListItem[]> {
  const settled = await Promise.allSettled(rows.map((row) => fetchListItem(row, resourceType)));

  return settled.filter((result) => result.status === 'fulfilled').map((result) => result.value);
}

function emptyPage(page: number) {
  return {
    items: [] as SystemListItem[],
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
    return await systemLists.countItems(userId, listType, resourceType);
  } catch (error) {
    console.error(`Error counting ${listType} items:`, error);
    return 0;
  }
}
