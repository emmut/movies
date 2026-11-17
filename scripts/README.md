# Scripts

## Daily maintenance

`pnpm maintenance:daily` runs title sync, IMDb ratings, and search-index ingest
sequentially in separate processes. Railway runs this as `daily-maintenance`
at **09:00 UTC daily**, after TMDB publishes its exports by 08:00. Title sync
and IMDb ratings now run later than their former 04:00 and 05:30 schedules.
Each job logs its result; failures do not prevent subsequent jobs from running,
and the runner exits non-zero if any job fails. Each child has a six-hour limit
so a hung job cannot indefinitely block the next scheduled run.

The service uses one CPU and 1 GB RAM. It inherits `DATABASE_URL` and
`MOVIE_DB_ACCESS_TOKEN` from the environment, including `apps/web/.env` for the
local command. `TITLE_SYNC_ENABLED` and `SEARCH_INDEX_INGEST_ENABLED` stay true
in production and false in previews; IMDb still runs in previews. Individual
commands below remain available for rerunning one failed job.

## Ingest IMDb Ratings

Downloads IMDb's [non-commercial ratings dataset](https://developer.imdb.com/non-commercial-datasets/) (`title.ratings.tsv.gz`, ~1.5M rows) and upserts it into the `imdb_ratings` table. Detail pages join on it to show IMDb ratings.

### Usage

```bash
pnpm ingest:imdb
```

Needs `DATABASE_URL` (from `apps/web/.env` locally). Runs daily in production through `daily-maintenance` (starting at 09:00 UTC). The dataset is licensed for personal, non-commercial use only.

## Sync Titles

Refreshes the local title cache — the `titles`, `title_availability`, and `title_availability_syncs` tables — for every movie and TV show that appears in any list, then prunes titles no list references any more. List pages filter by streaming provider with a SQL predicate against this cache instead of one TMDB request per row.

### Usage

```bash
pnpm sync:titles
```

Needs `DATABASE_URL`, `MOVIE_DB_ACCESS_TOKEN`, and `TITLE_SYNC_ENABLED=true` (from `apps/web/.env` locally); without the flag the script exits immediately, which is how preview environments stay quiet. Runs daily in production through `daily-maintenance` (09:00 UTC), where the Railway config sets the flag. Titles are also written through when they are added to a list, so a run mostly refreshes stale rows: availability daily, details weekly. A title TMDB has deleted is recorded with an empty availability set so filtered pages stop retrying it. The run exits non-zero if any title failed to sync; failed titles stay stale and are retried the next night.

Watch-provider data comes from JustWatch through TMDB and must be attributed as such wherever it is shown.

## Ingest Search Index

Downloads TMDB's [daily id exports](https://developer.themoviedb.org/docs/daily-id-exports) (movies, TV series, people; roughly 4–5M lines in total) and upserts them into the `search_index` table, then prunes ids that stopped appearing. Pruning is per media type and only runs when that type's export parsed to a plausible number of rows (see `MIN_EXPORT_ROWS`), so an empty or reformatted export can never wipe the index; the run exits non-zero instead. Each line carries only an id, the original title or name, popularity, and the adult flag; adult entries are skipped. Full-page search merges GIN-backed trigram matches from this table with TMDB on page one; command-palette search uses it only when TMDB returns nothing.

### Usage

```bash
pnpm ingest:search
```

Needs `DATABASE_URL` and `SEARCH_INDEX_INGEST_ENABLED=true` (from `apps/web/.env` locally; without the flag the script exits immediately) plus the `pg_trgm` extension, which migration `0015` creates (`0017` replaces the GiST index with GIN for filtered search). Migration `0019` adds a second GIN index for built-in word matching; it indexes existing rows without another ingest. Runs daily in production through `daily-maintenance` (after title sync and IMDb ratings), where the Railway config sets the flag; preview environments leave it off. Without a run the index is simply empty and search behaves as before; run it once locally to try fuzzy search. Attribute TMDB wherever results are shown.

## List Watch Providers

Script to list all available watch providers from TMDB API.

### Usage

```bash
# List all providers for all regions
pnpm list-providers

# List providers for a specific region (e.g. Sweden)
pnpm list-providers SE

# List providers for USA
pnpm list-providers US
```

### What the script does

- Fetches all available streaming providers from TMDB API
- Shows both movie and TV providers
- Sorts by display priority
- Shows statistics on number of providers
- Can filter by specific region

### Example output

```
🎬 TMDB Watch Providers
==================================================
📍 Region: SE

🎬 MOVIE PROVIDERS
------------------------------
  8 | Netflix
337 | Disney Plus
119 | Amazon Prime Video
350 | Apple TV+
...

📺 TV PROVIDERS
------------------------------
  8 | Netflix
337 | Disney Plus
119 | Amazon Prime Video
...

📊 Movie providers: 25
📊 TV providers: 23
📊 Common providers: 20
```

### Technical info

- Uses TypeScript with Node.js `--experimental-strip-types`
- Fetches data from TMDB API endpoints:
  - `/watch/providers/movie`
  - `/watch/providers/tv`
- Uses the project's existing env configuration
