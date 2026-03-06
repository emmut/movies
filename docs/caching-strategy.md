# Caching Strategy

## Route and Data Classification

### Public-shareable

- `/` home modules fed by TMDB public endpoints in `src/lib/movies.ts` and `src/lib/tv-shows.ts`
- `/discover` anonymous discover queries and genre navigation
- `/movie/[movieId]`, `/tv/[tvId]`, `/person/[id]` TMDB detail/credits/recommendation reads
- TMDB-backed shared lookups:
  - trending, now-playing, upcoming, top-rated, discover
  - movie/tv/person details and credits
  - trailer/recommendations/similar
  - watch providers by region

### Private-user

- `getUserRegion()` in `src/lib/user-actions.ts`
- `getUserWatchProviders()` in `src/lib/user-actions.ts`
- `isResourceInWatchlist()` and `getWatchlistCount()` in `src/lib/watchlist.ts`
- `getUserListsWithStatus()` and `getUserListCount()` in `src/lib/lists.ts`

### Dynamic-only

- `/settings` (explicit `noStore()`)
- `/watchlist`, `/lists`, `/lists/[id]` authenticated pages with frequent user writes
- `/search` query-driven high-cardinality result sets

## Mixed Boundaries and Refactors

- Movie and TV detail pages use shared TMDB reads with private user state (watchlist membership and region).
  - Shared reads are remotely cached.
  - User-specific reads are privately cached and scoped by user id.
- Discover and home pages can serve shared remote-cached TMDB data while user preferences are separately resolved from private helpers.
- List/watchlist/status read helpers are isolated in private-cache wrappers so personalized lookups do not pollute shared cache domains.

## Cache Tag Taxonomy

- Public tags are prefixed with `public:` and grouped by domain:
  - `public:home:*`
  - `public:discover:*`
  - `public:genres:*`
  - `public:movie:<id>:*`
  - `public:tv:<id>:*`
  - `public:person:<id>:*`
  - `public:watch-providers:<region>`
- Private tags are prefixed with `private:user:<id>:` and scoped to user/session data:
  - region and watch providers
  - watchlist item/list/count
  - lists and per-resource list-status

Implementation: `src/lib/cache-tags.ts`.

## Invalidation Wiring

- User preference updates invalidate private preference tags:
  - `updateUserRegion`, `setUserWatchProviders`
- Watchlist writes invalidate private watchlist tags:
  - `addToWatchlist`, `removeFromWatchlist`, `toggleWatchlist`
- List writes invalidate private list and list-status tags:
  - `createList`, `addToList`, `removeFromList`, `deleteList`, `updateList`

Implementation: `src/lib/cache-invalidation.ts`.

## Rollout Plan and Fallback

1. Ship cache-tag taxonomy and invalidation helpers.
2. Enable remote caching on shared TMDB read paths.
3. Enable private caching on authenticated read helpers.
4. Monitor for cache correctness regressions in preview and production.
5. If regressions occur, remove targeted `'use cache: remote'` or `'use cache: private'` directives for affected routes/functions and fall back to dynamic behavior.

## Validation and Measurement

- Functional validation:
  - Anonymous browsing: home, discover, movie/tv/person pages
  - Authenticated browsing: watchlist/list status on movie/tv/person pages
  - Mutations: watchlist/list/settings updates reflect after invalidation
- Cost/performance baseline guidance:
  - Compare Vercel Function invocation volume and duration before/after rollout
  - Compare origin request volume to TMDB endpoints before/after rollout
  - Track cache-hit behavior from Vercel/Next.js cache observability tooling
