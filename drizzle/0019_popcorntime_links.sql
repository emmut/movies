CREATE TABLE "popcorntime_links" (
	"media_type" text NOT NULL,
	"tmdb_id" integer NOT NULL,
	"region" text NOT NULL,
	"provider_id" integer NOT NULL,
	"offer_type" text NOT NULL,
	"link_token" text NOT NULL,
	"available_from" date,
	"available_to" date,
	CONSTRAINT "popcorntime_links_pk" PRIMARY KEY("media_type","tmdb_id","region","provider_id","offer_type")
);
--> statement-breakpoint
CREATE TABLE "popcorntime_snapshots" (
	"region" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "popcorntime_links" ADD CONSTRAINT "popcorntime_links_region_popcorntime_snapshots_region_fk" FOREIGN KEY ("region") REFERENCES "public"."popcorntime_snapshots"("region") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "popcorntime_links_region_idx" ON "popcorntime_links" USING btree ("region");