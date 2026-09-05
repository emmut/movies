# Scripts

## Ingest IMDb Ratings

Downloads IMDb's [non-commercial ratings dataset](https://developer.imdb.com/non-commercial-datasets/) (`title.ratings.tsv.gz`, ~1.5M rows) and upserts it into the `imdb_ratings` table. Detail pages join on it to show IMDb ratings.

### Usage

```bash
pnpm ingest:imdb
```

Needs `DATABASE_URL` (from `.env` locally). Runs daily in production as the `imdb-ingest` Railway cron service (05:30 UTC, shortly after IMDb refreshes the datasets). The dataset is licensed for personal, non-commercial use only.

## Sync Titles

Refreshes the local title cache — the `titles`, `title_availability`, and `title_availability_syncs` tables — for every movie and TV show that appears in any list, then prunes titles no list references any more. List pages filter by streaming provider with a SQL predicate against this cache instead of one TMDB request per row.

### Usage

```bash
pnpm sync:titles
```

Needs `DATABASE_URL`, `MOVIE_DB_ACCESS_TOKEN`, and `TITLE_SYNC_ENABLED=true` (from `.env` locally); without the flag the script exits immediately, which is how preview environments stay quiet. Runs nightly in production as the `title-sync` Railway cron service (04:00 UTC), where the Railway config sets the flag. Titles are also written through when they are added to a list, so a run mostly refreshes stale rows: availability daily, details weekly. A title TMDB has deleted is recorded with an empty availability set so filtered pages stop retrying it. The run exits non-zero if any title failed to sync; failed titles stay stale and are retried the next night.

Watch-provider data comes from JustWatch through TMDB and must be attributed as such wherever it is shown.

## List Watch Providers

Script to list all available watch providers from TMDB API.

### Usage

```bash
# List all providers for all regions
pnpm run list-providers

# List providers for a specific region (e.g. Sweden)
pnpm run list-providers SE

# List providers for USA
pnpm run list-providers US
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
