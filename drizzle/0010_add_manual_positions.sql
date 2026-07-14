ALTER TABLE "list_items" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lists" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "lists"
SET "position" = ranked.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY updated_at DESC) AS rn
  FROM "lists"
  WHERE type = 'custom'
) AS ranked
WHERE "lists".id = ranked.id;--> statement-breakpoint
UPDATE "list_items"
SET "position" = ranked.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY list_id ORDER BY created_at DESC) AS rn
  FROM "list_items"
) AS ranked
WHERE "list_items".id = ranked.id;
