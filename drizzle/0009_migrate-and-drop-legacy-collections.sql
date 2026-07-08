INSERT INTO "user_collections" ("id", "user_id", "collection", "resource_id", "resource_type", "created_at", "updated_at")
SELECT "id", "user_id", 'watchlist', "resource_id", "resource_type", "created_at", "updated_at" FROM "watchlist";--> statement-breakpoint
INSERT INTO "user_collections" ("id", "user_id", "collection", "resource_id", "resource_type", "created_at", "updated_at")
SELECT "id", "user_id", 'watched', "resource_id", "resource_type", "created_at", "updated_at" FROM "watched";--> statement-breakpoint
DROP TABLE "watched" CASCADE;--> statement-breakpoint
DROP TABLE "watchlist" CASCADE;
