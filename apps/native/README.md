# Movies native

The first step toward native feature parity: the homepage, built with the reference project's Expo SDK 57, Expo Router, HeroUI Native/Uniwind and TanStack Query setup.

## Run

From the repository root:

1. `pnpm install`
2. Copy `apps/server/.env.example` to `apps/server/.env` and set `MOVIE_DB_ACCESS_TOKEN` (the same server token used by the web app).
3. Copy `apps/native/.env.example` to `apps/native/.env`.
4. Run `nub run dev` to start Docker, the web app, the API server, and Expo together. To run just the native services, use `nub run dev:api` and `nub run dev:native` in separate terminals.
5. Open the Expo development server in Expo Go, an iOS simulator, an Android emulator, or press `w` for the browser.

Leave the public URL overrides empty for local development. The app derives port 3001 (API) and port 3000 (web details) from the current browser hostname or Expo's advertised host. A changing Wi-Fi address no longer requires editing `.env`. Explicit URLs still override detection; set these for deployment, an Expo tunnel, or separately hosted services. Restart Expo after changing env values. Public variables contain URLs only; the TMDB token stays in `apps/server/.env`.

For Expo Go, keep your phone and computer on the same network and scan the current terminal QR code. The phone must be able to reach Expo on port 8081 and the API on port 3001. A saved link with an old IP will not load. A tunnel for Expo does not tunnel the API: supply an explicit reachable API URL when using one.

The API defaults to port 3001. Local development permits localhost and private LAN browser origins. Set `CORS_ORIGIN` to the exact browser origin in production; an explicit value overrides the development allowlist. Native requests do not require browser CORS. The API is read-only and public for this slice.

## Current behavior

- Daily trending movie and TV cards, and all six homepage media rows in the web app's order.
- Region selection using the same supported regions and Sweden default as web. Each region gets its own query cache; selection lasts for the app session.
- Upcoming movies exclude titles already playing in the selected region.
- Virtualized horizontal poster rows with optimized Expo images, missing-image/date fallbacks, ratings, safe areas, and system light/dark appearance.
- Independent loading, empty, error/retry states; pull-to-refresh; refetch when returning to the app.
- Title taps open existing web detail pages until native details are implemented.

## API boundary

`packages/api/home` exports the schemas, card DTO and shared section definitions. `packages/api/router` exports the oRPC router and its client type. Hosts inject a `HomeService`; clients import the router type only. No React Native, Next.js, env, session, or database dependencies live in the router. `apps/server` supplies the TMDB implementation and Hono transport. The existing web app retains its cached fetchers, uses the shared section definitions and retrying TMDB transport, and can migrate procedure by procedure later. Consumers import shared definitions and the transport directly from `@movies/api`; app-local compatibility re-exports are not used.

Only `home.list` and `home.trending` are exposed. Auth, lists, watchlist, discovery and search have not been migrated.

## Verify

Run the root lint, typecheck, test and Fallow commands; `nub run check-types` also checks the native and server workspaces. API transport/service tests run with the root Vitest suite.

`nub run --filter @movies/native test:e2e` exports the app and runs mobile-viewport browser tests against mocked oRPC responses, including region changes, detail links, errors, retry and empty results. Install Chromium first with `nub exec playwright install chromium`. This verifies the React Native web runtime; device/simulator smoke testing remains separate.

## Roadmap

1. Native movie/TV detail routes and their read procedures.
2. Native authentication and shared session context.
3. Watchlist, watched history, custom lists and mutations.
4. Search, discovery, filters, reviews and settings.
5. Migrate remaining web data access to shared procedures and verify full feature parity.
