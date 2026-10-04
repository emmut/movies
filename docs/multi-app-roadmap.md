# Multi-app refactor handoff

## Brief for the next agent

The monorepo currently has a Next.js app in `apps/web` and shared `api`, `auth`, `config`, `db`, and `ui` packages. Prepare it for a future TanStack Start or React Native app without changing current behavior. Work in the PR sequence below. **Do not combine the package extraction with the Hono API migration.** Each PR and each small commit must leave the app and Railway jobs working. Start from the merged monorepo refactor, not from an unmerged copy of its branch.

The Hono transport has not been chosen: the owner is considering oRPC or tRPC. Record the choice and its tradeoffs before implementing endpoints. A second app is a future consumer, not part of this roadmap's implementation scope.

## Current state and desired dependency direction

- Three Railway cron entrypoints in `scripts/` import their data operations through the web app's `@/lib` alias: IMDb ratings, TMDB search-index ingest, and title sync. `scripts/cron-db.ts` also imports the web app's database wait helper. Their command names, schedules, environment flags, and Railway service behavior must survive extraction.
- The web app writes title details and availability through after list changes; the nightly title sync performs the same data operation. Keep this shared behavior in one place.
- Mutations and queries in `apps/web/src/lib` mix Drizzle access with `requireUser`, Next server actions, `next/cache`, and redirects. A second app cannot import that mix directly.
- `@movies/db` currently exports schema, not a browser-safe database client. `@movies/ui` contains DOM/Base UI components and one `next/link` dependency; it is not a React Native UI library.

Target direction: browser-safe contracts, types, validation, and pure rules may be imported by either app. Database operations, cron implementations, credentials, and authenticated TMDB requests remain on the server. Next cache, redirects, and page rendering remain in `apps/web`. React Native calls a server API; it never imports Drizzle, job code, or secrets.

## PR 1 — Extract shared data and cron logic

Make only file moves, import rewrites, and the smallest interface changes needed to remove imports from `scripts/` into `apps/web`. Avoid changing SQL, retry policy, schedules, or data shapes.

1. Add an explicit package export for the framework-independent TMDB request client now in `apps/web/src/lib/tmdb-fetch.ts`. Move only the TMDB types needed by that client and title sync out of `apps/web/src/types`; keep the token-binding wrapper and Next cache wrappers in `apps/web`. Update web and cron imports. Check that no browser-facing export pulls in credentials or Node modules.
2. Move the IMDb parser, batch upsert, and stale-row deletion from `apps/web/src/lib/imdb-ingest.ts` into a Node-only package module. Keep `scripts/ingest-imdb-ratings.ts` as the streaming, configuration, and logging entrypoint. Keep the existing parser and database tests running against the new import.
3. Move the search-index export parsing, completeness thresholds, batch upsert, and prune logic from `apps/web/src/lib/search-index-ingest.ts` into a Node-only package module. Expose title normalization separately through a browser-safe export for search ranking. Preserve the safeguards against pruning an incomplete export.
4. Move the title and availability sync operations from `apps/web/src/lib/title-sync.ts` into a Node-only package module. Update the nightly cron and the web write-through adapter. Keep the web adapter responsible for its cached TMDB fetchers and post-mutation invalidation; keep the cron adapter responsible for raw TMDB fetches and its own connection.
5. Move the database readiness helper used by both cron startup and migration out of the web app. Keep environment validation in each runtime's entrypoint. Remove the old `@/lib` imports from the cron scripts once all callers are updated; avoid duplicate re-export layers unless a compatibility step needs one temporarily.
6. Update workspace exports, declared dependencies, TypeScript coverage, Vitest aliases if needed, and docs. Verify the Railway start commands still resolve the moved code from a clean install. Make no Railway topology or schedule change in this PR.

Suggested commit size: one prerequisite type/client move, then one ingest job per commit, then title sync, then cleanup. Run the relevant existing tests after each move. Before opening the PR run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm fallow`, `pnpm build`, and the existing Playwright CI job. Check the preview Railway cron builds and app deployment. Add tests only where an external behavior is not already protected.

## PR 2 — Decide and establish the API foundation

This is a separate PR. First write a short decision record choosing **Hono with either oRPC or tRPC**, based on the current official documentation and a small proof covering the web client, a React Native client, shared validation/types, errors, and authentication. Pick one transport; do not maintain parallel contracts. Decide whether Hono initially runs under the existing web origin or as its own Railway service. Same-origin mounting is the lower-risk default while session and cache behavior are being established; a separate service requires a concrete cookie/CORS/CSRF and deployment design.

1. Define a server module interface for one small vertical slice. Put authorization, validation, and database operations behind that interface; keep HTTP details out of it. Use the existing `@movies/api` schemas when suitable rather than creating parallel validation rules.
2. Add Hono routing, typed transport, error mapping, and request-scoped user identity. Demonstrate an authenticated read and a mutation with tests for an unauthenticated request, another user's resource, invalid input, success, and a failed database operation. Preserve anonymous-user account linking and existing Better Auth behavior.
3. Start with one slice such as user region/preferences. Leave existing server actions operational until the web caller has moved and the end-to-end path passes. Do not dual-write. If a standalone Railway API service is chosen, update `.railway/railway.ts` and preview IaC in this PR, validate `railway config plan`, and verify the preview domain and environment references before production changes.
4. Specify how mutations invalidate or refresh data displayed by the Next app. An API mutation cannot assume it can call the current web process's `revalidateTag` or `revalidatePath`, especially if Hono is a separate service. Test the chosen cache behavior from the user's view.

Acceptance: the migrated web interaction works through the new API, its authorization and cache behavior match the old path, the untouched interactions still use their old actions, and every repository gate plus Playwright and Railway preview passes.

## PR 3 and later — Migrate remaining app operations by vertical slice

Move one user-visible slice at a time: system lists and watched/watchlist, custom lists and ordering, search/catalog reads, then remaining preferences and account operations. For each slice:

1. Record the old input, output, authorization, error, ordering, and cache behavior. Add or update contract tests at the API interface and retain an end-to-end browser test for the user workflow.
2. Extract framework-independent operations from the Next action, expose them through the chosen typed transport, switch the web caller, then remove the obsolete action. Keep transactions, ownership filters, ordering locks, title write-through, and cache invalidation behavior intact.
3. Treat passkeys, social login, anonymous-user linking, and mobile session handling as an explicit auth migration; do not infer that sharing a redirect helper shares the whole auth flow.
4. After web callers are stable, a later, separately scoped PR can build a second app against the public contract. Keep native UI separate from `@movies/ui`; share validation, types, and pure rules. That app must use the API for authenticated data and media requests needing secrets.

## Decisions and limits

- No database schema or migration change is intended for package extraction. If one becomes necessary, stop and document why.
- Do not run duplicate cron jobs for a second app. Existing Railway jobs continue to populate the shared database.
- Do not publish server-only package entrypoints to client bundles. Use explicit package exports and import checks to enforce this.
- Shared cron modules must also run under Nub; do not add Next's `server-only` marker to an entrypoint that the cron imports.
- Do not replace Next caching with an untested approximation. Cache semantics and invalidation are part of the behavior to preserve.
- Preserve the existing local Docker, Drizzle, Railway IaC, lint, test, formatting, fallow, and Playwright workflows.
- This roadmap does not choose a second-app framework or create a React Native/TanStack Start app.

## Completion evidence for each PR

Record the commands and results in the PR description. The minimum local gate is `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm fallow`. Also run `pnpm build` for changes that affect the web app. Use the existing Playwright CI job for user-visible behavior and verify Railway preview deployment when imports or infrastructure change. Report any skipped integration test explicitly rather than calling the PR fully verified.
