CREATE TABLE "imdb_ratings" (
	"imdb_id" text PRIMARY KEY NOT NULL,
	"rating" numeric(3, 1) NOT NULL,
	"num_votes" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
