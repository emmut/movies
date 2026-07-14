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

  // Declared in every environment (production included, where it sits unused
  // and asleep) because Railway IaC seeds database credentials only when the
  // service is new project-wide: PR environments fork production, so prod must
  // hold a fully-configured instance for preview databases to inherit. The
  // name is postgres-db (not postgres) because the original hollow "postgres"
  // service still exists project-level for older PR environments; delete it
  // once those PRs close. Production keeps the external DB — see the movies
  // service's DATABASE_URL below.
  const db = postgres("postgres-db");

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
    // old version live. Prod applies committed migrations; the PR database
    // starts empty so it just gets the schema pushed.
    preDeploy: prod ? "pnpm db:migrate" : "pnpm db:push --force",
    deploy: { limitOverride: { containers: { cpu: 2, memoryBytes: 1000000000 } }, sleepApplication: true },
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
  // table. Prod-only: preview databases just show the card as hidden, and a
  // dev can run `pnpm ingest:imdb` manually when needed. IMDb refreshes the
  // datasets early UTC, so run shortly after.
  const imdbIngest = prod
    ? service("imdb-ingest", {
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
          limitOverride: { containers: { cpu: 1, memoryBytes: 500000000 } },
        },
        env: {
          DATABASE_URL: preserve(),
        },
      })
    : null;

  // Railway provisions this volume with the managed Postgres; declare it so
  // plans don't try to delete it or shrink it. The `<db name>-volume` naming
  // pairs it with the postgres-db service.
  const dbVolume = volume("postgres-db-volume", {
    region: "europe-west4-drams3a",
    sizeMB: 5000,
    allowOnlineResize: true,
    alerts: { usage: { "80": {}, "95": {}, "100": {} } },
  });

  return project("movies", {
    // imdbIngest exists only in prod; filter the inactive entry out instead of
    // asserting with `!`.
    resources: [movies, imgproxyHRto, db, dbVolume, imdbIngest].filter((r) => r !== null),
  });
});
