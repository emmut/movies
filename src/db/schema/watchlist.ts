import { user } from '@/db/schema/auth';
import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const watchlist = pgTable(
  'watchlist',
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
  (table) => [unique().on(table.userId, table.resourceId, table.resourceType)]
);
