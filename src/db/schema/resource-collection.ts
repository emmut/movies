import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { user } from '@/db/schema/auth';

/**
 * Builds a per-user collection of TMDB resources (movies/TV shows) keyed by
 * resource id and type. Shared by the watchlist and watched tables so both
 * stay structurally identical and can share query logic.
 */
export function resourceCollectionTable(name: string) {
  return pgTable(
    name,
    {
      id: text('id').primaryKey(),
      userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
      resourceId: integer('resource_id').notNull(),
      resourceType: text('resource_type').notNull(),
      createdAt: timestamp('created_at').defaultNow().notNull(),
      updatedAt: timestamp('updated_at')
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
    },
    (table) => [unique().on(table.userId, table.resourceId, table.resourceType)],
  );
}

export type ResourceCollectionTable = ReturnType<typeof resourceCollectionTable>;
