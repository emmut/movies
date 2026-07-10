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
    // old version live. Prod applies committed migrations; the PR database
    // starts empty so it just gets the schema pushed.
    preDeploy: prod ? "pnpm db:migrate" : "pnpm db:push --force",
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
    resources: db ? [movies, imgproxyHRto, db, dbVolume!] : [movies, imgproxyHRto],
  });
});
