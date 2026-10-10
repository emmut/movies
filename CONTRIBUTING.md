# Contributing

A pnpm monorepo with a Next.js (App Router) movies app in `apps/web`, shared packages in `packages`, PostgreSQL/Drizzle, and the TMDB API.

## Prerequisites

- **mise** for the pinned Node and Nub versions; pnpm remains available through the `packageManager` field for Railway and direct package-manager commands.
- A **PostgreSQL** database for local development.
- A **TMDB API** access token and the other secrets defined in `apps/web/src/env.ts`.

## Getting started

1. Run `mise install` and `pnpm install` to install the pinned tools and dependencies. Nub runs scripts; pnpm remains the installer because the current Next and Railway patches use pnpm's patch format.
2. Copy `apps/web/.env.example` to `apps/web/.env` and fill it in. The web app and root-level database/cron commands read this app-local file. `apps/web/src/env.ts` is the source of truth for what's required. `SKIP_ENV_VALIDATION=true` bypasses validation (used in tests/CI).
3. Apply the schema to your database: `nub run db:push`.
4. Start the dev server: `nub run dev`.
5. Optional: populate IMDb ratings with `nub run ingest:imdb` (~2–5 min, ~1.5M rows). Detail pages work without it — the IMDb card is simply hidden.

`nub run dev` also boots a local PostgreSQL and imgproxy via Docker Compose, so Docker needs to be running. The default `DATABASE_URL` in `apps/web/.env.example` points at that local database; run `nub run db:push` once it's up to apply the schema.

The TMDB request collection is `apps/web/movie-db.http`; it reads `apps/web/.env` from the same directory.

## Native app

`apps/native` contains the Expo React Native app; `apps/server` hosts its public oRPC API. Root `nub run dev` starts Docker, web, API, and Expo together. Start just the native services with `nub run dev:native` and `nub run dev:api`. See [the native setup and roadmap](apps/native/README.md) for environment setup, device URLs, current scope, and browser checks. `nub run check-types` includes both workspaces.

## Common commands

The most-used scripts — run `nub run` for the full list, which is authoritative.

| Command | Purpose |
| --- | --- |
| `nub run dev` | Docker plus web, API, and Expo through Turbo. |
| `nub run build` | Production build through Turbo. |
| `nub run lint` / `nub run format` | Lint / format. |
| `nub run --node test` | Unit tests; Vitest fake timers require plain Node. |
| `nub run fallow` | Audit changed files (dead code, complexity, duplication). |
| `nub run db:push` / `nub run db:studio` | Apply schema / open Drizzle Studio. |
| `nub run sync:titles` | Refresh the local title cache (see `scripts/README.md`). |
| `nub run ingest:search` | Load TMDB's id exports into the fuzzy search index (see `scripts/README.md`). |

Before opening a PR, make sure `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm fallow` all pass. The corresponding `nub run` commands use the same scripts.

## Conventions

- Prefer normal functions over arrow functions except for inline usage.
- Naming: kebab-case files, PascalCase exports.
- Server-only modules import `server-only`; keep secrets and DB access out of client components.
- Mutations go through server actions: every action authenticates via `requireUser()` and validates input with the Zod schemas in `apps/web/src/lib/validations.ts`.
- Caching uses the `'use cache'` directive with tags in `apps/web/src/lib/cache-tags.ts`; invalidate via the helpers in `apps/web/src/lib/cache-invalidation.ts`.
- URL state (filters, pagination) via `nuqs` loaders in `apps/web/src/lib/*-search-params.ts`. Fetch in server components; keep interactivity in client components.

## Design notes (non-obvious)

- Anonymous users are supported; their watchlist is migrated onto the account on link/sign-in.
- List pages answer the stream-provider filter from a local cache of the titles in users' lists (`titles`, `title_availability`), written through on add and refreshed nightly by `scripts/sync-titles.ts`. TMDB stays the source of truth; everything else (discover, search, detail pages) reads TMDB through `'use cache'`. See `docs/title-cache-plan.md` for what the cache is meant to unlock next.
- Full-page search merges TMDB with a local fuzzy index on page one: `search_index` holds every TMDB id with its original title (from the daily exports), matched with `pg_trgm`. Title-match tiers provide the primary order, with reciprocal-rank fusion combining source ranks inside each tier. Only index candidates absent from TMDB are hydrated, capped at three when TMDB has results. The command palette stays TMDB-first with a zero-result fuzzy fallback to avoid database wake-up latency on every keystroke. An empty index simply degrades to TMDB-only results.
- Auth is Better Auth with Discord/GitHub social providers and passkey support.
- UI primitives are Base UI (`@base-ui/react`) styled in `packages/ui/src/components/`, shadcn-managed via `components.json`.

## Testing

- Vitest, Node environment, tests co-located as `apps/web/src/**/*.test.ts, packages/**/*.test.ts`.
- Pure logic is tested directly. Server actions mock `@/lib/db`, `@/lib/auth-server`, and `next/cache` — see `apps/web/src/lib/lists.test.ts` for the chainable db-mock pattern.

## CI

`.github/workflows/ci.yml` gates every PR, including stacked PRs whose base is another feature branch:

- **Lint, typecheck & test**.
- **Fallow audit** — fails only on findings newly introduced relative to the merge-base.

The PostgreSQL search regression tests run in the e2e CI job after migrations. Run them locally against a migrated database with `SEARCH_TEST_DATABASE_URL="$DATABASE_URL" nub run --node test apps/web/src/lib/search-index.integration.test.ts`; fixtures use a temporary table.
