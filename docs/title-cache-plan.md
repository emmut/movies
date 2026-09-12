# Local title cache: plan

## Why

TMDB's API cannot intersect an arbitrary set of ids with a filter: discover
takes `with_watch_providers`, but there is no way to say "only these ids".
So "my watchlist, on Netflix" had no single call, and the list pages loaded
every row and asked TMDB about each one in memory. TMDB's own lists need a
TMDB account and cannot be filtered by provider either. Scraping the catalog
would be both against the spirit of TMDB's terms (they publish daily id
exports and a changes feed precisely so nobody crawls) and unnecessary: the
app only ever needs data for the titles someone has put in a list.

The answer is a Postgres-backed cache of that working set, in the same way
`imdb_ratings` already caches IMDb's dataset. TMDB stays the source of
truth; the cache is a copy with a timestamp.

## What exists (this PR)

- `titles` — one row per (media type, TMDB id) in any list: title, poster,
  release date, vote average, runtime, genre ids, `fetched_at`.
- `title_availability_syncs` — a per-title marker that availability was
  fetched, so a title with no offers anywhere (or deleted from TMDB) is
  "known" and never re-fetched on render.
- `title_availability` — one row per (title, region, provider, offer type)
  for every region the app supports. The provider filter on list pages is an
  `EXISTS` against it, so counting and paging happen in SQL.
- Write-through: adding to a custom list or a system list schedules a sync
  of that title in `after()`, served from the `'use cache'` entries the
  detail page just filled.
- Lazy catch-up: a filtered page first syncs any title in scope that
  predates the cache, once, with bounded concurrency. A failed sync throws
  rather than rendering "no matches".
- Nightly `pnpm sync:titles` (Railway `title-sync` cron): refreshes
  availability older than ~20h and details older than ~1 week, inserts
  titles the write-through missed, and prunes titles no list references.

## Next steps

Rough order; each is independently shippable.

1. **Render list grids from `titles`.** `hydrateResourceDetails` and the
   custom-list hydration still fetch details per row through
   `getMovieDetails` / `getTvShowDetails`. Read title, poster, date and
   rating from `titles` instead (joined in the same page query), and fall
   back to TMDB only for rows without a cached title yet. This removes the
   last per-row TMDB fan-out from list pages. Requires the grid card to
   accept the flatter shape; the detail types stay for detail pages.
2. **Sort and filter lists in SQL.** With titles local: sort by rating,
   release year, runtime, or date added; filter by genre; search within a
   list. Reuse the `nuqs` loader pattern from `discover-search-params.ts`.
   The system list and custom list pages share this; keep the predicate
   builders next to `streamableOnProviders`.
3. **Offer-type filter.** `title_availability` already stores rent and buy
   offers; expose "also show rentals" as a toggle. Same predicate, wider
   `offer_type` set.
4. **Changes-feed invalidation for details.** Details refresh on a weekly
   TTL today. Once the working set is large enough that the nightly details
   pass costs more than ~200 requests, switch to `/movie/changes` and
   `/tv/changes` (24h window, paged) and refresh only ids that intersect the
   working set, keeping the TTL as a safety net for missed nights. Not
   worth it before then: the feeds are ~100–200 pages a day regardless of
   working-set size. Availability is not in the changes feed, so it stays
   on its TTL.
5. **Backfill on deploy.** The lazy catch-up handles pre-existing lists on
   first filtered render, one title at a time. If that first render is too
   slow for large lists, run `pnpm sync:titles` once right after the
   migration lands (it inserts every missing title) so the lazy path finds
   nothing to do.
6. **Attribution.** Anywhere availability from the cache is shown, keep the
   "streaming data by JustWatch" attribution TMDB requires next to the
   provider logos.
7. **Anonymous watchlist migration.** Rows migrated onto an account on
   sign-in bypass `addToList`, so they are not written through; the lazy
   path and the nightly job cover them. If that ever matters, schedule a
   sync in the migration path too.

## Search

Same principle, different slice. TMDB's `/search` endpoints are literal
title matches with no typo tolerance and no control over ranking, and there
is no corpus to embed for semantic queries. TMDB's daily id exports supply
the slice search needs without crawling: every id with its original title
and popularity.

Done (PR 2 in this stack):

- `search_index` from the exports, `pg_trgm` GIN index on a folded title,
  daily `pnpm ingest:search` (Railway `search-index-ingest`, opt-in via
  `SEARCH_INDEX_INGEST_ENABLED`).
- Zero-result fallback: when TMDB returns nothing on page 1, filter candidates with indexed trigram and word-similarity predicates,
  retain the closest 40 from each, then re-rank by similarity, a prefix boost,
  and log popularity. Hydrate the hits from the cached details fetchers.
  A transaction-local 1.5s statement timeout cancels expensive database work;
  a caller deadline also bounds the wait for a connection.
- The command palette uses the same TMDB-first path with a dropdown-sized
  fallback. A local-first palette was tried and reverted: every keystroke
  paid a database round trip (seconds on a sleeping preview database) plus
  one details fetch per hit, against TMDB's single request.
- Title-match ranking (`src/lib/search-rank.ts`): every TMDB page is
  re-ordered by how closely the folded title matches the folded query —
  exact, then the query as a leading word, then prefix, then substring —
  with a stable sort so TMDB's own order (or popularity, in the year
  fan-out) breaks ties. TMDB ranks by a popularity blend, which put
  "Alien: Romulus" above "Alien" for "alien".
- Merged first page: on the full search page, the index runs alongside TMDB
  for queries without a year filter and its hits are added to page 1
  (deduplicated by media type and id, ranked on equal terms, queued behind
  TMDB within a tier). An exact match TMDB buried on page 2 now surfaces at
  the top; typos still get the index's fuzzy hits after TMDB's literal ones.
  The palette keeps the zero-result fallback only.

Next:

1. **Measure search on the full catalog.** The unfiltered GiST k-NN query
   exceeded the deadline on the 6.36M-row preview index, and its backend was
   killed during a direct probe. Migration `0017` replaces it with GIN and
   indexed similarity filters. Common fragments can still match many rows;
   monitor cancellations and tune candidate thresholds against real queries.
2. **Tune the ranking.** The index weights (similarity, prefix boost, log
   popularity in `search-index.ts`) and the match tiers in `search-rank.ts`
   are a first guess; tune against real queries once PostHog shows what
   people type. Watch for obscure exact-title matches from the index
   crowding out popular near-matches — a popularity floor on merged hits is
   the obvious lever.
3. **Localized and alternative titles.** The exports carry original titles
   only, so "Amélie" misses "Le fabuleux destin d'Amélie Poulain". Union in
   `titles.title` (English titles for everything in a list) and fetch
   `/alternative_titles` lazily for hits people click, storing them as extra
   index rows keyed to the same id.
4. **Ingest cost.** Four to five million upserts a night is fine for
   Postgres but not free. If it becomes a problem: skip people below a
   popularity floor, or diff against yesterday's file and upsert only
   changed lines.
5. **Semantic search within lists.** Store overviews next to `titles`, embed
   them, add a `pgvector` column: "that heist one" over your own watchlist
   is small and clearly within the caching allowance.
6. **Semantic search over the catalog.** No overviews in the exports, so no
   corpus to embed. The practical substitute is query expansion: a small
   language-model call turns a description into candidate titles, which run
   through the normal search path; cache by normalized query. Check the
   current API reference before wiring it up.

## Non-goals

- Mirroring the TMDB catalog. The cache is bounded by what users keep in
  lists and pruned nightly.
- Replacing `'use cache'` for public pages (discover, trending, search,
  detail pages). Those are ephemeral and not keyed by a set of ids; the
  Next cache is the right tool there.
- Long-lived storage of availability data: rows are refreshed nightly and
  deleted when the title leaves every list, in line with the caching
  allowance in TMDB's terms. Re-read the terms before extending any TTL.
