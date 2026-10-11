'use server';

import { moveIdToIndex } from '@movies/api/list-order';
import { pageWindow } from '@movies/api/paginate';
import { fulfilledValues } from '@movies/api/settled';
import { parseWatchProviderFilter } from '@movies/api/system-lists';
import { createListItemOrderingStore } from '@movies/db/list-item-order';
import {
  createOrderingLock,
  listItemOrderingScope,
  listOrderingScope,
  nextPosition,
  rewriteListPositions,
} from '@movies/db/ordering-lock';
import { listItems, lists } from '@movies/db/schema/lists';
import { streamableOnProviders } from '@movies/db/title-availability';
import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { cacheLife, cacheTag, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth-server';
import {
  revalidateUserListCache,
  revalidateUserListStatusCache,
  revalidateUserSystemListPageCache,
} from '@/lib/cache-invalidation';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { db } from '@/lib/db';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';
import { scheduleTitleSync } from '@/lib/title-sync-server';
import {
  createListSchema,
  listIdSchema,
  listItemSchema,
  mediaIdSchema,
  mediaTypeSchema,
  moveListItemSchema,
  moveListSchema,
  pageSchema,
  removeListItemSchema,
  SystemListType,
  updateListSchema,
  WatchProviderFilter,
} from '@/lib/validations';
import { ensureAvailabilityKnown } from '@/lib/watch-provider-availability';

import { ITEMS_PER_PAGE, LISTS_PER_PAGE } from './config';

export interface LocalList {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  items?: Array<{
    id: string;
    resourceId: number;
    resourceType: string;
    createdAt: Date;
  }>;
}

const withOrderingLock = createOrderingLock(db);
const listItemOrdering = createListItemOrderingStore(db);

const CUSTOM_LIST_TYPE = 'custom' as const;

/**
 * Scopes every lists query to the user's custom lists, excluding system lists
 * like the watchlist (which has its own UI and must never surface here).
 */
function ownedCustomListsFilter(userId: string) {
  return and(eq(lists.userId, userId), eq(lists.type, CUSTOM_LIST_TYPE));
}

/**
 * Canonical sort for a user's custom lists: the manual `position` first, with
 * newest-first as a tiebreak for rows that predate manual ordering (all 0).
 * Every query that renders lists must use this so reordering stays coherent.
 */
function manualListOrder() {
  return [asc(lists.position), desc(lists.createdAt)];
}

/**
 * Canonical sort for the items in a list: the manual `position` first, with
 * newest-first as a tiebreak for rows that predate manual ordering (all 0).
 * Every query that renders list items must use this so reordering stays
 * coherent.
 */
function itemManualOrder() {
  return [asc(listItems.position), desc(listItems.createdAt)];
}

/**
 * Asserts that a custom list exists and belongs to the given user.
 *
 * @throws {Error} 'List not found' when the list does not exist, is owned by
 * another user, or is a system list (e.g. the watchlist).
 */
async function assertCustomListOwnership(listId: string, userId: string) {
  const [{ count: ownedCount }] = await db
    .select({ count: count() })
    .from(lists)
    .where(and(eq(lists.id, listId), ownedCustomListsFilter(userId)));

  if (ownedCount === 0) {
    throw new Error('List not found');
  }
}

/**
 * Returns the custom list with the given id if it exists and is owned by the
 * authenticated user; `null` otherwise (including for system lists).
 */
export async function getOwnedCustomList(listId: string): Promise<{ id: string } | null> {
  const user = await requireUser();

  if (!listIdSchema.safeParse(listId).success) {
    return null;
  }

  const result = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), ownedCustomListsFilter(user.id)))
    .limit(1);

  return result[0] ?? null;
}

export async function getUserListCount() {
  const user = await requireUser();

  return await getCachedUserListCount(user.id);
}

async function getCachedUserListCount(userId: string) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.lists(userId));
  cacheLife('privateShort');

  try {
    const rows = await db
      .select({ count: count() })
      .from(lists)
      .where(ownedCustomListsFilter(userId));

    return rows[0]?.count ?? 0;
  } catch (error) {
    console.error('Error fetching user list count:', error);
    return 0;
  }
}

/**
 * Retrieves a paginated list of the authenticated user's lists with item counts.
 *
 * @param page - The page number (1-based).
 * @param itemsPerPage - The number of lists per page.
 * @returns An object containing the paginated lists and pagination metadata.
 */
export async function getUserListsPaginated(page: number = 1) {
  const user = await requireUser();

  if (!pageSchema.safeParse(page).success) {
    redirect('/lists');
  }

  try {
    const totalCountResult = await db
      .select({ count: count() })
      .from(lists)
      .where(ownedCustomListsFilter(user.id));

    const totalItems = totalCountResult[0]?.count ?? 0;
    const { offset, ...pagination } = pageWindow(totalItems, page, LISTS_PER_PAGE);

    if (totalItems === 0) {
      return { lists: [], ...pagination };
    }

    const listsWithCounts = await db
      .select({
        id: lists.id,
        name: lists.name,
        description: lists.description,
        emoji: lists.emoji,
        createdAt: lists.createdAt,
        updatedAt: lists.updatedAt,
        itemCount: count(listItems.id),
      })
      .from(lists)
      .leftJoin(listItems, eq(lists.id, listItems.listId))
      .where(ownedCustomListsFilter(user.id))
      .groupBy(lists.id)
      .orderBy(...manualListOrder())
      .limit(LISTS_PER_PAGE)
      .offset(offset);

    return { lists: listsWithCounts, ...pagination };
  } catch (error) {
    console.error('Error fetching paginated user lists:', error);
    const currentPage = Math.max(1, page);
    return {
      lists: [],
      totalItems: 0,
      totalPages: 0,
      currentPage,
      itemsPerPage: LISTS_PER_PAGE,
    };
  }
}

/**
 * Retrieves paginated list details with items for a specific list.
 *
 * @param listId - The ID of the list to retrieve.
 * @param page - The page number (1-based).
 * @param itemsPerPage - The number of items per page.
 * @returns An object containing the list details, paginated items, and pagination metadata.
 */
async function getListDetailsPaginated(
  listId: string,
  page: number = 1,
  providerFilter: WatchProviderFilter | null = null,
) {
  const user = await requireUser();

  validateListDetailsParams(listId, page);

  const list = await fetchOwnedCustomListRow(listId, user.id);

  if (providerFilter) {
    return await queryProviderFilteredListPage(list, page, providerFilter);
  }

  return await queryUnfilteredListPage(list, page);
}

function validateListDetailsParams(listId: string, page: number) {
  if (!listIdSchema.safeParse(listId).success) {
    redirect('/lists');
  }

  if (!pageSchema.safeParse(page).success) {
    redirect(`/lists/${listId}`);
  }
}

/** @throws {Error} 'List not found' unless the list is an owned custom list. */
async function fetchOwnedCustomListRow(listId: string, userId: string) {
  const listResult = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), ownedCustomListsFilter(userId)));

  if (listResult.length === 0) {
    throw new Error('List not found');
  }

  return listResult[0];
}

/** Number of `list_items` rows matching `where`. */
async function countListItems(where: SQL | undefined) {
  const rows = await db.select({ count: count() }).from(listItems).where(where);
  return rows[0]?.count ?? 0;
}

/** One page of the list items matching `where`, in manual order. */
async function selectListItemsPage(where: SQL | undefined, totalItems: number, page: number) {
  const { offset, ...pagination } = pageWindow(totalItems, page, ITEMS_PER_PAGE);
  if (totalItems === 0) {
    return { items: [], ...pagination };
  }

  const items = await db
    .select()
    .from(listItems)
    .where(where)
    .orderBy(...itemManualOrder())
    .limit(ITEMS_PER_PAGE)
    .offset(offset);
  return { items, ...pagination };
}

async function queryUnfilteredListPage(list: typeof lists.$inferSelect, page: number) {
  const where = eq(listItems.listId, list.id);
  const totalItems = await countListItems(where);
  const itemsPage = await selectListItemsPage(where, totalItems, page);

  return { ...list, ...itemsPage, itemCount: totalItems };
}

/**
 * Stream-provider-filtered page of a custom list. Availability is cached
 * locally (see `title_availability`), so the filter is a predicate on the
 * items query and counting and paging stay in the database; person items
 * never match. Rows that predate the cache are synced first. `itemCount`
 * stays the unfiltered total so headers and delete confirmations keep
 * describing the whole list, while the pagination metadata reflects the
 * filtered set.
 */
async function queryProviderFilteredListPage(
  list: typeof lists.$inferSelect,
  page: number,
  providerFilter: WatchProviderFilter,
) {
  const scope = eq(listItems.listId, list.id);
  await ensureAvailabilityKnown(scope);

  const where = and(scope, streamableOnProviders(providerFilter));
  const itemCount = await countListItems(scope);
  const totalItems = await countListItems(where);
  const itemsPage = await selectListItemsPage(where, totalItems, page);

  return { ...list, ...itemsPage, itemCount };
}

/**
 * Fetches list details with all resource details populated.
 * Helper function to avoid code duplication.
 *
 * @param watchProviders - When non-empty, only items streamable on any of
 * these TMDB provider ids (in `watchRegion`) are returned.
 * @param watchRegion - The region used for the provider availability check.
 */
export async function getListDetailsWithResources(
  listId: string,
  page: number = 1,
  watchProviders?: number[],
  watchRegion?: string,
) {
  const { getMovieDetails } = await import('@/lib/movies');
  const { getTvShowDetails } = await import('@/lib/tv-shows');
  const { getPersonDetails } = await import('@/lib/persons');

  const providerFilter = parseWatchProviderFilter(watchProviders, watchRegion);
  const paginatedList = await getListDetailsPaginated(listId, page, providerFilter);

  // Fetch details for paginated items only
  const items = paginatedList.items;
  function resourceIdsOf(resourceType: string) {
    return items.filter((item) => item.resourceType === resourceType).map((item) => item.resourceId);
  }

  const [movies, tvShows, persons] = await Promise.all([
    fulfilledValues(resourceIdsOf('movie'), getMovieDetails),
    fulfilledValues(resourceIdsOf('tv'), getTvShowDetails),
    fulfilledValues(resourceIdsOf('person'), getPersonDetails),
  ]);

  const listItemIdByResource = new Map<string, string>();
  for (const item of paginatedList.items) {
    listItemIdByResource.set(`${item.resourceType}-${item.resourceId}`, item.id);
  }

  const allItems = [
    ...movies.map((movie) => ({
      ...movie,
      posterImageUrls: buildProxyImageUrls(movie.poster_path, {
        width: 500,
        fill: true,
      }),
      resourceType: 'movie' as const,
      listItemId: listItemIdByResource.get(`movie-${movie.id}`)!,
    })),
    ...tvShows.map((show) => ({
      ...show,
      posterImageUrls: buildProxyImageUrls(show.poster_path, {
        width: 500,
        fill: true,
      }),
      resourceType: 'tv' as const,
      listItemId: listItemIdByResource.get(`tv-${show.id}`)!,
    })),
    ...persons.map((person) => ({
      ...person,
      profileImageUrls: person.profile_path
        ? buildProxyImageUrls(person.profile_path, {
            width: 500,
            fill: true,
          })
        : undefined,
      resourceType: 'person' as const,
      listItemId: listItemIdByResource.get(`person-${person.id}`)!,
    })),
  ];

  return {
    ...paginatedList,
    allItems,
  };
}

export async function createList(name: string, description: string = '', emoji: string = '📝') {
  const user = await requireUser();

  const validatedData = createListSchema.parse({
    name,
    description,
    emoji,
  });

  const listId = crypto.randomUUID();

  // Locked so concurrent creates can't read the same max(position) and append
  // to the same slot.
  await withOrderingLock(listOrderingScope(user.id), async (tx) => {
    // Append to the end of the user's manual ordering.
    const position = await nextPosition(tx, lists, ownedCustomListsFilter(user.id));
    await tx.insert(lists).values({
      id: listId,
      userId: user.id,
      name: validatedData.name,
      description: validatedData.description,
      emoji: validatedData.emoji,
      position,
    });
  });

  revalidateUserListCache(user.id, listId);

  revalidatePath('/lists');

  return { success: true, listId };
}

export async function addToList(
  listId: string,
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'person',
) {
  const user = await requireUser();

  const validatedData = listItemSchema.parse({
    listId,
    resourceId: mediaId,
    resourceType: mediaType,
  });

  await assertCustomListOwnership(validatedData.listId, user.id);

  try {
    // Locked so concurrent adds can't read the same max(position) and append
    // to the same slot.
    await withOrderingLock(listItemOrderingScope(validatedData.listId), async (tx) => {
      // Append to the end of the list's manual ordering.
      const position = await nextPosition(tx, listItems, eq(listItems.listId, validatedData.listId));
      await tx.insert(listItems).values({
        id: crypto.randomUUID(),
        listId: validatedData.listId,
        resourceId: validatedData.resourceId,
        resourceType: validatedData.resourceType,
        position,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      throw new Error('Item already in list');
    }
    throw error;
  }

  // Write the title's details and availability through to the local cache so
  // the provider filter can answer from SQL without a TMDB round-trip.
  scheduleTitleSync(validatedData.resourceType, validatedData.resourceId);

  revalidateUserListCache(user.id, validatedData.listId);
  revalidateUserListStatusCache(user.id, validatedData.resourceType, validatedData.resourceId);

  revalidatePath(`/lists/${validatedData.listId}`);
  revalidatePath('/lists');
}

export async function removeFromList(
  listId: string,
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'person',
) {
  const user = await requireUser();

  const validatedData = removeListItemSchema.parse({
    listId,
    resourceId: mediaId,
    resourceType: mediaType,
  });

  await assertCustomListOwnership(validatedData.listId, user.id);

  await db
    .delete(listItems)
    .where(
      and(
        eq(listItems.listId, validatedData.listId),
        eq(listItems.resourceId, validatedData.resourceId),
        eq(listItems.resourceType, validatedData.resourceType),
      ),
    );

  revalidateUserListCache(user.id, validatedData.listId);
  revalidateUserListStatusCache(user.id, validatedData.resourceType, validatedData.resourceId);

  revalidatePath(`/lists/${validatedData.listId}`);
  revalidatePath('/lists');
}

export async function deleteList(listId: string) {
  const user = await requireUser();

  if (!listIdSchema.safeParse(listId).success) {
    throw new Error('Invalid list ID');
  }

  await assertCustomListOwnership(listId, user.id);

  await db.delete(lists).where(eq(lists.id, listId));

  revalidateUserListCache(user.id, listId);

  revalidatePath('/lists');
}

export async function updateList(
  listId: string,
  name: string,
  description: string = '',
  emoji: string = '📝',
) {
  const user = await requireUser();

  const validatedData = updateListSchema.parse({
    listId,
    name,
    description,
    emoji,
  });

  await assertCustomListOwnership(validatedData.listId, user.id);

  await db
    .update(lists)
    .set({
      name: validatedData.name,
      description: validatedData.description,
      emoji: validatedData.emoji,
      updatedAt: new Date(),
    })
    .where(eq(lists.id, validatedData.listId));

  revalidateUserListCache(user.id, validatedData.listId);

  revalidatePath(`/lists/${validatedData.listId}`);
  revalidatePath('/lists');
}

/**
 * Moves a custom list to a new spot in the user's manual ordering.
 *
 * @param listId - The list to move.
 * @param position - Target 0-based index across all of the user's custom
 * lists (not just the current page); clamped to the valid range.
 */
export async function moveList(listId: string, position: number) {
  const user = await requireUser();

  const validatedData = moveListSchema.parse({ listId, position });

  // The current order is read and rewritten under one lock so a concurrent
  // move can't compute from a stale snapshot and overwrite this one.
  await withOrderingLock(listOrderingScope(user.id), async (tx) => {
    const orderedRows = await tx
      .select({ id: lists.id })
      .from(lists)
      .where(ownedCustomListsFilter(user.id))
      .orderBy(...manualListOrder());

    const orderedIds = moveIdToIndex(
      orderedRows.map((row) => row.id),
      validatedData.listId,
      validatedData.position,
    );

    if (orderedIds === null) {
      throw new Error('List not found');
    }

    await rewriteListPositions(tx, user.id, orderedIds);
  });

  revalidateUserListCache(user.id);

  revalidatePath('/lists');
}

/**
 * Moves a list item to a new spot in its list's manual ordering.
 *
 * @param itemId - The list item (row) to move.
 * @param position - Target 0-based index across the items being reordered;
 *   clamped to the valid range.
 * @param resourceType - When provided, the move is scoped to the items of that
 *   resource type within the list (used by the watchlist/watched system lists,
 *   which render one media type at a time). Omit for custom lists, which
 *   reorder every item in the list regardless of type.
 */
export async function moveListItem(
  itemId: string,
  position: number,
  resourceType?: 'movie' | 'tv' | 'person',
) {
  const user = await requireUser();

  const validatedData = moveListItemSchema.parse({ itemId, position, resourceType });

  const { listId, listType } = await listItemOrdering.move(user.id, validatedData);

  if (listType === 'custom') {
    revalidateUserListCache(user.id, listId);
    revalidatePath(`/lists/${listId}`);
  } else {
    revalidateUserSystemListPageCache(user.id, listType as SystemListType);
    revalidatePath(`/${listType}`);
  }
}

export async function getUserListsWithStatus(
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'person',
) {
  const user = await requireUser();

  if (!mediaIdSchema.safeParse(mediaId).success) {
    throw new Error('Invalid media ID');
  }
  if (!mediaTypeSchema.safeParse(mediaType).success) {
    throw new Error('Invalid media type');
  }

  return await getCachedUserListsWithStatus(user.id, mediaId, mediaType);
}

async function getCachedUserListsWithStatus(
  userId: string,
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'person',
) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.lists(userId));
  cacheTag(CACHE_TAGS.private.listStatus(userId, mediaType, mediaId));
  cacheLife('privateShort');

  try {
    const listsWithStatusAndCounts = await db
      .select({
        id: lists.id,
        name: lists.name,
        description: lists.description,
        emoji: lists.emoji,
        createdAt: lists.createdAt,
        updatedAt: lists.updatedAt,
        itemCount: count(listItems.id),
        hasItem: sql<boolean>`bool_or(
          ${listItems.resourceId} = ${mediaId} AND
          ${listItems.resourceType} = ${mediaType}
        )`.mapWith(Boolean),
      })
      .from(lists)
      .leftJoin(listItems, eq(lists.id, listItems.listId))
      .where(ownedCustomListsFilter(userId))
      .groupBy(
        lists.id,
        lists.name,
        lists.description,
        lists.emoji,
        lists.createdAt,
        lists.updatedAt,
      )
      .orderBy(...manualListOrder());

    return listsWithStatusAndCounts;
  } catch (error) {
    console.error('Error fetching user lists with status:', error);
    throw new Error('Failed to fetch user lists');
  }
}

export type UserListsWithStatus = Awaited<ReturnType<typeof getUserListsWithStatus>>;
