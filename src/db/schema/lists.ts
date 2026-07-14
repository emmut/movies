import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, unique, uniqueIndex } from 'drizzle-orm/pg-core';

import { user } from '@/db/schema/auth';

export const lists = pgTable(
  'lists',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    emoji: text('emoji').notNull().default('📝'),
    type: text('type', { enum: ['custom', 'watchlist', 'watched'] })
      .notNull()
      .default('custom'),
    // 1-based manual sort order within a user's custom lists; renumbered on
    // every move, so values stay distinct per user.
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Every lists query is scoped to one user (pagination, reorder reads, the
    // max(position) append subquery, the user-delete cascade).
    index('lists_userId_idx').on(table.userId),
    // System lists exist at most once per user; custom lists are unlimited.
    uniqueIndex('lists_user_watchlist_unique')
      .on(table.userId)
      .where(sql`${table.type} = 'watchlist'`),
    uniqueIndex('lists_user_watched_unique')
      .on(table.userId)
      .where(sql`${table.type} = 'watched'`),
  ],
);

export const listItems = pgTable(
  'list_items',
  {
    id: text('id').primaryKey(),
    listId: text('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    resourceId: integer('resource_id').notNull(),
    resourceType: text('resource_type').notNull(),
    // 1-based manual sort order within a list; renumbered on every move, so
    // values stay distinct per list.
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.listId, table.resourceId, table.resourceType)],
);
