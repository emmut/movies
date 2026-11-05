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

The PostgreSQL search regression tests run in the e2e CI job after migrations. Run them locally against a migrated database with `SEARCH_TEST_DATABASE_URL="$DATABASE_URL" pnpm test apps/web/src/lib/search-index.integration.test.ts`; fixtures use a temporary table.

## Direct streaming links

The watch section uses TMDB/JustWatch for country-specific availability and
Wikidata for provider title identifiers and reviewed official title URLs. The
registry covers 35 identifier properties and 65 TMDB provider IDs/variants,
including regional services and ad tiers. It also reads P856/P953/P973 URLs for
services without dedicated identifier properties. No extra API key is required.
Missing TMDB Wikidata IDs can be recovered through a unique, verified exact
movie/TV or IMDb statement lookup; title names are never used for Wikidata identity matching.
Merged Q identifiers and localized Apple/Netflix URL aliases are resolved without
assigning another country’s offer or accepting conflicting title IDs.

Supported country/date qualifiers are evaluated before rank and ambiguity
selection. Country changes refresh the server section; cached raw Wikidata claims
remain reusable across countries. Claims and reverse lookups revalidate daily
with a seven-day maximum lifetime; each request has a three-second timeout and
no immediate retries. Watch options render before the optional lookup finishes.
Restricted deployments must allow outbound HTTPS to `www.wikidata.org`.
Remaining gaps can use the existing TMDB title homepage if it matches a reviewed
provider title route. Apple Store rent/buy gaps can use Apple's key-free catalogue
API at `itunes.apple.com`, with storefront, exact title/year and movie director
matching. Season/episode URLs cannot stand in for a series. These fallbacks never
add availability, subscription or channel offers. Catalogue metadata revalidates
daily; a bounded process-local queue spaces requests and honors a 429 cooldown
(not a distributed quota guarantee). No Apple artwork or previews are used.
After all local sources settle, unresolved local provider/offer buttons can use
US sources, then GB. Foreign URLs retain their storefront and display a US/UK
catalogue label. They never add foreign availability or replace a local match.
Wikidata's three-market candidates reuse one claims fetch. Existing options
remain visible while optional country fallback lookups finish.
Unsupported or ambiguous destinations retain the explicit TMDB watch-options
fallback. Standalone IDs are not assigned to channel bundles. No pages are scraped
and no Wikidata statements are written.

Supported properties, market restrictions, attribution requirements and the
TMDB policy review are documented in [streaming-links.md](docs/streaming-links.md).

Measure offer-level coverage with
`vpx --env-file-if-exists=apps/web/.env scripts/audit-watch-links.ts SE`.
The JSON report distinguishes missing source data from failed/unmeasured API
lookups, with independent homepage coverage reported separately. It does not
query Apple or measure US/GB fallback stages, and source counts can overlap. Supported-provider counts do
not indicate a catalogue hit rate. See the
measurement notes in `docs/streaming-links.md`.
