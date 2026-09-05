CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "search_index" (
	"tmdb_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"title" text NOT NULL,
	"search_title" text NOT NULL,
	"popularity" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "search_index_media_type_tmdb_id_pk" PRIMARY KEY("media_type","tmdb_id")
);
--> statement-breakpoint
CREATE INDEX "search_index_search_title_trgm_idx" ON "search_index" USING gin ("search_title" gin_trgm_ops);