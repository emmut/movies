CREATE TABLE "title_availability" (
	"tmdb_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"region" text NOT NULL,
	"provider_id" integer NOT NULL,
	"offer_type" text NOT NULL,
	CONSTRAINT "title_availability_media_type_tmdb_id_region_provider_id_offer_type_pk" PRIMARY KEY("media_type","tmdb_id","region","provider_id","offer_type")
);
--> statement-breakpoint
CREATE TABLE "title_availability_syncs" (
	"tmdb_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "title_availability_syncs_media_type_tmdb_id_pk" PRIMARY KEY("media_type","tmdb_id")
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"tmdb_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"release_date" text,
	"vote_average" real NOT NULL,
	"runtime" integer,
	"genre_ids" integer[] NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "titles_media_type_tmdb_id_pk" PRIMARY KEY("media_type","tmdb_id")
);
--> statement-breakpoint
ALTER TABLE "title_availability" ADD CONSTRAINT "title_availability_sync_fk" FOREIGN KEY ("media_type","tmdb_id") REFERENCES "public"."title_availability_syncs"("media_type","tmdb_id") ON DELETE cascade ON UPDATE no action;