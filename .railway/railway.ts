/// <reference types="node" />
import { execSync } from "node:child_process";
import { defineRailway, github, image, postgres, preserve, project, service, volume } from "railway/iac";

const APP_DOMAIN = "movies.emmut.space";
const CDN_DOMAIN = "cdn.emmut.space";
// Web listens here; the API reaches it on this port over the private network.
const WEB_PORT = "8080";

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
  const settings = prod
    ? { appDomains: [APP_DOMAIN], cdnDomains: [CDN_DOMAIN], enableIngest: "true" }
    : { appDomains: [], cdnDomains: [], enableIngest: "false" };

  // Railway provisions this volume with the managed Postgres; declare it so
  // plans don't try to delete it or shrink it.
  const dbVolume = volume("postgres-db-volume", {
    region: "europe-west4-drams3a",
    sizeMB: 5_000,
    allowOnlineResize: true,
    alerts: { usage: { "80": {}, "95": {}, "100": {} } },
  });

  // A fresh PR fork can omit the database service. Bootstrap it with the
  // Postgres helper so Railway generates credentials and a usable DATABASE_URL.
  // Later applies model the existing image-backed service to preserve those
  // credentials and its volume attachment.
  const dbService = service("postgres-db", {
    source: image("ghcr.io/railwayapp-templates/postgres-ssl:18"),
    volumeMounts: { "/var/lib/postgresql/data": dbVolume },
    deploy: {
      // Every database may sleep when idle. Web startup, migrations, and cron
      // jobs all wait for the wake-up connection before doing real work.
      sleepApplication: true,
      requiredMountPath: "/var/lib/postgresql/data",
      limitOverride: { containers: { cpu: 1, memoryBytes: 500 * MB_IN_BYTES } },
    },
    env: {
      DATABASE_PUBLIC_URL: preserve(),
      DATABASE_URL: preserve(),
      PGDATA: preserve(),
      PGDATABASE: preserve(),
      PGHOST: preserve(),
      PGPASSWORD: preserve(),
      PGPORT: preserve(),
      PGUSER: preserve(),
      POSTGRES_DB: preserve(),
      POSTGRES_PASSWORD: preserve(),
      POSTGRES_USER: preserve(),
      SSL_CERT_DAYS: preserve(),
    },
  });
  const db = process.env.RAILWAY_BOOTSTRAP_POSTGRES === "true"
    ? postgres("postgres-db", {
        deploy: {
          sleepApplication: true,
          limitOverride: { containers: { cpu: 1, memoryBytes: 500 * MB_IN_BYTES } },
        },
      })
    : dbService;

  const imgproxyHRto = service("imgproxy-HRto", {
    // Railway auto-updates the image to new minor versions nightly (02–06).
    source: image("darthsim/imgproxy:v3.31.4", {
      autoUpdates: {
        type: "minor",
        schedule: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, startHour: 2, endHour: 6 })),
      },
    }),
    healthcheck: "/health",
    deploy: {
      // Resizes images only on demand — sleep when idle (an image request
      // wakes it) instead of running around the clock. Concurrent avif encodes
      // of TMDB originals spike past half a GB, so give it a full GB.
      sleepApplication: true,
      limitOverride: { containers: { cpu: 1, memoryBytes: 1 * GB_IN_BYTES } },
    },
    // Pin next to the users (and the DB volume region).
    replicas: { "europe-west4": 1 },
    domains: settings.cdnDomains,
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
    source: applicationSource(prod),
    // Runs before each deploy; a non-zero exit aborts the deploy and keeps the
    // old version live. Both environments apply committed migrations — PR
    // databases start empty and the chain builds them from scratch. The
    // wrapper polls the DB before migrating: sleeping preview databases drop
    // the very connection that wakes them, and drizzle-kit's single connect
    // attempt would fail the deploy. Never use `db:push --force` here:
    // headless drizzle-kit push crashes mid-apply in its prompt renderer
    // while the deploy still reports success, leaving a partial schema and
    // an empty migration journal behind.
    preDeploy: "./node_modules/.bin/vp run db:migrate:railway",
    build: { buildCommand: "./node_modules/.bin/vp run build" },
    deploy: { startCommand: "./node_modules/.bin/vp run start", limitOverride: { containers: { cpu: 2, memoryBytes: 1 * GB_IN_BYTES } }, sleepApplication: true },
    domains: settings.appDomains,
    env: {
      PORT: WEB_PORT,
      API_URL: "https://${{api.RAILWAY_PUBLIC_DOMAIN}}",
      RPC_IP_SOURCE: "railway",
      BETTER_AUTH_SECRET: preserve(),
      BETTER_AUTH_TRUSTED_ORIGIN: preserve(),
      PASSKEY_ANDROID_FINGERPRINTS: preserve(),
      // Every environment uses its own postgres-db.
      DATABASE_URL: db.env.DATABASE_URL,
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
      NEXT_PUBLIC_IMGPROXY_BASE_URL: preserve(),
      NEXT_PUBLIC_IMGPROXY_ENDPOINT: preserve(),
      NEXT_PUBLIC_POSTHOG_HOST: preserve(),
      NEXT_PUBLIC_POSTHOG_KEY: preserve(),
    },
  });

  // Public Hono/oRPC API for the native app. Runs the TypeScript entrypoint
  // directly (tsx), so the build only installs dependencies. Hono hosts
  // Better Auth from @movies/auth; web proxies its existing auth URLs here.
  // Native clients send no Origin, so CORS_ORIGIN stays
  // unset and production admits no browser origins. Railway configuration
  // cannot register a new custom domain, so the Railway infra workflow gives
  // every environment a generated domain after apply. To move production to
  // a custom domain, add it in the dashboard and declare it here.
  const api = service("api", {
    source: applicationSource(prod),
    build: { buildCommand: "echo 'skipping app build — the API runs its TypeScript entrypoint'" },
    deploy: {
      startCommand: "./node_modules/.bin/vp run @movies/server#start",
      healthcheckPath: "/health",
      sleepApplication: true,
      limitOverride: { containers: { cpu: 1, memoryBytes: 500 * MB_IN_BYTES } },
    },
    replicas: { "europe-west4": 1 },
    env: {
      NODE_ENV: "production",
      MOVIE_DB_ACCESS_TOKEN: movies.env.MOVIE_DB_ACCESS_TOKEN,
      // Same database as web: fuzzy search reads its search_index table.
      DATABASE_URL: db.env.DATABASE_URL,
      // Reach web over the private network. The public custom domain sits
      // behind Cloudflare, which answers Railway egress with a 403 challenge,
      // so cache invalidation must use the private network.
      BETTER_AUTH_URL: movies.env.NEXT_PUBLIC_BASE_URL,
      BETTER_AUTH_SECRET: movies.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_TRUSTED_ORIGIN: movies.env.BETTER_AUTH_TRUSTED_ORIGIN,
      DISCORD_CLIENT_ID: movies.env.DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET: movies.env.DISCORD_CLIENT_SECRET,
      GITHUB_CLIENT_ID: movies.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: movies.env.GITHUB_CLIENT_SECRET,
      PASSKEY_ANDROID_FINGERPRINTS: movies.env.PASSKEY_ANDROID_FINGERPRINTS,
      WEB_URL: `http://\${{movies.RAILWAY_PRIVATE_DOMAIN}}:${WEB_PORT}`,
      AUTH_IP_SOURCE: "railway",
      AUTH_PROXY_SECRET: movies.env.BETTER_AUTH_SECRET,
    },
  });

  // One daily run after TMDB publishes its exports by 08:00 UTC. The runner
  // isolates the scripts in sequential processes and reports all failures.
  // Keep the service in previews too: IMDb still populates preview ratings,
  // while the two opt-in jobs remain disabled there.
  const dailyMaintenance = service("daily-maintenance", {
    source: applicationSource(prod),
    build: { buildCommand: "echo 'skipping app build — cron runs vpx directly'" },
    deploy: {
      startCommand: "./node_modules/.bin/vpx scripts/daily-maintenance.ts",
      cronSchedule: "0 9 * * *",
      restartPolicyType: "NEVER",
      // Sequential processes share the largest existing job limit.
      limitOverride: { containers: { cpu: 1, memoryBytes: 1 * GB_IN_BYTES } },
    },
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      MOVIE_DB_ACCESS_TOKEN: movies.env.MOVIE_DB_ACCESS_TOKEN,
      TITLE_SYNC_ENABLED: settings.enableIngest,
      SEARCH_INDEX_INGEST_ENABLED: settings.enableIngest,
    },
  });

  return project("movies", {
    resources: [movies, api, imgproxyHRto, db, dbVolume, dailyMaintenance],
  });
});

function applicationSource(production: boolean) {
  return github("emmut/movies", production ? {} : { branch: currentGitBranch() });
}
