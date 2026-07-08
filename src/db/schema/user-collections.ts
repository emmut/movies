import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { user } from '@/db/schema/auth';
import { COLLECTION_KINDS } from '@/lib/collections-config';

/**
 * Flat per-user collections of TMDB resources, discriminated by `collection`
 * (watchlist, watched). One row = one resource flagged in one collection.
 *
 * The unique index is ordered (user, collection, type, id) so its prefixes
 * also serve membership checks and per-type counts.
 */
export const userCollections = pgTable(
  'user_collections',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    collection: text('collection', { enum: COLLECTION_KINDS }).notNull(),
    resourceId: integer('resource_id').notNull(),
    resourceType: text('resource_type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique().on(table.userId, table.collection, table.resourceType, table.resourceId)],
);
