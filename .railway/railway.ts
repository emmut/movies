/// <reference types="node" />
import { execSync } from "node:child_process";
import { defineRailway, github, image, postgres, preserve, project, service, volume } from "railway/iac";

const APP_DOMAIN = "movies.emmut.space";
const CDN_DOMAIN = "cdn.emmut.space";

function currentGitBranch() {
  // On a detached HEAD there is no current branch — provide it via RAILWAY_IAC_BRANCH instead.
  const branch =
    process.env.RAILWAY_IAC_BRANCH ?? execSync("git branch --show-current", { encoding: "utf8" }).trim();
  if (!branch) {
    throw new Error("Cannot resolve the PR branch: set RAILWAY_IAC_BRANCH or run from a branch checkout.");
  }
  return branch;
}

export default defineRailway((ctx) => {
  const prod = ctx.isEnvironment("production");

  // PR/preview environments get their own Postgres; production keeps the external DB.
  const db = prod ? null : postgres("postgres");

  const imgproxyHRto = service("imgproxy-HRto", {
    source: image("darthsim/imgproxy:v3.18.2"),
    healthcheck: "/health",
    domains: prod ? [CDN_DOMAIN] : [],
    networking: { privateNetworkEndpoint: "imgproxy-hrto" },
    env: {
      IMGPROXY_KEY: preserve(),
      IMGPROXY_MAX_SRC_RESOLUTION: preserve(),
      IMGPROXY_SALT: preserve(),
      IMGPROXY_TTL: preserve(),
      IMGPROXY_USE_ETAG: preserve(),
    },
  });

  const movies = service("movies", {
    // PR environments track their PR branch; plan/apply for them must run from that branch's checkout.
    source: github("emmut/movies", prod ? {} : { branch: currentGitBranch() }),
    // Runs before each deploy; a non-zero exit aborts the deploy and keeps the
    // old version live. Both environments apply committed migrations — PR
    // databases start empty and the chain builds them from scratch. Never use
    // `db:push --force` here: headless drizzle-kit push crashes mid-apply in
    // its prompt renderer while the deploy still reports success, leaving a
    // partial schema and an empty migration journal behind.
    preDeploy: "pnpm db:migrate",
    deploy: { limitOverride: { containers: { cpu: 2, memoryBytes: 1000000000 } }, sleepApplication: true },
    domains: prod ? [APP_DOMAIN] : [],
    env: {
      BETTER_AUTH_SECRET: preserve(),
      BETTER_AUTH_TRUSTED_ORIGIN: preserve(),
      DATABASE_URL: db ? db.env.DATABASE_URL : preserve(),
      DISCORD_CLIENT_ID: preserve(),
      DISCORD_CLIENT_SECRET: preserve(),
      GITHUB_CLIENT_ID: preserve(),
      GITHUB_CLIENT_SECRET: preserve(),
      // Reference imgproxy's copies — the app signs URLs that imgproxy verifies,
      // so the values must never diverge.
      IMGPROXY_KEY: imgproxyHRto.env.IMGPROXY_KEY,
      IMGPROXY_SALT: imgproxyHRto.env.IMGPROXY_SALT,
      MOVIE_DB_ACCESS_TOKEN: preserve(),
      NEXT_PUBLIC_BASE_URL: preserve(),
      NEXT_PUBLIC_IMAGEKIT_ID: preserve(),
      NEXT_PUBLIC_IMGPROXY_BASE_URL: preserve(),
      NEXT_PUBLIC_IMGPROXY_ENDPOINT: preserve(),
      NEXT_PUBLIC_POSTHOG_HOST: preserve(),
      NEXT_PUBLIC_POSTHOG_KEY: preserve(),
    },
  });

  // Daily cron that ingests IMDb's ratings dataset into the imdb_ratings
  // table. Prod-only: preview databases just show the card as hidden, and a
  // dev can run `pnpm ingest:imdb` manually when needed. IMDb refreshes the
  // datasets early UTC, so run shortly after.
  const imdbIngest = prod
    ? service("imdb-ingest", {
        source: github("emmut/movies"),
        deploy: {
          startCommand: "pnpm tsx scripts/ingest-imdb-ratings.ts",
          cronSchedule: "30 5 * * *",
          restartPolicyType: "NEVER",
        },
        env: {
          DATABASE_URL: preserve(),
        },
      })
    : null;

  // Railway provisions this volume for the managed Postgres; declare it so
  // plans don't try to delete it.
  // These values must match what Railway provisions with the managed Postgres,
  // otherwise plans show drift or try to shrink/delete the volume.
  const dbVolume = db
    ? volume("postgres-volume", {
        region: "europe-west4-drams3a",
        sizeMB: 5000,
        allowOnlineResize: true,
        alerts: { usage: { "80": {}, "95": {}, "100": {} } },
      })
    : null;

  return project("movies", {
    // db/dbVolume exist only in previews, imdbIngest only in prod; filter the
    // inactive ones out instead of asserting with `!`.
    resources: [movies, imgproxyHRto, db, dbVolume, imdbIngest].filter((r) => r !== null),
  });
});
