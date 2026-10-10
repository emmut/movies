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

Native styling uses Tailwind/Uniwind, including content containers and third-party components adapted with `withUniwind`.

## Environment schemas

The native and API apps follow the reference project's Varlock pattern. Each app owns a `.env.schema`, with `@generateTsTypes(..., exposeEnv=local)` generating its own `src/env.ts`. Import `ENV` directly from that generated module; no hand-written env wrapper or re-export is needed. `pnpm install` generates both modules, and `pnpm env:generate` refreshes them after schema changes. Generated files contain schema types, never secret values; do not edit them.

Expo's Varlock Babel and Metro integrations validate the native schema and inline only public values. The API loads `varlock/auto-load` at its entrypoint before reading `ENV`, validating secrets and coercing the port at startup. The native schema contains only public settings; the API token remains server-only. Empty optional URL overrides retain automatic host detection. Explicit overrides must be HTTP(S) URLs; API browser origins must not include paths, queries or fragments. `PORT` defaults to 3001 and must be an integer from 1 to 65535.

The existing web app and cron scripts retain T3 Env validation during the incremental migration. Their validated optional TMDB URL is passed into the shared transport, which has no environment-loading side effects.

## API boundary

`packages/api/home` exports the schemas, card DTO and shared section definitions. `packages/api/router` exports the oRPC router and its client type. Hosts inject a `HomeService`; clients import the router type only. No React Native, Next.js, env, session, or database dependencies live in the router. `apps/server` supplies the TMDB implementation and Hono transport. The existing web app retains its cached fetchers, uses the shared section definitions and retrying TMDB transport, and can migrate procedure by procedure later. Consumers import shared definitions and the transport directly from `@movies/api`; app-local compatibility re-exports are not used.

Only `home.list` and `home.trending` are exposed. Auth, lists, watchlist, discovery and search have not been migrated.

## Verify

Run the root lint, typecheck, test and Fallow commands; `nub run check-types` also checks the native and server workspaces. API transport/service tests run with the root Vitest suite.

`nub run --filter @movies/native test:e2e` exports the app and runs mobile-viewport browser tests against mocked oRPC responses, including region changes, detail links, errors, retry and empty results. Install Chromium first with `nub exec playwright install chromium`. This verifies the React Native web runtime; device/simulator smoke testing remains separate.

## Decisions and roadmap

See [the committed session decisions and full feature parity plan](../../docs/native-app-roadmap.md). The goal is complete web feature parity with a recognizable shared product design, using native navigation and controls where appropriate. The current homepage is the functional starting point, not the final visual target. The setup reference is `/home/emmut/code/movies-app-example`; consult its integration/configuration files when diagnosing problems, then verify behavior locally.
