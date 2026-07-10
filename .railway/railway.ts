/// <reference types="node" />
import { execSync } from "node:child_process";
import { defineRailway, github, image, postgres, preserve, project, service, volume } from "railway/iac";

function currentGitBranch() {
  // CI checks out a detached HEAD, so it must provide the PR branch explicitly.
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

  const movies = service("movies", {
    // PR environments track their PR branch; plan/apply for them must run from that branch's checkout.
    source: github("emmut/movies", prod ? {} : { branch: currentGitBranch() }),
    build: "",
    replicas: 1,
    deploy: { limitOverride: { containers: { cpu: 2, memoryBytes: 1000000000 } }, sleepApplication: true },
    domains: prod ? ["movies.emmut.space"] : [],
    env: {
      BETTER_AUTH_SECRET: preserve(),
      BETTER_AUTH_TRUSTED_ORIGIN: preserve(),
      DATABASE_URL: db ? db.env.DATABASE_URL : preserve(),
      DISCORD_CLIENT_ID: preserve(),
      DISCORD_CLIENT_SECRET: preserve(),
      GITHUB_CLIENT_ID: preserve(),
      GITHUB_CLIENT_SECRET: preserve(),
      IMGPROXY_KEY: preserve(),
      IMGPROXY_SALT: preserve(),
      MOVIE_DB_ACCESS_TOKEN: preserve(),
      NEXT_PUBLIC_BASE_URL: preserve(),
      NEXT_PUBLIC_IMAGEKIT_ID: preserve(),
      NEXT_PUBLIC_IMGPROXY_BASE_URL: preserve(),
      NEXT_PUBLIC_IMGPROXY_ENDPOINT: preserve(),
      NEXT_PUBLIC_POSTHOG_HOST: preserve(),
      NEXT_PUBLIC_POSTHOG_KEY: preserve(),
    },
  });
  const imgproxyHRto = service("imgproxy-HRto", {
    source: image("darthsim/imgproxy:v3.18.2"),
    healthcheck: "/health",
    replicas: 1,
    domains: prod ? ["cdn.emmut.space"] : [],
    networking: { privateNetworkEndpoint: "imgproxy-hrto" },
    env: {
      IMGPROXY_KEY: preserve(),
      IMGPROXY_MAX_SRC_RESOLUTION: preserve(),
      IMGPROXY_SALT: preserve(),
      IMGPROXY_TTL: preserve(),
      IMGPROXY_USE_ETAG: preserve(),
    },
  });

  // Railway provisions this volume for the managed Postgres; declare it so
  // plans don't try to delete it.
  const dbVolume = db ? volume("postgres-volume") : null;

  return project("movies", {
    resources: db ? [movies, imgproxyHRto, db, dbVolume!] : [movies, imgproxyHRto],
  });
});
