'use server';

import { listItems, lists } from '@/db/schema/lists';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { and, desc, eq } from 'drizzle-orm';
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
      const itemCount = await db
        .select({ count: listItems.id })
        .from(listItems)
        .where(eq(listItems.listId, list.id))
        .then((rows) => rows.length);

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

  const list = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)))
    .then((rows) => rows[0]);

  if (!list) {
    throw new Error('List not found');
  }

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

  const listId = crypto.randomUUID();

  await db.insert(lists).values({
    id: listId,
    userId: user.id,
    name,
    description: description || null,
    emoji,
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

  // Verify list belongs to user
  const list = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)))
    .then((rows) => rows[0]);

  if (!list) {
    throw new Error('List not found');
  }

  try {
    await db.insert(listItems).values({
      id: crypto.randomUUID(),
      listId,
      resourceId: mediaId,
      resourceType: mediaType,
    });
  } catch (error) {
    // Item already exists in list (unique constraint)
    throw new Error('Item already in list');
  }

  revalidatePath(`/lists/${listId}`);
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

  // Verify list belongs to user
  const list = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)))
    .then((rows) => rows[0]);

  if (!list) {
    throw new Error('List not found');
  }

  await db
    .delete(listItems)
    .where(
      and(
        eq(listItems.listId, listId),
        eq(listItems.resourceId, mediaId),
        eq(listItems.resourceType, mediaType)
      )
    );

  revalidatePath(`/lists/${listId}`);
  revalidatePath('/lists');
}

export async function deleteList(listId: string) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify list belongs to user
  const list = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)))
    .then((rows) => rows[0]);

  if (!list) {
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

  // Verify list belongs to user
  const list = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)))
    .then((rows) => rows[0]);

  if (!list) {
    throw new Error('List not found');
  }

  await db
    .update(lists)
    .set({
      name,
      description: description || null,
      emoji,
      updatedAt: new Date(),
    })
    .where(eq(lists.id, listId));

  revalidatePath(`/lists/${listId}`);
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

  // Get item counts and check if item exists in each list
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
