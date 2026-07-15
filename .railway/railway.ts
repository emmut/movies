/// <reference types="node" />
import { execSync } from "node:child_process";
import { defineRailway, github, image, postgres, preserve, project, service, volume } from "railway/iac";

const APP_DOMAIN = "movies.emmut.space";
const CDN_DOMAIN = "cdn.emmut.space";

// Railway sizes memory in decimal bytes (1 GB = 1_000_000_000).
const MB_IN_BYTES = 1_000_000;
const GB_IN_BYTES = 1_000 * MB_IN_BYTES;

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

  // Railway provisions this volume with the managed Postgres; declare it so
  // plans don't try to delete it or shrink it.
  const dbVolume = volume("postgres-db-volume", {
    region: "europe-west4-drams3a",
    sizeMB: 5_000,
    allowOnlineResize: true,
    alerts: { usage: { "80": {}, "95": {}, "100": {} } },
  });

  // Managed Postgres for preview databases, declared in every environment
  // (production included, where it sits unused and asleep — the app there
  // keeps the external DB) so PR environments fork a fully-configured
  // instance. The deploy options rely on patches/railway.patch: upstream
  // drops deploy config for database nodes, which would otherwise unset
  // these on every apply. The old hollow "postgres" service still exists
  // project-level for older PR environments; delete it once those PRs close.
  const db = postgres("postgres-db", {
    deploy: {
      // Sleeps when idle (a connection wakes it), so the unused prod instance
      // and quiet previews cost next to nothing.
      sleepApplication: true,
      limitOverride: { containers: { cpu: 1, memoryBytes: 500 * MB_IN_BYTES } },
    },
  });

  const imgproxyHRto = service("imgproxy-HRto", {
    source: image("darthsim/imgproxy:v3.18.2"),
    healthcheck: "/health",
    deploy: {
      // Resizes images only on demand — sleep when idle (an image request
      // wakes it) instead of running around the clock. Resizing TMDB posters
      // is light work, so cap it at one core and half a GB.
      sleepApplication: true,
      limitOverride: { containers: { cpu: 1, memoryBytes: 500 * MB_IN_BYTES } },
    },
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
    deploy: { limitOverride: { containers: { cpu: 2, memoryBytes: 1 * GB_IN_BYTES } }, sleepApplication: true },
    domains: prod ? [APP_DOMAIN] : [],
    env: {
      BETTER_AUTH_SECRET: preserve(),
      BETTER_AUTH_TRUSTED_ORIGIN: preserve(),
      // Production keeps the external DB; previews use their forked postgres-db.
      DATABASE_URL: prod ? preserve() : db.env.DATABASE_URL,
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
  // table. Declared in every environment: PR environments fork production
  // including this service, and deleting it there cancelled the forked
  // deployment mid-flight, which Railway reported as a failed PR check.
  // Previews ingest into their own postgres instead (and get real IMDb data);
  // IMDb refreshes the datasets early UTC, so run shortly after.
  const imdbIngest = service("imdb-ingest", {
    source: github("emmut/movies"),
    // The cron only needs dependencies + tsx; Railpack's default
    // `pnpm run build` would run `next build`, which fails env validation
    // since this service only has DATABASE_URL.
    build: { buildCommand: "echo 'skipping app build — cron runs tsx directly'" },
    deploy: {
      startCommand: "pnpm tsx scripts/ingest-imdb-ratings.ts",
      cronSchedule: "30 5 * * *",
      restartPolicyType: "NEVER",
      // Streaming ingest with 5k-row batches and a single pg connection —
      // stays well under half a GB and one core.
      limitOverride: { containers: { cpu: 1, memoryBytes: 500 * MB_IN_BYTES } },
    },
    env: {
      // Production ingests into the external DB; previews into their forked
      // postgres-db.
      DATABASE_URL: prod ? preserve() : db.env.DATABASE_URL,
    },
  });

  return project("movies", {
    resources: [movies, imgproxyHRto, db, dbVolume, imdbIngest],
  });
});
