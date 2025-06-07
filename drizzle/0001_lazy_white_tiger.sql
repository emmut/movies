ALTER TABLE "watchlist" RENAME COLUMN "movie_id" TO "resource_type";--> statement-breakpoint
ALTER TABLE "watchlist" ADD COLUMN "resource_id" integer NOT NULL;