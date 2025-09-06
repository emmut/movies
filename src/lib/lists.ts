'use server';

import { listItems, lists } from '@/db/schema/lists';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import {
  createListSchema,
  listItemSchema,
  mediaIdSchema,
  mediaTypeSchema,
  removeListItemSchema,
  updateListSchema,
} from '@/lib/validations';
import { and, desc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

export async function createList(
  name: string,
  description: string = '',
  emoji: string = '📝'
) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Validate input data
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

  // Validate input data
  const validatedData = listItemSchema.parse({
    listId,
    resourceId: mediaId,
    resourceType: mediaType,
  });

  // Verify list belongs to user
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
    // Check if it's a unique constraint violation
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

  // Validate input data
  const validatedData = removeListItemSchema.parse({
    listId,
    resourceId: mediaId,
    resourceType: mediaType,
  });

  // Verify list belongs to user
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

  // Verify list belongs to user
  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)));

  if (count === 0) {
    throw new Error('List not found');
  }

  // Delete list (items will be deleted automatically due to cascade)
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

  // Validate input data
  const validatedData = updateListSchema.parse({
    listId,
    name,
    description,
    emoji,
  });

  // Verify list belongs to user
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

  if (!mediaIdSchema.safeParse(mediaId).success) {
    throw new Error('Invalid media ID');
  }

  if (!mediaTypeSchema.safeParse(mediaType).success) {
    throw new Error('Invalid media type');
  }

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
      .where(eq(lists.userId, user.id))
      .groupBy(
        lists.id,
        lists.name,
        lists.description,
        lists.emoji,
        lists.createdAt,
        lists.updatedAt
      )
      .orderBy(desc(lists.updatedAt));

    return listsWithStatusAndCounts;
  } catch (error) {
    console.error('Error fetching user lists with status:', error);
    throw new Error('Failed to fetch user lists');
  }
}

export type UserListsWithStatus = Awaited<
  ReturnType<typeof getUserListsWithStatus>
>;
