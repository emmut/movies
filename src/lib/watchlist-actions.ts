import { and, eq } from 'drizzle-orm';
import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { watchlist } from '@/db/schema/watchlist';
import { getUser } from '@/lib/auth-server';
import { revalidateUserWatchlistCache } from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { resourceIdSchema } from '@/lib/validations';

type WatchlistParams = {
  resourceId: number;
  resourceType: string;
};

export const addToWatchlist = createServerFn()
  .inputValidator((data: WatchlistParams) => data)
  .handler(async ({ data: { resourceId, resourceType } }) => {
    const validatedResourceId = resourceIdSchema.parse({ resourceId, resourceType });

    const user = await getUser();
    if (!user) {
      throw redirect({ to: '/login' });
    }

    const existing = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceId, validatedResourceId.resourceId),
          eq(watchlist.resourceType, validatedResourceId.resourceType),
        ),
      );

    if (existing.length > 0) {
      throw new Error('Movie already in watchlist');
    }

    await db.insert(watchlist).values({
      id: crypto.randomUUID(),
      userId: user.id,
      resourceId: validatedResourceId.resourceId,
      resourceType: validatedResourceId.resourceType,
    });

    revalidateUserWatchlistCache(user.id, validatedResourceId.resourceType, validatedResourceId.resourceId);

    return { success: true };
  });

export const removeFromWatchlist = createServerFn()
  .inputValidator((data: WatchlistParams) => data)
  .handler(async ({ data: { resourceId, resourceType } }) => {
    const validatedResourceId = resourceIdSchema.parse({ resourceId, resourceType });

    const user = await getUser();
    if (!user) {
      throw redirect({ to: '/login' });
    }

    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceId, validatedResourceId.resourceId),
          eq(watchlist.resourceType, validatedResourceId.resourceType),
        ),
      );

    revalidateUserWatchlistCache(user.id, validatedResourceId.resourceType, validatedResourceId.resourceId);

    return { success: true };
  });

export const toggleWatchlist = createServerFn()
  .inputValidator((data: WatchlistParams) => data)
  .handler(async ({ data: { resourceId, resourceType } }) => {
    const validatedResourceId = resourceIdSchema.parse({ resourceId, resourceType });

    const user = await getUser();
    if (!user) {
      throw redirect({ to: '/login' });
    }

    const existing = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, user.id),
          eq(watchlist.resourceId, validatedResourceId.resourceId),
          eq(watchlist.resourceType, validatedResourceId.resourceType),
        ),
      );

    let state;
    if (existing.length > 0) {
      await db
        .delete(watchlist)
        .where(
          and(
            eq(watchlist.userId, user.id),
            eq(watchlist.resourceId, validatedResourceId.resourceId),
            eq(watchlist.resourceType, validatedResourceId.resourceType),
          ),
        );
      state = 'removed';
    } else {
      await db.insert(watchlist).values({
        id: crypto.randomUUID(),
        userId: user.id,
        resourceId: validatedResourceId.resourceId,
        resourceType: validatedResourceId.resourceType,
      });
      state = 'added';
    }

    revalidateUserWatchlistCache(user.id, validatedResourceId.resourceType, validatedResourceId.resourceId);

    return { success: true, action: state };
  });
