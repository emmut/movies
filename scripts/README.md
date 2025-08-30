# Scripts

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
