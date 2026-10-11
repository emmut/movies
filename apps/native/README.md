# Movies native

The homepage and core movie/TV details, built with the reference project's Expo SDK 57, Expo Router, HeroUI Native/Uniwind and TanStack Query setup.

## Run

From the repository root:

1. `pnpm install`
2. Copy `apps/server/.env.example` to `apps/server/.env` and set `MOVIE_DB_ACCESS_TOKEN` (the same server token used by the web app).
3. Copy `apps/native/.env.example` to `apps/native/.env`.
4. Run `nub run dev` to start Docker, the web app, the API server, and Expo together. To run just the native services, use `nub run dev:api` and `nub run dev:native` in separate terminals.
5. Open the Expo development server in Expo Go, an iOS simulator, an Android emulator, or press `w` for the browser.

Leave the public URL overrides empty for local development. The app derives port 3001 (API) and port 3000 (web discovery bridge) from the current browser hostname or Expo's advertised host. A changing Wi-Fi address no longer requires editing `.env`. Explicit URLs still override detection; set these for deployment, an Expo tunnel, or separately hosted services. Restart Expo after changing env values. Public variables contain URLs only; the TMDB token stays in `apps/server/.env`.

For Expo Go, keep your phone and computer on the same network and scan the current terminal QR code. The phone must be able to reach Expo on port 8081 and the API on port 3001. A saved link with an old IP will not load. A tunnel for Expo does not tunnel the API: supply an explicit reachable API URL when using one.

The API defaults to port 3001. Local development permits localhost and private LAN browser origins. Set `CORS_ORIGIN` to the exact browser origin in production; an explicit value overrides the development allowlist. Native requests do not require browser CORS. Catalog reads are public. Native sign-in uses the canonical web auth service through the API; configure AUTH_URL as described below.

## Current behavior

- Daily trending movie and TV cards, and all six homepage media rows in the web app's order.
- Region selection using the same supported regions and Sweden default as web. Each region gets its own query cache. Signed-in users read/save the shared account region; signed-out selection lasts for the app session. More → Settings provides an explicit-save account region form.
- Upcoming movies exclude titles already playing in the selected region.
- Web popcorn branding and stone palette, trending backdrop/title overlays, and bordered 2:3 posters with touch-visible title/year/rating and yellow Movie/red TV Show badges.
- Virtualized horizontal poster rows with optimized Expo images, missing-image/date fallbacks, shared upward rating rounding, safe areas, and system light/dark appearance.
- Independent loading, empty, error/retry states; pull-to-refresh; refetch when returning to the app.
- Movie and TV taps open native stack routes with back navigation. Homepage region and scroll context survive return navigation.
- Core detail artwork, title/tagline, badges and regional certification, TMDB ratings/votes, overview, movie financial/runtime facts and TV season/episode/network facts. Missing titles and upstream outages have distinct states.
- Trailers open an embedded player in a native sheet; closing unmounts playback. WebView uses the installed app ID for YouTube identification; actual device playback remains unverified.
- Regional free/streaming/rent/buy providers, watch links and attribution, plus native similar/recommendation rows. Supporting sections retry independently; provider-region and scroll context survive related-title back navigation.
- Genre taps open native discovery, with shared filters, sort options, selected watch region and pagination.
- Native Search handles all/movie/TV/person results, shared ranking/fuzzy fallback, pagination and contextual detail/back navigation.
- Native person pages include artwork, biography, facts, aliases, source links and canonical movie/TV filmography.
- Settings saves the shared account region and streaming-service preferences, with explicit save/clear, regional choices, missing/broken-logo fallbacks and retryable loading/save errors. Discover applies URL provider selections before saved account defaults, matching web.
- Private preference query keys include the account identity, so late saves from a previous session cannot seed another account’s cache.
- IMDb ratings, origin-country links, cast/crew, reviews and authenticated quick actions remain pending.

Native styling uses Tailwind/Uniwind, including content containers and third-party components adapted with `withUniwind`.

## Environment schemas

The native and API apps follow the reference project's Varlock pattern. Each app owns a `.env.schema`, with `@generateTsTypes(..., exposeEnv=local)` generating its own `src/env.ts`. Import `ENV` directly from that generated module; no hand-written env wrapper or re-export is needed. `pnpm install` generates both modules, and `pnpm env:generate` refreshes them after schema changes. Generated files contain schema types, never secret values; do not edit them.

Expo's Varlock Babel and Metro integrations validate the native schema and inline only public values. The API loads `varlock/auto-load` at its entrypoint before reading `ENV`, validating secrets and coercing the port at startup. The native schema contains only public settings; the API token remains server-only. Empty optional URL overrides retain automatic host detection. Explicit overrides must be HTTP(S) URLs; API browser origins must not include paths, queries or fragments. `PORT` defaults to 3001 and must be an integer from 1 to 65535.

The existing web app and cron scripts retain T3 Env validation during the incremental migration. Their validated optional TMDB URL is passed into the shared transport, which has no environment-loading side effects.

## API boundary

`packages/api/home` exports the schemas, card DTO and shared section definitions. `packages/api/router` exports the oRPC router and its client type. Hosts inject `HomeService` and `CatalogService`; clients import the router type only. No React Native, Next.js, env, session, or database dependencies live in the router. `apps/server` supplies the TMDB implementation and Hono transport. The existing web app retains its cached fetchers, uses the shared section definitions and retrying TMDB transport, and can migrate procedure by procedure later. Consumers import shared definitions and the transport directly from `@movies/api`; app-local compatibility re-exports are not used.

`home.list`, `home.trending`, `catalog.details`, `catalog.trailer`, `catalog.providers` and `catalog.related` are exposed. Catalog contracts validate positive safe-integer IDs, supported media/regions and normalized outputs; core upstream records are validated before mapping. Certification, trailer selection and currency/runtime formatting have canonical shared implementations consumed directly by web and native/Hono. Native discovery reads and filter options are exposed through `discovery.list` and `discovery.options`. Search and person reads use the shared canonical engine and filmography rules. Native sign-in, anonymous sessions, OAuth returns and sign-out are implemented; device passkeys, lists and watchlist remain pending. Private region/provider procedures use the shared account store; saved providers are Discover defaults. Set the API's optional DATABASE_URL to the same migrated database as web to enable fuzzy index matching; otherwise search uses TMDB.

## Hosting

Railway runs the API as the `api` service in production and every PR environment. It installs the workspace, starts `@movies/server` with tsx and checks `/health`. It shares the environment's database and TMDB token with web, and forwards auth to the same environment's web domain (`AUTH_URL`). `CORS_ORIGIN` stays unset because native requests send no browser origin. After each config apply, the infra workflow generates a `*.up.railway.app` domain for the API if it has none (`railway domain list --service api` shows it). Build native against a hosted API by setting `EXPO_PUBLIC_SERVER_URL` to that domain, and `EXPO_PUBLIC_WEB_URL` to the matching web domain. When changing these build-time URLs, clear Metro’s transform cache (`expo export --clear` or `expo start --clear`) so a previous local bundle cannot reuse old inlined settings.

## Verify

Run the root lint, typecheck, test and Fallow commands; `nub run check-types` also checks the native and server workspaces. API transport/service tests run with the root Vitest suite.

`nub run --filter @movies/native test:e2e` exports the app and runs mobile-viewport browser tests against mocked oRPC responses, including region changes, native movie/TV deep links, back navigation/scroll restoration, missing optional data, loading, errors/retry/not-found and empty homepage results. The preview uses a single-page export and a local server at port 8083 that serves its index for HTML deep links. Browser hosting must supply the same SPA fallback. Install Chromium first with `nub exec playwright install chromium`. This verifies the React Native web runtime; device/simulator smoke testing remains separate.

## Decisions and roadmap

See [the committed session decisions and full feature parity plan](../../docs/native-app-roadmap.md). The goal is complete web feature parity with a recognizable shared product design, using native navigation and controls where appropriate. The homepage recognition slice has been compared with live web data in both themes; core catalog navigation is implemented; quick actions, the remaining catalog sections, full app navigation and device verification remain unfinished. See [the workflow parity checklist and verification evidence](../../docs/native-app-parity.md). The setup reference is `/home/emmut/code/movies-app-example`; consult its integration/configuration files when diagnosing problems, then verify behavior locally.

### Bottom navigation

Native uses Expo Router's system tabs: Home, Discover, Search and More (ellipsis), with SF Symbols on iOS and Material symbols on Android. iOS 26 supplies the standard Liquid Glass appearance; earlier iOS and Android use their own system tab bars. Movie/TV details stay in Home's nested native stack. The browser export uses a preview dock and does not demonstrate native glass rendering.

Discover is a native grid and filter workflow with its own detail stack. Search has native result and detail/person stacks. More opens Sign in and Settings natively. Settings ports account region and streaming-service preferences. Account linking/passkey sections remain pending. Watchlist, Watched and Lists still use browser bridges. The owner has resumed full native page implementation; these browser handoffs must be replaced as each workflow is ported and verified. Bundle and browser checks do not replace real device verification.

Movie/TV detail headers use native Liquid Glass when available, with a native material fallback on older iOS. Screens avoid an extra bottom safe-area backing and let scrollable content extend behind the native bar. App path aliases (`@native/`, `@server/`) resolve consistently through TypeScript, Metro and the root test runner.

## Native identity

Set `AUTH_URL=http://localhost:3000` in `apps/server/.env` for local development, pointing at the same web instance/database used by browser clients. Restart the API after changes. Production must use the canonical deployed web auth origin and configure CORS_ORIGIN for its browser client; auth remains unavailable with a clear error if AUTH_URL is absent. The public catalog API still works without auth configuration.

The API forwards only auth requests to that configured host. Better Auth on web remains responsible for social credentials/callbacks, session revocation, rate limits, passkeys and anonymous watchlist migration. Its Expo plugin allows the Movies app scheme; local browser/Expo Go origins are admitted only during development. Hono's identity RPC verifies each request's cookie with cookie-cache bypass and exposes public identity fields, never session tokens. Private procedures must use this verified identity instead of caller-provided user IDs.

Native uses the official Better Auth Expo client and Expo SecureStore, with manually forwarded secure cookies on RPC requests and the platform cookie jar disabled. The browser preview uses credentialed fetches. Account changes clear query caches; sign-out restores the default session region. Passkey sign-in currently works through the browser client only; native device credential support remains pending and is not counted as completed parity.

Anonymous sign-in/revocation is checked against the real local web service with a disposable test account. Run `AUTH_TEST_WEB_URL=http://localhost:3000 AUTH_TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/movies pnpm test apps/server/src/auth-gateway.integration.test.ts`; it rejects remote hosts and deletes only its own newly created anonymous fixture. Device restart, secure storage and real OAuth/provider flows still require device verification.

### Shared preference verification

With local web and API hosts running against the same migrated database, and a native browser export served on port 8083:

```sh
E2E_BASE_URL=http://localhost:3000 PREFERENCE_TEST_API_URL=http://localhost:3001 PREFERENCE_TEST_NATIVE_URL=http://localhost:8083 pnpm exec playwright test e2e/preference-freshness.spec.ts --project chromium
PREFERENCES_TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/movies pnpm test packages/db/src/user-preferences.integration.test.ts packages/db/src/user-provider-preferences.integration.test.ts
```

The browser tests create/delete their own anonymous fixtures and verify actual Hono saves, web focus refresh, native session sharing and reload persistence. The database tests use isolated temporary tables/a private schema and test ownership, clear-all, rollback and concurrent replacements. These tests require explicit local hosts; default CI runs skip the browser integration when the API URL is absent.

Web’s existing private preference caches are browser render caches, not persistent server caches. Returning to the web browser refreshes rendered preferences and its user/home query caches. A continuously visible web page picks up external changes on its next focus/visibility return or explicit refresh; no new invalidation service or secret was introduced. Saved providers outside the current region remain saved until explicitly cleared, as on web. iOS/Android storage/restart and platform controls still need device checks.
