'use server';

import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { cacheLife, cacheTag, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { listItems, lists } from '@/db/schema/lists';
import { requireUser } from '@/lib/auth-server';
import {
  revalidateUserListCache,
  revalidateUserListStatusCache,
  revalidateUserSystemListPageCache,
} from '@/lib/cache-invalidation';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { db } from '@/lib/db';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';
import { moveIdToIndex } from '@/lib/list-order';
import {
  listItemOrderingScope,
  listOrderingScope,
  withOrderingLock,
  type OrderingTx,
} from '@/lib/ordering-lock';
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
} from '@/lib/validations';

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
    .select({ count: sql`count(*)`.mapWith(Number) })
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
    const count = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(lists)
      .where(ownedCustomListsFilter(userId));

    return count[0].count;
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
    const totalPages = Math.ceil(totalItems / LISTS_PER_PAGE);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    if (totalItems === 0) {
      return {
        lists: [],
        totalItems: 0,
        totalPages: 0,
        currentPage,
        itemsPerPage: LISTS_PER_PAGE,
      };
    }

    const offset = Math.max(0, (currentPage - 1) * LISTS_PER_PAGE);
    const listsWithCounts = await db
      .select({
        id: lists.id,
        name: lists.name,
        description: lists.description,
        emoji: lists.emoji,
        createdAt: lists.createdAt,
        updatedAt: lists.updatedAt,
        itemCount: sql`count(${listItems.id})`.mapWith(Number),
      })
      .from(lists)
      .leftJoin(listItems, eq(lists.id, listItems.listId))
      .where(ownedCustomListsFilter(user.id))
      .groupBy(lists.id)
      .orderBy(...manualListOrder())
      .limit(LISTS_PER_PAGE)
      .offset(offset);

    return {
      lists: listsWithCounts,
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage: LISTS_PER_PAGE,
    };
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
async function getListDetailsPaginated(listId: string, page: number = 1) {
  const user = await requireUser();

  if (!listIdSchema.safeParse(listId).success) {
    redirect('/lists');
  }

  if (!pageSchema.safeParse(page).success) {
    redirect(`/lists/${listId}`);
  }

  const listResult = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), ownedCustomListsFilter(user.id)));

  if (listResult.length === 0) {
    throw new Error('List not found');
  }

  const list = listResult[0];

  const totalCountResult = await db
    .select({ count: count() })
    .from(listItems)
    .where(eq(listItems.listId, listId));

  // Safely coerce count to number, handling BigInt/string/null cases
  const totalItems = Number(totalCountResult[0]?.count) || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Parse and clamp page to valid range
  const parsedPage = parseInt(String(page), 10) || 1;
  const currentPage = Math.max(1, Math.min(parsedPage, totalPages || 1));

  if (totalItems === 0) {
    return {
      ...list,
      items: [],
      itemCount: 0,
      totalItems: 0,
      totalPages: 0,
      currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  }

  // Ensure offset is always >= 0
  const offset = Math.max(0, (currentPage - 1) * ITEMS_PER_PAGE);
  const items = await db
    .select()
    .from(listItems)
    .where(eq(listItems.listId, listId))
    .orderBy(...itemManualOrder())
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  return {
    ...list,
    items,
    itemCount: totalItems,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

/**
 * Fetches list details with all resource details populated.
 * Helper function to avoid code duplication.
 */
export async function getListDetailsWithResources(listId: string, page: number = 1) {
  const { getMovieDetails } = await import('@/lib/movies');
  const { getTvShowDetails } = await import('@/lib/tv-shows');
  const { getPersonDetails } = await import('@/lib/persons');

  const paginatedList = await getListDetailsPaginated(listId, page);

  // Fetch details for paginated items only
  const movieItems = paginatedList.items?.filter((item) => item.resourceType === 'movie') || [];
  const tvItems = paginatedList.items?.filter((item) => item.resourceType === 'tv') || [];
  const personItems = paginatedList.items?.filter((item) => item.resourceType === 'person') || [];

  const [movies, tvShows, persons] = await Promise.all([
    Promise.allSettled(movieItems.map((item) => getMovieDetails(item.resourceId))),
    Promise.allSettled(tvItems.map((item) => getTvShowDetails(item.resourceId))),
    Promise.allSettled(personItems.map((item) => getPersonDetails(item.resourceId))),
  ]).then(
    ([movieResults, tvResults, personResults]) =>
      [
        movieResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value),
        tvResults.filter((result) => result.status === 'fulfilled').map((result) => result.value),
        personResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value),
      ] as const,
  );

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
    await tx.insert(lists).values({
      id: listId,
      userId: user.id,
      name: validatedData.name,
      description: validatedData.description,
      emoji: validatedData.emoji,
      // Append to the end of the user's manual ordering.
      position: sql`coalesce((select max(${lists.position}) + 1 from ${lists} where ${lists.userId} = ${user.id} and ${lists.type} = ${CUSTOM_LIST_TYPE}), 1)`,
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
      await tx.insert(listItems).values({
        id: crypto.randomUUID(),
        listId: validatedData.listId,
        resourceId: validatedData.resourceId,
        resourceType: validatedData.resourceType,
        // Append to the end of the list's manual ordering.
        position: sql`coalesce((select max(${listItems.position}) + 1 from ${listItems} where ${listItems.listId} = ${validatedData.listId}), 1)`,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      throw new Error('Item already in list');
    }
    throw error;
  }

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
 * Rewrites the manual ordering of a user's custom lists in one statement,
 * assigning 1-based positions from the given id order.
 */
async function persistListOrder(tx: OrderingTx, userId: string, orderedIds: string[]) {
  await tx.execute(sql`
    update ${lists}
    set position = ord.position
    from unnest(${sql.param(orderedIds)}::text[]) with ordinality as ord(id, position)
    where ${lists.id} = ord.id and ${lists.userId} = ${userId}
  `);
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

    await persistListOrder(tx, user.id, orderedIds);
  });

  revalidateUserListCache(user.id);

  revalidatePath('/lists');
}

/**
 * Rewrites the manual ordering of a list's items in one statement, assigning
 * 1-based positions from the given id order.
 */
async function persistListItemOrder(tx: OrderingTx, listId: string, orderedIds: string[]) {
  await tx.execute(sql`
    update ${listItems}
    set position = ord.position
    from unnest(${sql.param(orderedIds)}::text[]) with ordinality as ord(id, position)
    where ${listItems.id} = ord.id and ${listItems.listId} = ${listId}
  `);
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

  const itemRows = await db
    .select({ listId: listItems.listId, listType: lists.type })
    .from(listItems)
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .where(and(eq(listItems.id, validatedData.itemId), eq(lists.userId, user.id)))
    .limit(1);

  if (itemRows.length === 0) {
    throw new Error('Item not found');
  }

  const listId = itemRows[0].listId;
  const listType = itemRows[0].listType;

  const orderWhere = validatedData.resourceType
    ? and(eq(listItems.listId, listId), eq(listItems.resourceType, validatedData.resourceType))
    : eq(listItems.listId, listId);

  // The current order is read and rewritten under one lock so a concurrent
  // move can't compute from a stale snapshot and overwrite this one.
  await withOrderingLock(listItemOrderingScope(listId), async (tx) => {
    const orderedRows = await tx
      .select({ id: listItems.id })
      .from(listItems)
      .where(orderWhere)
      .orderBy(...itemManualOrder());

    const orderedIds = moveIdToIndex(
      orderedRows.map((row) => row.id),
      validatedData.itemId,
      validatedData.position,
    );

    if (orderedIds === null) {
      throw new Error('Item not found');
    }

    await persistListItemOrder(tx, listId, orderedIds);
  });

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
        itemCount: sql<number>`count(${listItems.id})`.mapWith(Number),
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
