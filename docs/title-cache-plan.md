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

## Non-goals

- Mirroring the TMDB catalog. The cache is bounded by what users keep in
  lists and pruned nightly.
- Replacing `'use cache'` for public pages (discover, trending, search,
  detail pages). Those are ephemeral and not keyed by a set of ids; the
  Next cache is the right tool there.
- Long-lived storage of availability data: rows are refreshed nightly and
  deleted when the title leaves every list, in line with the caching
  allowance in TMDB's terms. Re-read the terms before extending any TTL.
