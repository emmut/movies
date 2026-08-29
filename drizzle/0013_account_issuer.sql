-- better-auth 1.7 keys account identities on (issuer, accountId). Existing rows
-- predate the column, so add it nullable, backfill the synthetic issuer
-- better-auth would have written, and only then enforce NOT NULL. Adding the
-- column NOT NULL outright fails on any database that already has accounts.
ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint

-- Mirrors createOAuthAccountIssuer/createLocalAccountIssuer: OAuth identities
-- live in their own namespace so a provider id cannot collide with an internal
-- authentication method. Only 'credential' is local here; every other provider
-- on this app (discord, github) is OAuth.
UPDATE "account"
SET "issuer" = CASE
  WHEN "provider_id" = 'credential' THEN 'local:' || "provider_id"
  ELSE 'local:oauth:' || "provider_id"
END
WHERE "issuer" IS NULL;--> statement-breakpoint

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_idx" ON "account" USING btree ("issuer","account_id");
