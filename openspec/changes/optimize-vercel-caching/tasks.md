## 1. Cache Audit And Boundaries

- [x] 1.1 Inventory App Router routes and server read functions, then classify each path as public-shareable, private-user, or dynamic-only.
- [x] 1.2 Identify mixed routes where personalized reads currently force full-page dynamic rendering and document boundary refactors.
- [x] 1.3 Define initial cache tag taxonomy (for example: movies-list, movie-detail, recommendations, user-profile) and target cache lifetimes.

## 2. Public Remote Caching

- [x] 2.1 Apply `use cache: remote` to eligible logged-out page/data paths and ensure outputs are deterministic for anonymous traffic.
- [x] 2.2 Add public cache tagging and revalidation wiring for all public-content mutations.
- [ ] 2.3 Verify logged-out requests consistently hit remote cache after warm-up and return fresh content after tag invalidation.
  - Note: local Next.js runtime does not expose Vercel edge cache hit/miss headers (`x-vercel-cache`), so final verification must run in Vercel preview/production.

## 3. Private Authenticated Caching

- [x] 3.1 Apply `use cache: private` to selected authenticated read helpers with conservative lifetimes.
- [x] 3.2 Ensure private cache paths are keyed/scoped by user/session and cannot be reused across authenticated identities.
- [x] 3.3 Add invalidation hooks for user-affecting writes and auth/session boundary changes.

## 4. Validation And Rollout

- [ ] 4.1 Validate representative logged-out and logged-in flows in preview for correctness, cache behavior, and no data leakage.
  - Progress: local browser validation completed for both logged-out redirect behavior and logged-in anonymous user watchlist/list mutations.
  - Remaining: rerun the same matrix in Vercel preview to validate edge cache behavior and cross-session isolation.
- [ ] 4.2 Measure cache hit behavior and server execution reduction against baseline to confirm cost-improvement targets.
  - Note: pending Vercel Observability/Analytics data from preview deployment to compare cache hit ratio and function executions against baseline.
- [x] 4.3 Roll out incrementally by route group with a documented fallback to dynamic rendering for fast mitigation.
