# Next.js → TanStack Start Migration — Status

## Completed (foundations + scaffolding)

### Packages
- **`@movies/env`** — extended `server.ts` with TMDB, OAuth, imgproxy, posthog, Vercel URL vars; `web.ts` with `VITE_*` equivalents.
- **`@movies/db`** — added schemas (`lists`, `watchlist`, `user-watch-providers`), extended `auth.ts` with `region`, `isAnonymous`, and `passkey` table; copied tmp drizzle migrations into `packages/db/drizzle/`; re-pointed `drizzle.config.ts` at root `.env`.
- **`@movies/auth`** — added `passkey` plugin, Discord/GitHub social providers (gated on env), `anonymous` plugin with watchlist transfer onLinkAccount, `tanstackStartCookies()`.
- **`@movies/api`** — full oRPC routers:
  - `movies`, `tv`, `persons`, `search`, `discover`, `watchlist`, `lists`, `user`, `passkey`.
  - Shared TMDB helper (`lib/tmdb.ts`).
  - All lib functions ported to take `userId`/`region` as explicit parameters (Next-specific `getSession`/`headers()`/`cache`/`revalidate*` removed).
- **`@movies/media`** (new) — `imgproxy-url.ts` (server signing, exports under `@movies/media/imgproxy-url`), client-safe `index.ts` exports (`ImageProxy` component, regions, constants, types).
- **`@movies/ui`** — added 20+ shadcn primitives (alert-dialog, avatar, dialog, popover, select, separator, sidebar, sheet, tooltip, item-slider, pagination, oauth-login-button, etc.), generic composites (brand, footer, go-back, nav-link, pill, spinner, section-title, skip-to-element, badge), icons folder, generic hooks (`use-is-client`, `use-is-mounted`, `use-mobile`, `use-scroll-on-page-change`), extended `lib/utils.ts` with `formatImageUrl`, `getSafeRedirectUrl`, `createLoginUrl`, etc. Tailwind v4 `globals.css` ported.

### apps/web
- **`__root.tsx`** — providers (ThemeProvider, sonner Toaster), TanStack devtools, `HeadContent`/`Scripts`.
- **Routes (TanStack Start)** — `index`, `movie/$movieId`, `tv/$tvId`, `person/$id`, `discover/$`, `search`, `lists`, `lists/$id`, `watchlist`, `settings`, `login`, plus server-route handlers `api/auth/$` and `api/rpc/$`. All routes call into the oRPC router via `useQuery(orpc.<ns>.<proc>.queryOptions(...))` with SSR loaders for hot paths.
- **`lib/auth-client.ts`** — extended with `passkeyClient`/`anonymousClient`; helper functions `signOut`, `signInDiscord`, `signInGitHub`, `signInSettings`, `signInGitHubSettings`, `addPasskey`, `signInPasskey`, `signInAnonymous`.

### Infra
- Workspace `catalog` extended with `@better-auth/passkey`, `drizzle-orm`, imgproxy libs, posthog, radix primitives, `@types/react`, `react`.
- Root scripts: `dev:imgproxy:up` / `dev:imgproxy:down`.
- `docker-compose.dev.yml` moved to repo root.
- `.env.example` rewritten with the union of env vars (TMDB, OAuth, imgproxy, posthog, BETTER_AUTH_*, VITE_*).
- `pnpm install` succeeds (1 deprecated subdep warning, no peer-dep errors).

## Bulk-copied (need per-file refinement)

`apps/web/src/components/` contains ~50 ported components from `tmp/src/components/` plus extracted route-internal components (`discover-content`, `search-content`, `watchlist-content`, `list-details-content`, etc.). Imports were rewritten via a sed pass:
- `@/components/ui/X` → `@movies/ui/components/X`
- `@/icons/X` → `@movies/ui/icons/X`
- `@/lib/utils` → `@movies/ui/lib/utils`
- `@/lib/imgproxy-url` → `@movies/media/imgproxy-url`
- `next/link` → `@tanstack/react-router` `Link`
- `next/navigation` → `@tanstack/react-router`
- `@/lib/{movies,tv-shows,persons,…}` → `@movies/api/lib/<file>`
- `@/types/` → `@movies/api/types/`

## Outstanding work

A `pnpm exec tsc --noEmit` in `apps/web` surfaces ~120 errors clustered around the following remaining migration tasks. None block the foundation; each is a localized fix.

1. **`useRouter().refresh()` / `.push()` patterns** — TanStack's `useRouter()` doesn't expose `refresh`/`push`. Replace with `useNavigate()` + `queryClient.invalidateQueries(...)`. Affects: `create-list-dialog`, `delete-list-button`, `edit-list-dialog`, `media-type-selector(-dropdown)`, `nav-user`, etc.
2. **`usePathname` / `useSearchParams`** — TanStack uses `useLocation()` (returns `{ pathname }`) and `Route.useSearch()`. Affects: `app-sidebar`, `media-type-selector-dropdown`, `nav-link` (partially fixed), `header-search` (deleted; needs rewrite).
3. **`nuqs` removal** — `discover-content`, `genre-navigation-client`, `media-type-selector`, `list-details-content`, `watchlist-content`, `search-content`, `runtime-filter`, `watch-provider-filter`, `sort-by-filter`. Each needs `validateSearch` + `Route.useSearch()` + `useNavigate({ search })`.
4. **Server-only imports leaking into components**:
   - `getUser`/`getSession` from `@movies/auth` — components should call `useSession()` from `@/lib/auth-client` instead.
   - `import { getMovieDetails } from "@movies/api/lib/movies"` in components — should be `useQuery(orpc.movies.details.queryOptions(...))`.
   - Affects: `media-list`, `app-sidebar-user-*`, several `settings/*` files.
5. **Server actions → oRPC mutations** — `delete-list-button`, `list-button`, `watchlist-button`, `remove-from-list-button`, `create-list-dialog`, `edit-list-dialog`, `region-form`, `watch-provider-form`, `passkey-list`, `add-passkey`, `link-account` all call ported lib functions directly. Convert to `useMutation(orpc.<ns>.<proc>.mutationOptions(...))`. Argument counts in the new API (with `userId` injected by the procedure) differ from the old server actions — call sites need to drop the `userId` arg.
6. **`@/components/ui/X` import paths still in a few components** — sed missed `@/components/ui/skeleton`, `@/components/ui/button`, `@/components/ui/card`, `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/oauth-login-button`, `@/components/ui/dialog` in some files (`add-passkey`, `link-account`, `passkey-list`, `region-form`, etc.). Re-run the sed map.
7. **Renamed locals in `@/types`** — `Movie`, `TvShow`, `Person`, etc. now live at `@movies/api/types/*`. A few components import from `@/types/*` still (e.g., `list-details-content`, `watchlist-content`).
8. **Image proxy migration in components** — components that displayed posters/profiles need to switch from `Image` (`next/image`) to `<ImageProxy urls={item.posterImageUrls} />` from `@movies/media`. Most are still using the original `Image` element since the bulk sed didn't insert the new component.
9. **Button `variant="glass"`** — `list-button` uses a `glass` variant that doesn't exist in the ported `Button`. Either add the variant to `@movies/ui/components/button.tsx` or pick an existing one.
10. **`@movies/api/lib/lists` removed `LocalList` type export** — used by `lists-grid`. Add the type back or replace with the inferred return type of the procedure.

## Recommended order to clear the remaining errors

1. Re-run the sed import-rewrite pass to catch the missed `@/components/ui/`/`@/components/`/`@/lib/` paths.
2. Replace `useRouter` patterns with `useNavigate` + `queryClient.invalidateQueries`.
3. Replace nuqs with TanStack `validateSearch` + `Route.useSearch()`.
4. Replace direct lib calls in components with oRPC `useQuery`/`useMutation`.
5. Adjust mutation call sites to the new procedure signatures (no userId param).
6. Smoke-test:
   - `pnpm dev:imgproxy:up`
   - `pnpm dev:web` (port 3001)
   - Visit `/` (trending), `/movie/27205`, `/discover`, `/search?q=matrix`, `/login`, `/api/rpc/healthCheck`.
7. Once green, `rm -rf tmp/`.
