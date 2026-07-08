'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { userCollections } from '@/db/schema/user-collections';
import { requireUser } from '@/lib/auth-server';
import { revalidateUserCollectionCache } from '@/lib/cache-invalidation';
import { COLLECTION_ROUTES } from '@/lib/collections-config';
import { db } from '@/lib/db';
import { toggleCollectionSchema } from '@/lib/validations';

type ToggleCollectionParams = {
  collection: string;
  resourceId: number;
  resourceType: string;
};

/**
 * Toggles a resource's presence in one of the authenticated user's
 * collections, then revalidates the resource page, the collection page, and
 * the collection's private cache tags.
 *
 * @returns `{ success: true, action }` where action is `'added'`,
 * `'removed'`, or `'unchanged'` (a concurrent request won the toggle race).
 *
 * @throws {Error} On invalid input or when the database operation fails.
 * @remark Redirects to the login page if no authenticated user is found.
 */
export async function toggleCollection(params: ToggleCollectionParams) {
  const { collection, resourceId, resourceType } = toggleCollectionSchema.parse(params);

  const user = await requireUser();

  try {
    const action = await toggleRow(user.id, collection, resourceId, resourceType);

    revalidateUserCollectionCache(user.id, collection, resourceType, resourceId);
    revalidatePath(`/${resourceType}/${resourceId}`);
    revalidatePath(COLLECTION_ROUTES[collection]);

    return { success: true, action };
  } catch (error) {
    console.error(`Error toggling ${collection}:`, error);
    throw new Error(`Failed to update ${collection}`);
  }
}

/**
 * Single round-trip toggle: delete returns the removed row(s); an empty
 * result means the row was absent, so insert instead. A concurrent request
 * may insert between our delete and insert; onConflictDoNothing then makes
 * the insert a no-op — trust the returned rows, not the attempt, so callers
 * don't show a false "added".
 */
async function toggleRow(
  userId: string,
  collection: (typeof userCollections.$inferSelect)['collection'],
  resourceId: number,
  resourceType: string,
) {
  const removed = await db
    .delete(userCollections)
    .where(
      and(
        eq(userCollections.userId, userId),
        eq(userCollections.collection, collection),
        eq(userCollections.resourceType, resourceType),
        eq(userCollections.resourceId, resourceId),
      ),
    )
    .returning({ id: userCollections.id });

  if (removed.length > 0) {
    return 'removed';
  }

  const inserted = await db
    .insert(userCollections)
    .values({ id: crypto.randomUUID(), userId, collection, resourceId, resourceType })
    .onConflictDoNothing()
    .returning({ id: userCollections.id });

  return inserted.length > 0 ? 'added' : 'unchanged';
}
