CREATE TABLE "watched" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"resource_id" integer NOT NULL,
	"resource_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watched_user_id_resource_id_resource_type_unique" UNIQUE("user_id","resource_id","resource_type")
);
--> statement-breakpoint
ALTER TABLE "watched" ADD CONSTRAINT "watched_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;