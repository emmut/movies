# Next.js → TanStack Start Migration — Status 2

## Completed since Status 1

### `packages/ui`
- **`globals.css`** — replaced `@plugin 'tailwindcss-animate'` with `@import 'tw-animate-css'` (tw-animate-css is a plain CSS file, not a Tailwind plugin).
- **`oauth-login-button.tsx`** — removed hard dependency on `apps/web/src/lib/auth-client`; now accepts a `signIn: SignInFn` prop and an `onSuccess` callback so it works in any context.
- **`brand.tsx`** / **`nav-link.tsx`** / **`pagination.tsx`** — changed `import Link from '@tanstack/react-router'` to named `import { Link }`.
- **`brand.tsx`** / **`nav-link.tsx`** — fixed sidebar import path (`./ui/sidebar` → `./sidebar`).
- **`package.json`** — added `@tanstack/react-router` as a peer + dev dependency.

### `packages/api`
- **`src/lib/media-actions.ts`** — removed dead Next.js `revalidateTag`/`CACHE_TAGS` usage from `revalidateGenresCache`; function deleted (no longer needed).
- **`src/types/movie.ts`** / **`src/types/tv-show.ts`** — fixed `@/lib/regions` → `@movies/media`.

### `apps/web` — component migrations

| Component | Changes |
|---|---|
| `add-passkey.tsx` | Removed `next/navigation`; use `useQueryClient.invalidateQueries` instead of `router.refresh()`. Fixed `@/components/ui/` imports. |
| `passkey-list.tsx` | Same as above. Invalidates `orpc.passkey.list.key()`. |
| `passkey-login-form.tsx` | Removed `next/navigation` + `@primer/octicons-react`; use `useNavigate` + `queryClient.invalidateQueries`. |
| `region-form.tsx` | Removed `@/components/ui/` paths and `updateRegionAction` server-action prop; now uses `useMutation(orpc.user.updateRegion.mutationOptions(...))`. |
| `nav-user.tsx` | Fixed `Link` default import → named; replaced `router.refresh()` with `useNavigate` + `queryClient.invalidateQueries`. |
| `delete-list-button.tsx` | Replaced `router.refresh()` / `router.push()` with `useNavigate`. |
| `create-list-dialog.tsx` | Replaced direct `createList()` call + `router.refresh()` with `useMutation(orpc.lists.create.mutationOptions(...))`. |
| `edit-list-dialog.tsx` | Same pattern as above with `orpc.lists.update`. |
| `list-button.tsx` | Full rewrite: all direct lib calls (`getUserListsWithStatus`, `isResourceInWatchlist`, `addToList`, `removeFromList`, `createList`, `toggleWatchlist`) replaced with `useQuery`/`useMutation` via oRPC. Removed `glass` variant (doesn't exist in Base UI button). |
| `remove-from-list-button.tsx` | Replaced direct `removeFromList()` + `router.refresh()` with `useMutation(orpc.lists.removeItem.mutationOptions(...))`. |
| `watchlist-button.tsx` | Replaced direct `toggleWatchlist()` + `clsx` with `useMutation(orpc.watchlist.toggle.mutationOptions(...))` + `cn`. |
| `media-type-selector-dropdown.tsx` | Replaced `usePathname`/`useSearchParams`/`router.push()` (non-existent in TanStack Router) with `useLocation` + `useNavigate`; `validateGenreForMediaType` called via `client.discover.validateGenre`. |
| `media-type-selector.tsx` | Replaced nuqs + `router.refresh()` + `revalidateGenresCache` (Next.js server action) with `useNavigate`; genre validation via `client.discover.validateGenre`. |
| `genre-navigation-client.tsx` | Replaced nuqs with `useNavigate` + search function callback. |
| `pagination-controls.tsx` | Replaced nuqs + `useSearchParams` + `router.push()` with `useLocation` + `useNavigate`. Now accepts `currentPage` as a prop. |
| `app-sidebar.tsx` | Replaced `usePathname` with `useLocation().pathname`; fixed `Link href` → `to`. |
| `app-sidebar-user-login.tsx` | Same. |
| `app-sidebar-user-footer.tsx` | Converted async server component to client component using `authClient.useSession()`. |
| `app-sidebar-user-nav.tsx` | Same. |
| `media-list.tsx` | Converted async server component to client component; accepts `items` as props; uses `authClient.useSession()` for `userId`. |
| `sort-by-filter.tsx` | Removed nuqs; now accepts `value` + `onChange` callback props. |
| `runtime-filter.tsx` | Same. Removed `use-runtime-filter` hook (deleted). |
| `watch-provider-filter.tsx` | Removed nuqs + `Image` from `next/image`; accepts `selectedProviders` + `onChange`. Uses `<img>` directly. |
| `filters-panel.tsx` | Updated to thread lifted filter state (sortBy, runtimeLte, selectedWatchProviders) + change handlers from parent. |
| `discover-content.tsx` | Full rewrite: removed nuqs; uses `Route.useSearch()` from `routes/discover/$.tsx` + `useNavigate`. |
| `region-select.tsx` | Removed nuqs; now controlled (`value` + `onChange` props). |
| `streaming-providers.tsx` | Removed nuqs + `Image` from `next/image`; uses local `useState` for region; uses `<img>`. |
| `search-bar.tsx` | Replaced `useSearchParams` (doesn't exist in TanStack Router) with `useLocation().searchStr`. |
| `poster.tsx` | Replaced `Imgproxy`/`next/image` with plain `<img>`. |
| `trending.tsx` | Converted async server component to client component (`TrendingCard`) accepting `resource` + `type` props; removed `next/link`, `@/lib/movies`, `@/lib/tv-shows`. |
| `item-card.tsx` / `person-card.tsx` | Fixed `ClientImage` default import → `{ ImageProxy }` from `@movies/media`; fixed `Link href` → `to`. |
| `lists-grid.tsx` | Fixed `Link` default import → named. |

### `apps/web` — route changes
- **`routes/discover/$.tsx`** — extended `validateSearch` schema with `with_watch_providers`, `watch_region`, `runtime`, `genreId`; exported `DiscoverSearch` type.

---

## Outstanding work (remaining type errors)

### `apps/web/src/components/`

1. **`available-genre-navigation.tsx`** — passes `mediaType` prop to `GenreNavigationClient` which no longer accepts it. Remove that prop from the call site.
2. **`delete-list-button.tsx`** — `navigate` call still passing 1 argument where 2 expected (minor, likely `Expected 2 arguments` for a lib shim).
3. **`discover-pagination.tsx`** / **`search-pagination.tsx`** / **`list-details-content.tsx`** / **`watchlist-content.tsx`** — passing deprecated `pageType` prop to `PaginationControls` (removed) + still missing `currentPage` prop.
4. **`header.tsx`** / **`sign-in-form.tsx`** / **`sign-up-form.tsx`** — referencing `/dashboard` route which doesn't exist; replace with `/`.
5. **`item-card.tsx`** / **`person-card.tsx`** — still has `ClientImage` reference or `Link href` somewhere.
6. **`link-account.tsx`** — `OAuthLoginButton` now requires `signIn` prop; call sites need updating.
7. **`list-button.tsx`** — `watchlist.status` oRPC query key call; check oRPC proc name.
8. **`list-details-content.tsx`** — still imports from `nuqs`; needs full nuqs→`Route.useSearch()` rewrite.
9. **`lists-grid.tsx`** — imports `LocalList` from `@movies/api/lib/lists` (removed); use inferred return type.
10. **`login-form.tsx`** — `OAuthLoginButton` needs `signIn` prop.
11. **`posthog-provider.tsx`** — uses `NEXT_PUBLIC_POSTHOG_*` env vars (→ `VITE_POSTHOG_*`) and imports `@/app/posthog-page-view` (Next.js).
12. **`search-content.tsx`** — still imports from `nuqs`; needs full nuqs→`Route.useSearch()` rewrite.
13. **`watch-provider-form.tsx`** — `next/image` comment still triggers `Image` JSX error; imports `@/lib/user-actions`.
14. **`watchlist-button.tsx`** — `orpc.watchlist.status` may not exist as a query proc.
15. **`watchlist-content.tsx`** — still imports from `nuqs`; needs full nuqs→`Route.useSearch()` rewrite.
16. **`pagination.tsx`** (`@movies/ui`) — `PaginationLink` passes `data-active` to `Link` which doesn't accept it.

### `apps/web/src/routes/`
17. **`discover/$.tsx`** — `watchProviderIds` unused variable.
18. **`index.tsx`** — `movieId` param passed as `string` instead of `number`.

---

## Recommended order to clear remaining errors

1. Fix call sites for `OAuthLoginButton` (pass `signIn` prop) — `login-form.tsx`, `link-account.tsx`.
2. Fix `/dashboard` → `/` in `header.tsx`, `sign-in-form.tsx`, `sign-up-form.tsx`.
3. Remove `mediaType` prop from `GenreNavigationClient` call in `available-genre-navigation.tsx`.
4. Fix `PaginationControls` call sites — remove `pageType`, add `currentPage`.
5. Rewrite `list-details-content.tsx`, `search-content.tsx`, `watchlist-content.tsx` (nuqs → `Route.useSearch()`).
6. Fix `lists-grid.tsx` `LocalList` type.
7. Fix `watch-provider-form.tsx` (remove `@/lib/user-actions`, replace `Image`).
8. Fix `posthog-provider.tsx` (env vars + remove `@/app/posthog-page-view`).
9. Fix `pagination.tsx` in `@movies/ui` (`PaginationLink` + `Link` `data-active` prop).
10. Fix `routes/index.tsx` `movieId` string→number.
11. Remove unused `watchProviderIds` in `routes/discover/$.tsx`.
