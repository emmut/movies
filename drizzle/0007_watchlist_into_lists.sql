ALTER TABLE "lists" ADD COLUMN "type" text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "lists_user_watchlist_unique" ON "lists" USING btree ("user_id") WHERE "lists"."type" = 'watchlist';--> statement-breakpoint
INSERT INTO "lists" ("id", "user_id", "name", "description", "emoji", "type", "created_at", "updated_at")
SELECT gen_random_uuid()::text, w."user_id", 'Watchlist', NULL, '⭐', 'watchlist', min(w."created_at"), now()
FROM "watchlist" w
GROUP BY w."user_id";--> statement-breakpoint
INSERT INTO "list_items" ("id", "list_id", "resource_id", "resource_type", "created_at")
SELECT gen_random_uuid()::text, l."id", w."resource_id", w."resource_type", w."created_at"
FROM "watchlist" w
JOIN "lists" l ON l."user_id" = w."user_id" AND l."type" = 'watchlist';--> statement-breakpoint
ALTER TABLE "watchlist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "watchlist" CASCADE;
