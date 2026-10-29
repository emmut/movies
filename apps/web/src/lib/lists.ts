'use server';

import { fulfilledValues } from '@movies/api/settled';
import { parseWatchProviderFilter } from '@movies/api/system-lists';
import { createCustomListStore } from '@movies/db/custom-lists';
import { createListItemOrderingStore } from '@movies/db/list-item-order';
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

import { LISTS_PER_PAGE } from './config';

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

const customLists = createCustomListStore(db, ensureAvailabilityKnown);
const listItemOrdering = createListItemOrderingStore(db);

/**
 * Returns the custom list with the given id if it exists and is owned by the
 * authenticated user; `null` otherwise (including for system lists).
 */
export async function getOwnedCustomList(listId: string): Promise<{ id: string } | null> {
  const user = await requireUser();

  if (!listIdSchema.safeParse(listId).success) {
    return null;
  }

  return customLists.owned(user.id, listId);
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
    return await customLists.total(userId);
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
    return await customLists.index(user.id, page);
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

  return customLists.pageRows(user.id, listId, page, providerFilter);
}

function validateListDetailsParams(listId: string, page: number) {
  if (!listIdSchema.safeParse(listId).success) {
    redirect('/lists');
  }

  if (!pageSchema.safeParse(page).success) {
    redirect(`/lists/${listId}`);
  }
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
    return items
      .filter((item) => item.resourceType === resourceType)
      .map((item) => item.resourceId);
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

  const { listId } = await customLists.create(
    user.id,
    validatedData.name,
    validatedData.description,
    validatedData.emoji,
  );

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

  await customLists.add(
    user.id,
    validatedData.listId,
    validatedData.resourceId,
    validatedData.resourceType,
  );

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

  await customLists.remove(
    user.id,
    validatedData.listId,
    validatedData.resourceId,
    validatedData.resourceType,
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

  await customLists.delete(user.id, listId);

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

  await customLists.update(
    user.id,
    validatedData.listId,
    validatedData.name,
    validatedData.description,
    validatedData.emoji,
  );

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

  await customLists.move(user.id, validatedData.listId, validatedData.position);

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
    return await customLists.status(userId, mediaId, mediaType);
  } catch (error) {
    console.error('Error fetching user lists with status:', error);
    throw new Error('Failed to fetch user lists');
  }
}

export type UserListsWithStatus = Awaited<ReturnType<typeof getUserListsWithStatus>>;
