# Contributing

A pnpm monorepo with a Next.js (App Router) movies app in `apps/web`, shared packages in `packages`, PostgreSQL/Drizzle, and the TMDB API. Vite+ 1.4.0 provides testing, linting, formatting, and a local `vp` CLI; its shared configuration lives in `vite.config.ts`.

## Prerequisites

- **Vite+** for Node and pnpm management. Install the global CLI from [viteplus.dev](https://viteplus.dev/guide/global-cli), then open a new terminal so its shims take precedence over older runtime/package-manager shims.
- A **PostgreSQL** database for local development.
- A **TMDB API** access token and the other secrets defined in `apps/web/src/env.ts`.
- Node **24.11.1** is pinned in `.node-version`; pnpm **12.15.0** is pinned with integrity in `package.json`. Vite+ installs and selects both.

## Getting started

1. Run `vp env install` and `vp install` to install the pinned runtime, package manager, and dependencies. Vite+ runs tasks and TypeScript scripts on Node; pnpm installs the dependency patches in `pnpm-workspace.yaml`.
2. Copy `apps/web/.env.example` to `apps/web/.env` and fill it in. The web app and root-level database/cron commands read this app-local file. `apps/web/src/env.ts` is the source of truth for what's required. `SKIP_ENV_VALIDATION=true` bypasses validation (used in tests/CI).
3. Apply the schema to your database: `pnpm db:push`.
4. Start the dev server: `pnpm dev`.
5. Optional: populate IMDb ratings with `pnpm ingest:imdb` (~2–5 min, ~1.5M rows). Detail pages work without it — the IMDb card is simply hidden.

`pnpm dev` also boots a local PostgreSQL and imgproxy via Docker Compose, so Docker needs to be running. The default `DATABASE_URL` in `apps/web/.env.example` points at that local database; run `pnpm db:push` once it's up to apply the schema.

The TMDB request collection is `apps/web/movie-db.http`; it reads `apps/web/.env` from the same directory.

## Native app

`apps/native` contains the Expo React Native app; `apps/server` hosts its public oRPC API. Root `pnpm dev` starts Docker, web, API, and Expo together. Start just the native services with `pnpm dev:native` and `pnpm dev:api`. See [the native setup](apps/native/README.md) and [the recorded decisions and full parity roadmap](docs/native-app-roadmap.md) for environment setup, device URLs, current scope, and browser checks. `pnpm check-types` includes both workspaces.

## Common commands

The most-used scripts — run `pnpm run` for the full list, which is authoritative.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server through Turbo. |
| `pnpm build` | Production build through Turbo. |
| `pnpm lint` / `pnpm format` | Lint / format. |
| `pnpm test` | Unit tests on Node through Vite+. |
| `pnpm fallow` | Audit changed files (dead code, complexity, duplication). |
| `pnpm db:push` / `pnpm db:studio` | Apply schema / open Drizzle Studio. |
| `pnpm sync:titles` | Refresh the local title cache (see `scripts/README.md`). |
| `pnpm ingest:search` | Load TMDB's id exports into the fuzzy search index (see `scripts/README.md`). |

Before opening a PR, make sure `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm fallow` all pass. The corresponding `pnpm run` commands use the same scripts.

Use `pnpm exec vp check` (or `pnpm check`) for formatting, linting, and type-aware checks, `pnpm exec vp test run` for unit tests, and `pnpm test:coverage` for coverage. Formatting covers `apps`, `packages`, `scripts`, patch regression tests, and `vite.config.ts`. The pnpm `packageManager` field remains authoritative for installation; run `pnpm install --frozen-lockfile` in CI.

Dependencies shared by workspaces use `catalog:` references; update their versions in the `pnpm-workspace.yaml` catalog. Dependency patch regression tests live in `patches/` and run with `pnpm test`. Railway SDK 3.16 requires Railway CLI 5.42.1 or newer because the IaC compiler now ships with the CLI.

Use `pnpm test:watch` to watch the full suite or `pnpm --filter @movies/web test:watch` for web tests. The package script delegates to the shared root runner with Vite+'s `vp run -w` workspace selector and a test file filter.

To change project versions, run `vp env pin node@<version> --target node-version` or `vp env pin pnpm@<version>`. `vp env current` shows the resolved pair. CI uses the same pins through `setup-vp`. Vite+ owns provisioning; `runtimeOnFail: ignore` and `pmOnFail: ignore` keep pnpm from independently switching tools.

Use `pnpm exec vp run dev` for this project's Docker and Next.js development workflow, `pnpm exec vp run build` for its production build, and `pnpm exec vp run <task>` for any other package script. Vite+ runs tasks, and Turbo retains workspace build/development orchestration. TypeScript utilities run through `vpx`, preserving path aliases and Node's `--env-file` / `--env-file-if-exists` behavior. Built-in `vp dev` and `vp build` run Vite itself and cannot replace Next.js's server or build. `vp test` runs the built-in Vitest runner; `vp run test` runs the project's one-shot test script. Shared packages export source directly to Next.js and have no separate `vp pack` build.

## Conventions

- Prefer normal functions over arrow functions except for inline usage.
- Every `if` and `else` body uses braces, including single-line early returns.
- When moving a module into a shared package, update its consumers to import directly from the package. Remove the old import/re-export or forwarding shim rather than keeping a compatibility layer.
- Write clean, maintainable code with small, cohesive modules and explicit control flow. Avoid nested ternaries and dense chained expressions; prefer descriptive helpers, intermediate values and ordinary blocks when they clarify the behavior.
- Native styling uses Tailwind/Uniwind classes; use React Native style objects only when a library cannot accept classes.
- Native and Hono apps use per-app Varlock `.env.schema` files and generated app-scoped `ENV` modules. Generate with `pnpm env:generate`; do not edit generated files or add env re-export wrappers. The existing web app and cron scripts use T3 Env.
- Naming: kebab-case files, PascalCase exports.
- Use app path aliases for internal imports: `@/` in web, `@native/` in Expo, and `@server/` in Hono. Keep each app tsconfig and the root test resolver aligned; avoid relative parent paths.
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

The PostgreSQL search regression tests run in the e2e CI job after migrations. Run them locally against a migrated database with `SEARCH_TEST_DATABASE_URL="$DATABASE_URL" pnpm test apps/web/src/lib/search-index.integration.test.ts`; fixtures use a temporary table.
