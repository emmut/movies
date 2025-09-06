'use server';

import { listItems, lists } from '@/db/schema/lists';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import {
  createListSchema,
  listItemSchema,
  removeListItemSchema,
  updateListSchema,
} from '@/lib/validations';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
    redirect('/login');
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

  // Get item counts for each list
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
    })
  );

  return listsWithCounts;
}

/**
 * Retrieves a paginated list of the authenticated user's lists with item counts.
 *
 * @param page - The page number (1-based).
 * @param itemsPerPage - The number of lists per page.
 * @returns An object containing the paginated lists and pagination metadata.
 */
export async function getUserListsPaginated(page: number = 1) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const totalCountResult = await db
      .select({ count: count() })
      .from(lists)
      .where(eq(lists.userId, user.id));

    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalItems === 0) {
      return {
        lists: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        itemsPerPage: ITEMS_PER_PAGE,
      };
    }

    const offset = (page - 1) * ITEMS_PER_PAGE;
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
      })
    );

    return {
      lists: listsWithCounts,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  } catch (error) {
    console.error('Error fetching paginated user lists:', error);
    return {
      lists: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: page,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  }
}

export async function getListDetails(listId: string) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
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

/**
 * Retrieves paginated list details with items for a specific list.
 *
 * @param listId - The ID of the list to retrieve.
 * @param page - The page number (1-based).
 * @param itemsPerPage - The number of items per page.
 * @returns An object containing the list details, paginated items, and pagination metadata.
 */
export async function getListDetailsPaginated(
  listId: string,
  page: number = 1
) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
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

  const totalItems = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (totalItems === 0) {
    return {
      ...list,
      items: [],
      itemCount: 0,
      totalItems: 0,
      totalPages: 0,
      currentPage: page,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  }

  const offset = (page - 1) * ITEMS_PER_PAGE;
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
    currentPage: page,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

export async function createList(
  name: string,
  description: string = '',
  emoji: string = '📝'
) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
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

  revalidatePath('/lists');

  return { success: true, listId };
}

export async function addToList(
  listId: string,
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'person'
) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const validatedData = listItemSchema.parse({
    listId,
    resourceId: mediaId,
    resourceType: mediaType,
  });

  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(lists)
    .where(and(eq(lists.id, validatedData.listId), eq(lists.userId, user.id)));

  if (count === 0) {
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

  revalidatePath(`/lists/${validatedData.listId}`);
  revalidatePath('/lists');
}

export async function removeFromList(
  listId: string,
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'person'
) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const validatedData = removeListItemSchema.parse({
    listId,
    resourceId: mediaId,
    resourceType: mediaType,
  });

  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(lists)
    .where(and(eq(lists.id, validatedData.listId), eq(lists.userId, user.id)));

  if (count === 0) {
    throw new Error('List not found');
  }

  await db
    .delete(listItems)
    .where(
      and(
        eq(listItems.listId, validatedData.listId),
        eq(listItems.resourceId, validatedData.resourceId),
        eq(listItems.resourceType, validatedData.resourceType)
      )
    );

  revalidatePath(`/lists/${validatedData.listId}`);
  revalidatePath('/lists');
}

export async function deleteList(listId: string) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)));

  if (count === 0) {
    throw new Error('List not found');
  }

  await db.delete(lists).where(eq(lists.id, listId));

  revalidatePath('/lists');
}

export async function updateList(
  listId: string,
  name: string,
  description: string = '',
  emoji: string = '📝'
) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const validatedData = updateListSchema.parse({
    listId,
    name,
    description,
    emoji,
  });

  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(lists)
    .where(and(eq(lists.id, validatedData.listId), eq(lists.userId, user.id)));

  if (count === 0) {
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

  revalidatePath(`/lists/${validatedData.listId}`);
  revalidatePath('/lists');
}

export async function getUserListsWithStatus(
  mediaId: number,
  mediaType: 'movie' | 'tv' | 'person'
) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
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

  const listsWithStatusAndCounts = await Promise.all(
    userLists.map(async (list) => {
      const [itemCount, hasItem] = await Promise.all([
        db
          .select({ count: listItems.id })
          .from(listItems)
          .where(eq(listItems.listId, list.id))
          .then((rows) => rows.length),
        db
          .select({ id: listItems.id })
          .from(listItems)
          .where(
            and(
              eq(listItems.listId, list.id),
              eq(listItems.resourceId, mediaId),
              eq(listItems.resourceType, mediaType)
            )
          )
          .then((rows) => rows.length > 0),
      ]);

      return {
        ...list,
        itemCount,
        hasItem,
      };
    })
  );

  return listsWithStatusAndCounts;
}

export type UserListsWithStatus = Awaited<
  ReturnType<typeof getUserListsWithStatus>
>;
