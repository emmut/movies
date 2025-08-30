CREATE TABLE "user_watch_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_watch_providers_user_id_provider_id_unique" UNIQUE("user_id","provider_id")
);
--> statement-breakpoint
ALTER TABLE "user_watch_providers" ADD CONSTRAINT "user_watch_providers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;