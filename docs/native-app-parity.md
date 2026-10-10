# Native feature parity checklist

This checklist implements the baseline inventory required by [the roadmap](native-app-roadmap.md) and [short plan](native-app-plan.md). Web code and running web screens remain the product source of truth. Rows describe workflows, not merely screen existence. Update status only with the evidence in the last column; browser exports do not prove device behavior.

Status: **Foundation** means a working subset exists; **Pending** means no native workflow exists; **Unverified** means implementation needs stronger runtime evidence. No phase is complete yet.

## Navigation and homepage

| Workflow | Web source | Native status | Required evidence |
| --- | --- | --- | --- |
| Movies popcorn wordmark, shared palette, light/dark theme | `components/brand.tsx`, `app/globals.css` | Foundation | Both themes, phone/tablet, accessible brand |
| Home, Discover, session-dependent Watchlist/Watched/Lists, Settings/login navigation | `components/app-sidebar*.tsx`, `components/nav-user.tsx` | Pending except Home | Real destinations; native stack/tabs, back gestures and deep links |
| Search entry point | `components/search-box.tsx`, `components/search-command.tsx` | Pending | Touch search equivalent, see all results, correct destination while results are stale |
| Daily movie and TV trending with backdrop/title/year overlays | `app/trending.tsx` | Foundation | Same records as web, two types, missing backdrop/date, both themes |
| Six ordered sections and region-specific upcoming exclusion | `app/(home)/page.tsx`, `@movies/api/home` | Foundation | Same order and regional results, independent loading/error/retry/empty states |
| Bordered 2:3 poster cards, title/year/rating, yellow Movie/red TV Show badges | `components/item-card.tsx`, `components/badge.tsx` | Foundation | Touch-visible metadata, long titles, missing artwork, large text and contrast |
| Quick add: watchlist, watched, custom lists, create-and-add | `components/quick-add-button-inner.tsx` | Pending (phases 3–4) | Persistent mutations, pending/error/rollback, cross-client freshness |
| TMDB attribution and external source links | `components/footer.tsx` | Foundation: abbreviated text | Appropriate attribution and working external links |
| Refresh and foreground recovery | Native addition | Foundation | Offline/reconnect and real device foreground/pull-to-refresh |

## Catalog

| Workflow | Web source | Native status | Required evidence |
| --- | --- | --- | --- |
| Movie route, poster/backdrop/title/tagline/certification | `app/movie/[movieId]/page.tsx`, `components/item-header.tsx` | Foundation: native route and browser checks; device pending | Valid/invalid IDs, not-found vs upstream error, native back restores source scroll |
| Movie TMDB score/votes, optional IMDb, runtime/year/popularity | Movie page, `components/ratings-card.tsx` | Foundation: TMDB/runtime/year/popularity; IMDb pending | Shared IMDb data, absent optional values |
| Movie genres and discovery links, origin countries, overview | Movie page, `components/origin-countries.tsx` | Foundation: overview/genres with web discovery bridge; countries pending | Correct discovery context and overview fallback |
| Movie status/original title/release/languages/budget/revenue/profit | `components/movie-facts.tsx` | Foundation: core facts and financial rules | Hide absent money; profit requires budget and revenue |
| Movie cast and crew links to people | `components/movie-credits.tsx`, `components/cast-slider.tsx` | Pending | Correct person IDs; supporting failures preserve main details |
| TV route, artwork/title/tagline/certification/ratings | `app/tv/[tvId]/page.tsx` | Foundation: native route and TMDB; IMDb/device pending | Correct TV IDs and native back context |
| TV seasons/episodes/runtime/status/air dates/languages/original name/networks | TV page | Foundation: core TV facts | Optional facts and missing dates |
| TV creators and cast link to people | TV page, `components/tv-cast.tsx` | Pending | Creator/cast routes work natively |
| Movie/TV trailers | `components/trailer-content.tsx`, `components/trailer-button.tsx` | Foundation: native sheet/player; device playback pending | Play/close, no trailer, upstream failure |
| Regional free/stream/rent/buy providers and watch links | `components/streaming-providers.tsx` | Foundation: regional groups, links, attribution and retries | Shared supported regions, no services, logos and external links |
| Movie/TV similar and recommended title sliders | `components/other-content.tsx` | Foundation: native rows/routes and context restoration | Native title routes; optional failures do not fail page |
| Person photo/name/biography/facts/aliases/popularity/credits | `app/person/[id]/page.tsx` | Pending | Missing photo/biography/dates and deceased people |
| Person movie/TV filmography, deduplication and ordering | Person page, `lib/utils.ts` | Pending | Same cast deduplication/popularity/date ordering; correct native routes |
| Person add to custom list (no system-list action) | Person page, quick add | Pending | Person items persist in custom lists |
| TMDB/IMDb/homepage external links | `components/external-links.tsx` | Foundation: TMDB/homepage; IMDb pending | Valid links only, usable native browser return |

## Identity, preferences and account

| Workflow | Web source | Native status | Required evidence |
| --- | --- | --- | --- |
| Anonymous sign-in and persistent session | `components/login-form.tsx`, `lib/auth-client.ts`, `@movies/auth` | Pending | Secure storage; restart, expiration and authenticated request context |
| Discord/GitHub sign-in, safe return destinations | Login form, `app/login/page.tsx` | Pending | OAuth redirects/deep links and failure/retry on both platforms |
| Link anonymous account, preserve its watchlist | `app/settings/link-account.tsx`, shared auth | Pending | Same records survive linking; native and web session behavior |
| Passkey sign-in | `components/passkey-login-form.tsx` | Pending | Supported platform flow or explicit documented alternative |
| Add/list/delete passkeys | `app/settings/add-passkey.tsx`, `passkey-list.tsx`, `passkey-actions.ts` | Pending | Supported platform flow or explicit documented alternative |
| Sign-out, user identity and session-dependent navigation | `components/nav-user.tsx` | Pending | Session revoked/cleared, caches cannot expose previous user's data |
| Save account region | `app/settings/region-form.tsx`, `lib/user-actions.ts` | Pending; homepage is session-only | Same supported region and Sweden default, survives restart and visible on web |
| Save provider preferences and regional provider options | `app/settings/watch-provider-form.tsx` | Pending | Shared account values, regional choices and refreshed discovery |
| Session-derived authorization | `lib/auth-server.ts`, list actions | Pending | Never trust caller user IDs; expired/anonymous/cross-user tests |

## Lists

| Workflow | Web source | Native status | Required evidence |
| --- | --- | --- | --- |
| Watchlist and Watched counts, movie/TV switch, paginated cards | `components/system-list-content.tsx` | Pending | Same persistent rows/counts, account ownership, correct page bounds |
| System-list provider filtering by region | System-list content, `lib/system-list-queries.ts` | Pending | Shared title availability/cache; empty versus filtered-empty |
| Manual system-list item order across pages | System-list content, `lib/lists.ts` | Pending | Scoped media order/global offsets, reorder disabled under provider filters |
| Add/remove watchlist and watched from details/quick add | `lib/system-list-actions.ts` | Pending | Repeat/racing actions, title-cache write-through, rollback and query refresh |
| Custom-list index/counts/pagination/order | `app/lists/page.tsx`, `components/lists-grid.tsx` | Pending | Same ownership and ordering; concurrent edits and paged moves |
| Create/edit list: name, description, allowed emoji | `components/list-form-fields.tsx`, `@movies/api/validations` | Pending | Shared trimming/limits/validation; native sheet and useful errors |
| Delete list with confirmation and return navigation | `components/delete-list-button.tsx` | Pending | Ownership and deletion failure; returns to updated index |
| List details/counts/items/page/provider filter | `app/lists/[id]/list-details-content.tsx` | Pending | Movies/TV/people, loading/error/empty/filtered-empty, ownership |
| Add/remove movie/TV/person and create-and-add | `lib/lists.ts`, quick add | Pending | Duplicate/repeat operations, pending state and cross-client freshness |
| Reorder custom lists and their items | `lib/lists.ts`, `hooks/use-reorderable-items.ts` | Pending | Transactions/locks, global indices, concurrent consumers; disable while filtered or stale |

Current web custom lists are owner-only (`getOwnedCustomList`); there is no public-sharing control to invent. The short plan's sorting requirement includes preserving existing manual ordering. System lists support movies/TV; custom lists also support people.

## Search, discovery and reviews

| Workflow | Web source | Native status | Required evidence |
| --- | --- | --- | --- |
| Full search: all/movie/TV/person, page, typed query | `app/search/search-content.tsx`, `search-results.tsx` | Pending | Same results/ranking and native destinations; empty/zero results |
| Query year/media suffix parsing | `lib/parse-search-query.ts` | Pending | Canonical rules, ambiguous words and titles containing years |
| Full search fuzzy index and merge ranking | `lib/search.ts`, `lib/search-index.ts` | Pending | Page-one fusion/title tiers/hydration cap; absent index falls back to TMDB |
| Command-search intent and see-all | `components/search-command*.tsx` | Pending | TMDB-first, zero-result fuzzy fallback, current-query destination |
| Discover movie/TV, genre selection, sort | `app/discover/[[...genreId]]/discover-content.tsx` | Pending | Same genres/sort/bounds, multiple genres and type switch |
| Discover runtime/origin/provider/region filters and clear | Discover content, `components/filters-panel.tsx` | Pending | Same filter semantics and saved-provider defaults; filter-aware query keys |
| Search/discovery pagination and return context | Search/discover pagination, back-target helpers | Pending | Restore query/filters/page/scroll after detail and back |
| Detail review preview, expand/collapse, see all | `components/reviews-section.tsx`, `review-card.tsx` | Pending | Author/date/optional rating/content, empty/upstream failure |
| Full movie/TV reviews, pagination and external TMDB links | `components/reviews-page-content.tsx` | Pending | Same title/page rules, back to native title and external return |

Reviews are read-only TMDB reviews. Web has no review creation/editing workflow.

## Shared backend and release gates

- Extract canonical framework-independent operations as needed; retain web caching/actions until caller migration is verified. No native imports of Next actions or secrets.
- Every Hono mutation needs tested web cache freshness as well as native invalidation. Same database, ownership, anonymous migration, locks, title/provider/IMDb/search data and existing cron jobs.
- Record per-slice procedure additions, contract/error tests, visual comparison, accessibility and platform limitations.
- Run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm check-types`, `pnpm test`, `pnpm fallow`, native browser tests and iOS/Android bundles for relevant changes.
- Real iOS/Android checks: back gestures, source scroll, sheets, large text/screen readers, OAuth/deep links, secure sessions/restarts, offline/reconnect/foreground and performance.
- Production hosting/configuration: validated app-scoped Varlock env, origins, auth/session settings, deep-link association and native release builds. Keep draft PR #350 aligned with reviewed slices; deployment is a separate explicit operation.

## Homepage recognition slice — 2026-10-10

Inspected the running web homepage at `http://localhost:3000` at 390 × 844 in dark and light themes, along with its homepage, card, badge, brand and theme sources. Temporary reference screenshots: `/tmp/movies-web-before.png`, `/tmp/movies-web-light.png`.

Native changes restore the popcorn/Movies wordmark, web stone background/foreground/border palette, 208px trending cards, title/year overlays, bordered 2:3 poster cards and yellow/red media badges. Metadata is always visible for touch. Narrow headings match web; the native region sheet remains available. Explicit white overlay text avoids the dark-text-over-dark-artwork problem observed in web light appearance.

No API procedures moved in this slice. Native navigation/detail routes, quick actions, saved account preferences, full attribution and real device checks remain pending. Live native browser comparisons at 390 × 844 used the same Sweden region and signed-out state as web: Matchbox the Movie, LINK CLICK, Resident Evil and Coyote vs. Acme appeared on both clients. Final native screenshots: `/tmp/movies-native-dark-live.png`, `/tmp/movies-native-light-live.png`. Native overlays remain white in light/dark appearance. The comparison also found a score-rounding mismatch; `displayRating` in `@movies/api/home` now owns the existing web upward-to-one-decimal rule for web cards, web movie/TV details and native cards. Resident Evil and Coyote vs. Acme display 7.4 and 7.6 on both clients.

Verification:

- `pnpm lint`: passed with two pre-existing hook warnings.
- `pnpm exec tsc --noEmit` and `pnpm check-types`: passed, including native/server/web.
- `pnpm test`: 579 passed, 4 skipped. A first run under simultaneous bundling timed out in the unchanged startup test; the full rerun passed.
- `pnpm fallow`: passed; no newly introduced gate findings (inherited web card complexity is excluded by the audit gate).
- `pnpm --filter @movies/native test:e2e`: four passed after a fresh web export. Covers homepage/order/region/web-detail bridge, failure/retry/empty, sizing/system theme, artwork metadata/badges/fallbacks/contrast and upward rating rounding.
- Next runtime: no compilation issues or runtime errors; homepage cards and Interstellar/Game of Thrones details render after sharing the rating rule.
- Expo iOS/Android JavaScript exports: verified separately from device execution. No simulator or physical-device success is claimed.

These checks do not complete phase 0: real-device accessibility/interaction checks, native navigation and auth-dependent actions remain pending. Larger screens, long titles and large text still need visual comparison. API procedures and release infrastructure remain unchanged.

## Core movie/TV detail slice — 2026-10-10

Implemented `catalog.details` in the host-injected oRPC contract and Hono service. Requests validate media type, positive safe-integer IDs and supported region with the shared Sweden default. Core upstream metadata is validated and normalized to explicit movie/TV DTOs. Mismatched/malformed records fail; 404 maps to a safe defined `NOT_FOUND` error, and outages remain retryable failures. Certification failure is logged and does not discard usable core details.

Moved certification types/pickers/formatting into `@movies/api/certifications` and currency/runtime formatting into `@movies/api/formatting`. Web imports these canonical modules directly; old web-local implementations were removed. Existing web caching/fetching and actions remain. Server-only code and tokens stay out of native bundles; the API has no new database or mutation dependency.

Homepage taps now use `/movie/:id` and `/tv/:id` inside Expo's native stack. Core screens preserve web backdrop/poster proportions, metadata order, movie/TV badges, colored statistic cards/icons, certification labels, overview and movie/TV facts. Native headers replace the web back row. Genre links remain an explicit browser bridge to web discovery; no inert native discovery control is claimed. Core pages have loading, retry, not-found and missing-art/optional-value states. Inline stack style objects are limited to navigator color options, which cannot receive classes.

Browser back exposed two lifecycle problems: region state reset during layout remount, and hidden screens emitted zero-offset scroll events. Region now belongs to an app-session store; homepage scroll remembers the focused screen and restores when its content exists. The navigation test confirms the same document, selected United States region and exact prior vertical offset after opening a poster and returning. Real platform gestures still need device verification.

The Expo browser preview now uses a single-page export for arbitrary IDs, with an HTML deep-link fallback in the browser-test server on port 8083. Production browser-preview hosting needs the equivalent fallback. Native release hosting configuration is still pending.

Inspected running web Interstellar (`/movie/157336`) and Game of Thrones (`/tv/1399`) before implementation, and native equivalents using the same Sweden region/signed-out state at 390 × 844. Web screenshots: `/tmp/movies-web-movie-detail.png`, `/tmp/movies-web-tv-detail.png`, `/tmp/movies-web-tv-metadata.png`. Native screenshots: `/tmp/movies-native-movie-detail.png`, `/tmp/movies-native-movie-light.png`, `/tmp/movies-native-tv-metadata.png`, `/tmp/movies-native-tv-light.png`. Native stats retain dark surfaces and white values in both themes. Wider-screen/large-text and real-device comparisons remain pending.

Verification:

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm check-types`, `pnpm fallow`: passed, with existing web hook warnings/inherited card complexity only.
- `pnpm test`: 631 passed, 4 skipped.
- Focused coverage: 100% statements/branches/functions/lines across catalog service, catalog contract/ID parsing, certification rules, formatting, native metadata model and region store. Native screen and scroll-hook behavior is exercised by browser tests; this coverage claim does not include every native component.
- Native browser suite: ten passed after a fresh export, including direct movie/TV deep links, selected-region requests, same-document navigation/scroll restoration, optional-data fallbacks, loading, retry, not-found and invalid routes without fetching.
- iOS/Android JavaScript exports passed to `/tmp/movies-native-catalog-bundles`. This does not establish simulator/device behavior or signed release builds.
- Live API returned Interstellar details and Swedish certification; Next reported no compilation/runtime errors after the shared-module extraction.

Phase 1 remains incomplete: IMDb, origin-country actions, trailers, credits/creators, watch providers, recommendations/similar, person filmography and reviews still need native workflows. Identity, quick actions and persistent preferences remain in their original roadmap phases. No phase or release is marked complete.

## Catalog supporting sections — 2026-10-10

Added independent `catalog.trailer`, `catalog.providers` and `catalog.related` queries with validated identifiers, regions, related kinds and normalized outputs. Upstream failures reach section retry controls without discarding core metadata or being misrepresented as empty availability. Web and Hono share the canonical YouTube Trailer/Teaser picker; existing web cache behavior remains. Homepage and related rows share one virtualized poster implementation; provider and homepage controls share a native region sheet.

Provider `watchRegion` is part of route context and query keys. Free, Streaming, Rent and Buy preserve web ordering, colored icons, dark logo/name cards, watch links and attribution. Free-only regions correctly show availability. Missing/unsafe watch URLs fall back to TMDB. The scroll hook now remembers home and individual catalog screens; browser tests prove exact source-offset and provider-region restoration after recommendation navigation.

Trailers embed inside native sheets through Expo-compatible WebView; the browser preview uses an iframe. Closing unmounts playback. Native requests identify the installed app using expo-application and a HTTPS Referer, following [YouTube requirements](https://developers.google.com/youtube/terms/required-minimum-functionality) and [Expo WebView setup](https://docs.expo.dev/versions/latest/sdk/webview/). Browser tests use a mocked frame; actual iOS/Android playback/fullscreen/media behavior remains unverified.

Live Interstellar provider and related rows were compared with web at 390 × 844 in Sweden. Provider names match, including Amazon Prime Video, Viaplay, Tele2 Play, HBO Max, Apple TV Store and Google Play Movies. Final provider captures: `/tmp/movies-native-providers-dark-final.png` and `/tmp/movies-native-providers-light-final.png`; reference: `/tmp/movies-web-providers.png`. Related references: `/tmp/movies-web-related.png`, `/tmp/movies-native-related.png`, `/tmp/movies-native-related-light.png`. Foreground labels with colored icons and theme-aware attribution correct light-theme contrast.

Verification:

- Lint, root/workspace typechecks and Fallow gates passed; existing web hook warnings/inherited card complexity remain.
- Unit tests: 656 passed, four skipped. Focused supporting contract/service/card-mapper coverage: 100% statements/branches/functions/lines.
- Native browser tests: 17 passed, covering trailer-sheet lifecycle, provider groups/links/regions, free-only availability, missing sections, independent loading/retries and related-navigation context.
- Final web/iOS/Android exports passed; platform bundles are in `/tmp/movies-native-support-bundles`. Bundles do not prove device playback or signed release behavior.
- Next reported no compilation or runtime errors after sharing trailer selection.

Catalog still needs person/filmography, cast/crew/creators, IMDb, origin-country actions and reviews. Identity, persistent preferences/lists, search/discovery and release/device criteria retain their full original scope. No phase is marked complete.

## PR audit follow-up — 2026-10-10

The first pushed catalog commit passed GitHub lint/typecheck/unit, web E2E and preview checks, but CI flagged the web poster card complexity that the local upstream-relative audit had treated as inherited. Composed its artwork, overlay and list actions into private components while preserving its public API and DOM treatments. Added rendering regression coverage for movie/TV metadata and scores, missing artwork/dates, quick-add versus custom-list removal, and eager/proxy image data. The audit against `origin/main` now reports no complexity findings. Root tests now pass 660 cases (four skipped). This follow-up does not complete any remaining native parity phase.
