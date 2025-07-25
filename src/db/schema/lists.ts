import { user } from '@/db/schema/auth';
import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const lists = pgTable('lists', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const listItems = pgTable(
  'list_items',
  {
    id: text('id').primaryKey(),
    listId: text('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    resourceId: integer('resource_id').notNull(),
    resourceType: text('resource_type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.listId, table.resourceId, table.resourceType)]
);
