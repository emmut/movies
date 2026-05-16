import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const userWatchProviders = pgTable(
  "user_watch_providers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerId: integer("provider_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.userId, table.providerId)],
);
