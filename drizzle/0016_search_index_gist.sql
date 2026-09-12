DROP INDEX "search_index_search_title_trgm_idx";--> statement-breakpoint
CREATE INDEX "search_index_search_title_trgm_idx" ON "search_index" USING gist ("search_title" gist_trgm_ops(siglen=64));