DROP INDEX "search_index_search_title_trgm_idx";--> statement-breakpoint
CREATE INDEX "search_index_search_title_trgm_idx" ON "search_index" USING gin ("search_title" gin_trgm_ops);