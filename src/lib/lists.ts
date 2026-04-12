import { and, count, desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { listItems, lists } from '@/db/schema/lists';
import { getUser } from '@/lib/auth-server';
import { revalidateUserListCache, revalidateUserListStatusCache } from '@/lib/cache-invalidation';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { db } from '@/lib/db';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';
import {
  createListSchema,
  listIdSchema,
  listItemSchema,
  mediaIdSchema,
  mediaTypeSchema,
  pageSchema,
  removeListItemSchema,
  updateListSchema,
} from '@/lib/validations';
import { withCache, TTL } from '@/lib/server-cache';

import { ITEMS_PER_PAGE } from './config';

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

export interface LocalListWithStatus extends LocalList {
  hasItem: boolean;
}

export async function getUserLists() {
  const user = await getUser();

  if (!user) {
    throw redirect({ to: '/login' });
  }

  const userLists = await db
    .select({
      id: lists.id,
      name: lists.name,
      description: lists.description,
      emoji: lists.emoji,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt,
    })
    .from(lists)
    .where(eq(lists.userId, user.id))
    .orderBy(desc(lists.updatedAt));

  const listsWithCounts = await Promise.all(
    userLists.map(async (list) => {
      const result = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(listItems)
        .where(eq(listItems.listId, list.id));

      const itemCount = result[0].count;

      return {
        ...list,
        itemCount,
      };
    }),
  );

  return listsWithCounts;
}

export async function getUserListCount() {
  const user = await getUser();

  if (!user) {
    throw redirect({ to: '/login' });
  }

  return await getCachedUserListCount(user.id);
}

const getCachedUserListCount = withCache(
  async (userId: string) => {
    try {
      const result = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(lists)
        .where(eq(lists.userId, userId));

      return result[0].count;
    } catch (error) {
      console.error('Error fetching user list count:', error);
      return 0;
    }
  },
  (userId) => CACHE_TAGS.private.lists(userId),
  TTL.minutes,
);

export async function getUserListsPaginated(page: number = 1) {
  const user = await getUser();

  if (!user) {
    throw redirect({ to: '/login' });
  }

  if (!pageSchema.safeParse(page).success) {
    throw redirect({ to: '/lists' });
  }

  try {
    const totalCountResult = await db
      .select({ count: count() })
      .from(lists)
      .where(eq(lists.userId, user.id));

    const totalItems = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    if (totalItems === 0) {
      return {
        lists: [],
        totalItems: 0,
        totalPages: 0,
        currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
      };
    }

    const offset = Math.max(0, (currentPage - 1) * ITEMS_PER_PAGE);
    const paginatedLists = await db
      .select({
        id: lists.id,
        name: lists.name,
        description: lists.description,
        emoji: lists.emoji,
        createdAt: lists.createdAt,
        updatedAt: lists.updatedAt,
      })
      .from(lists)
      .where(eq(lists.userId, user.id))
      .orderBy(desc(lists.updatedAt))
      .limit(ITEMS_PER_PAGE)
      .offset(offset);

    const listsWithCounts = await Promise.all(
      paginatedLists.map(async (list) => {
        const result = await db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(listItems)
          .where(eq(listItems.listId, list.id));

        const itemCount = result[0].count;

        return {
          ...list,
          itemCount,
        };
      }),
    );

    return {
      lists: listsWithCounts,
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  } catch (error) {
    console.error('Error fetching paginated user lists:', error);
    const currentPage = Math.max(1, page);
    return {
      lists: [],
      totalItems: 0,
      totalPages: 0,
      currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  }
}

export async function getListDetails(listId: string) {
  const user = await getUser();

  if (!user) {
    throw redirect({ to: '/login' });
  }

  const listResult = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)));

  if (listResult.length === 0) {
    throw new Error('List not found');
  }

  const list = listResult[0];

  const items = await db
    .select()
    .from(listItems)
    .where(eq(listItems.listId, listId))
    .orderBy(desc(listItems.createdAt));

  return {
    ...list,
    items,
    itemCount: items.length,
  };
}

export async function getListDetailsPaginated(listId: string, page: number = 1) {
  const user = await getUser();

  if (!user) {
    throw redirect({ to: '/login' });
  }

  if (!listIdSchema.safeParse(listId).success) {
    throw redirect({ to: '/lists' });
  }

  if (!pageSchema.safeParse(page).success) {
    throw redirect({ to: `/lists/${listId}` });
  }

  const listResult = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)));

  if (listResult.length === 0) {
    throw new Error('List not found');
  }

  const list = listResult[0];

  const totalCountResult = await db
    .select({ count: count() })
    .from(listItems)
    .where(eq(listItems.listId, listId));

  const totalItems = Number(totalCountResult[0]?.count) || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

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

  const offset = Math.max(0, (currentPage - 1) * ITEMS_PER_PAGE);
  const items = await db
    .select()
    .from(listItems)
    .where(eq(listItems.listId, listId))
    .orderBy(desc(listItems.createdAt))
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

export async function getListDetailsWithResources(listId: string, page: number = 1) {
  const { getMovieDetails } = await import('@/lib/movies');
  const { getTvShowDetails } = await import('@/lib/tv-shows');
  const { getPersonDetails } = await import('@/lib/persons');

  const paginatedList = await getListDetailsPaginated(listId, page);

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

  const allItems = [
    ...movies.map((movie) => ({
      ...movie,
      posterImageUrls: buildProxyImageUrls(movie.poster_path, {
        width: 500,
        fill: true,
      }),
      resourceType: 'movie' as const,
    })),
    ...tvShows.map((show) => ({
      ...show,
      posterImageUrls: buildProxyImageUrls(show.poster_path, {
        width: 500,
        fill: true,
      }),
      resourceType: 'tv' as const,
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
    })),
  ];

  return {
    ...paginatedList,
    allItems,
  };
}

type CreateListInput = { name: string; description: string; emoji: string };

export const createList = createServerFn()
  .inputValidator((data: CreateListInput) => data)
  .handler(async ({ data: { name, description, emoji } }) => {
    const user = await getUser();

    if (!user) {
      throw redirect({ to: '/login' });
    }

    const validatedData = createListSchema.parse({
      name,
      description,
      emoji,
    });

    const listId = crypto.randomUUID();

    await db.insert(lists).values({
      id: listId,
      userId: user.id,
      name: validatedData.name,
      description: validatedData.description,
      emoji: validatedData.emoji,
    });

    revalidateUserListCache(user.id, listId);

    return { success: true, listId };
  });

type AddToListInput = { listId: string; mediaId: number; mediaType: 'movie' | 'tv' | 'person' };

export const addToList = createServerFn()
  .inputValidator((data: AddToListInput) => data)
  .handler(async ({ data: { listId, mediaId, mediaType } }) => {
    const user = await getUser();

    if (!user) {
      throw redirect({ to: '/login' });
    }

    if (!listIdSchema.safeParse(listId).success) {
      throw new Error('Invalid list ID');
    }

    if (!mediaIdSchema.safeParse(mediaId).success) {
      throw new Error('Invalid media ID');
    }

    if (!mediaTypeSchema.safeParse(mediaType).success) {
      throw new Error('Invalid media type');
    }

    const validatedData = listItemSchema.parse({
      listId,
      resourceId: mediaId,
      resourceType: mediaType,
    });

    const [{ count: listCount }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(lists)
      .where(and(eq(lists.id, validatedData.listId), eq(lists.userId, user.id)));

    if (listCount === 0) {
      throw new Error('List not found');
    }

    try {
      await db.insert(listItems).values({
        id: crypto.randomUUID(),
        listId: validatedData.listId,
        resourceId: validatedData.resourceId,
        resourceType: validatedData.resourceType,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('Item already in list');
      }
      throw error;
    }

    revalidateUserListCache(user.id, validatedData.listId);
    revalidateUserListStatusCache(user.id, validatedData.resourceType, validatedData.resourceId);
  });

type RemoveFromListInput = {
  listId: string;
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'person';
};

export const removeFromList = createServerFn()
  .inputValidator((data: RemoveFromListInput) => data)
  .handler(async ({ data: { listId, mediaId, mediaType } }) => {
    const user = await getUser();

    if (!user) {
      throw redirect({ to: '/login' });
    }

    if (!listIdSchema.safeParse(listId).success) {
      throw new Error('Invalid list ID');
    }

    if (!mediaIdSchema.safeParse(mediaId).success) {
      throw new Error('Invalid media ID');
    }

    if (!mediaTypeSchema.safeParse(mediaType).success) {
      throw new Error('Invalid media type');
    }

    const validatedData = removeListItemSchema.parse({
      listId,
      resourceId: mediaId,
      resourceType: mediaType,
    });

    const [{ count: listCount }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(lists)
      .where(and(eq(lists.id, validatedData.listId), eq(lists.userId, user.id)));

    if (listCount === 0) {
      throw new Error('List not found');
    }

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
  });

export const deleteList = createServerFn()
  .inputValidator((data: string) => data)
  .handler(async ({ data: listId }) => {
    const user = await getUser();

    if (!user) {
      throw redirect({ to: '/login' });
    }

    if (!listIdSchema.safeParse(listId).success) {
      throw new Error('Invalid list ID');
    }

    const [{ count: listCount }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, user.id)));

    if (listCount === 0) {
      throw new Error('List not found');
    }

    await db.delete(lists).where(eq(lists.id, listId));

    revalidateUserListCache(user.id, listId);
  });

type UpdateListInput = { listId: string; name: string; description: string; emoji: string };

export const updateList = createServerFn()
  .inputValidator((data: UpdateListInput) => data)
  .handler(async ({ data: { listId, name, description, emoji } }) => {
    const user = await getUser();

    if (!user) {
      throw redirect({ to: '/login' });
    }

    if (!listIdSchema.safeParse(listId).success) {
      throw new Error('Invalid list ID');
    }

    const validatedData = updateListSchema.parse({
      listId,
      name,
      description,
      emoji,
    });

    const [{ count: listCount }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(lists)
      .where(and(eq(lists.id, validatedData.listId), eq(lists.userId, user.id)));

    if (listCount === 0) {
      throw new Error('List not found');
    }

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
  });

type GetListsWithStatusInput = { mediaId: number; mediaType: 'movie' | 'tv' | 'person' };

export const getUserListsWithStatus = createServerFn()
  .inputValidator((data: GetListsWithStatusInput) => data)
  .handler(async ({ data: { mediaId, mediaType } }) => {
    const user = await getUser();

    if (!user) {
      throw redirect({ to: '/login' });
    }

    if (!mediaIdSchema.safeParse(mediaId).success) {
      throw new Error('Invalid media ID');
    }
    if (!mediaTypeSchema.safeParse(mediaType).success) {
      throw new Error('Invalid media type');
    }

    return await getCachedUserListsWithStatus(user.id, mediaId, mediaType);
  });

const getCachedUserListsWithStatus = withCache(
  async (userId: string, mediaId: number, mediaType: 'movie' | 'tv' | 'person') => {
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
        .where(eq(lists.userId, userId))
        .groupBy(
          lists.id,
          lists.name,
          lists.description,
          lists.emoji,
          lists.createdAt,
          lists.updatedAt,
        )
        .orderBy(desc(lists.updatedAt));

      return listsWithStatusAndCounts;
    } catch (error) {
      console.error('Error fetching user lists with status:', error);
      throw new Error('Failed to fetch user lists');
    }
  },
  (userId, mediaId, mediaType) =>
    `${CACHE_TAGS.private.listStatus(userId, mediaType, mediaId)}:${CACHE_TAGS.private.lists(userId)}`,
  TTL.minutes,
);

export type UserListsWithStatus = Awaited<ReturnType<typeof getCachedUserListsWithStatus>>;
