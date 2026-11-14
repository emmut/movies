# Web → native audit, 13 November 2026

Scope: PR #350 at `9f05a68`, plus this follow-up. This is a source-level inventory of every web page family and its native implementation. Browser regression checks exercise React Native Web; they cannot certify native gestures, safe-area measurements, OAuth or passkeys on a device. The older dated entries in `native-app-parity.md` are historical evidence, not the current feature list.

## Feature inventory

| Web experience | Native equivalent / outcome |
| --- | --- |
| Home: movie/TV trending, six ordered regional catalog rows, source attribution, quick add | Home tab; shared section definitions and cards; pull-to-refresh and remembered scroll. |
| Discover: movie/TV, genre, sort, runtime, country, provider, watch region, keyword/company/network search, multiple filters, chips, reset, pagination | Discover tab with native filter menu and searchable sheets; shared validation and selection rules. Named browsing retains explicit region and provider overrides. |
| Search: mixed/movie/TV/person results, year/type parsing, fuzzy matching, pagination | Search tab uses the shared search engine. This follow-up adds debounced mixed suggestions and “See all results,” including hiding stale destinations while the query changes. |
| Movie details: art, title/tagline, certification, TMDB/IMDb scores and votes, runtime/year/popularity, overview, genres, origins, facts/finances | Native catalog content, statistics and fact components; independent supporting queries and recovery. |
| Movie supporting content: cast, directors/writers/full crew, images/videos/trailer, keywords, production companies, collection, regional releases, recommendations/similar, reviews | Native person/title links, expandable crew, media viewer, keyword routes, organization discovery, collection rows and paginated reviews. |
| TV details: shared title features plus creators, networks, seasons, latest/next episode, episode guide and spoiler control | Native catalog/season screens retain the source tab and watch region. |
| Where to watch: region selector; free, ads, subscription, rent, buy; direct provider URLs or TMDB fallback | Adds the missing ad-supported group and independently fetched direct links. Web and API now import the same validated Wikidata identifier and region/offer rules from `@movies/api`. Availability stays usable if the optional lookup fails. |
| Person: photo, biography, dates/place, aliases, popularity, known-for, sorted movie/TV filmography, source links, custom-list add | Native person screen and canonical filmography helpers. No movie-only system-list actions on people. |
| IMDb title URL `/title/[imdbId]` | Adds native route and validated resolver; movie-first match, TV fallback, explicit missing-title and retry states. |
| Watchlist / Watched: counts, movie/TV selection, regional provider filtering, paging, ordering, add/remove | Native system lists use canonical account stores and query invalidation. |
| Custom lists: index, counts, create/edit name/description/emoji, delete confirmation, mixed items, create-and-add, ordering, filters and paging | Native list workflows; this follow-up consolidates pagination with catalog/search while preserving mutation locks. |
| Login: anonymous/social/passkey, account linking, return navigation and sign-out | Existing native identity gateway, SecureStore client, provider actions and capability-aware passkeys. Signed-device/provider acceptance remains required. |
| Settings: region, providers, link account, add/list/delete passkeys | Existing native settings and canonical stores; sheet inset fixes apply to settings dialogs too. |
| Credits: TMDB, JustWatch, Wikidata/CC0 and IMDb attribution | Adds a public Credits screen under More with source links. |
| Navigation, loading/error/empty states and source links | System tabs/stacks and native links replace sidebar/browser navigation; per-section recovery avoids blanking the entire title page. External sources deliberately open the browser. |

The web command palette's keyboard shortcut is adapted to typing in the Search tab. Desktop hover actions become visible touch controls. Drag ordering already has explicit accessible move controls on native. No new product features such as public list sharing, downloads or offline catalog storage are implied by parity.

## UI and UX inventory

| Web detail | Native treatment and changes |
| --- | --- |
| Popcorn wordmark, stone palette, yellow movie/red TV accents | Existing shared branding, media badges and system light/dark appearance retained. |
| Sidebar and back links | Four system tabs with nested title/person/review/season stacks; secondary destinations live under More. Credits follows account/settings destinations. |
| 2:3 poster cards, backdrop heroes, metadata overlays and horizontal rows | Existing native cards retain content hierarchy, portrait ratio and touch-visible metadata. |
| Detail typography and section hierarchy | Existing headings, statistics, facts and grouped sections use 12–16-point internal gaps and 24–32-point section gaps. Changes concentrate on actual overflow/control issues rather than indiscriminately changing screen density. |
| Full-screen image/video viewer | Platform split: iOS/Android use React Native Modal + virtualized paged FlatList. Browser retains keyboard focus containment, pointer gestures and wrapping. Shared footer has 48-point controls, bounded captions and count announcements. Buttons wrap; native swipes stop at list ends. |
| Gallery safe area and rotation | Modal owns a SafeAreaProvider, with controls inside its SafeAreaView. Pager measures the available width and remounts at the current page after width changes. No guessed window padding or JS-driven native drag transforms. |
| Drawers/dialogs | A shared Sheet owns page-sheet presentation and modal-local insets for choices, region, lists, quick-add, trailers and passkeys. Existing mutation guards and form keyboard avoidance remain. |
| Long text / larger text sizes | Sheet headings can shrink and wrap beside Done/Cancel; option rows grow with labels. Media-type controls share width and permit wrapped labels. Gallery headings/captions are bounded so controls remain reachable. |
| Pagination and touch targets | Catalog and custom lists share one pagination control with 48-point targets, wrapping button rows, disabled semantics and consistent spacing. |
| Search feedback | Suggestions are in a scrollable touch list with distinct loading/empty/error states and a persistent current-query submit action. No stale suggestion stays tappable during debounce. |
| Provider link behavior | Known direct links apply only to providers actually available in the selected region and matching the offer type. Fallback remains usable while links load or fail. |
| Attribution | Public native Credits page uses readable body text, 32-point section separation and touch-sized external links. |

## Architecture decisions

- Keep presentation-specific behavior at the platform boundary: browser gallery animation code does not drive the native pager.
- Keep media thumbnails/data selection separate from viewer presentation; share navigation controls across viewers.
- Centralize modal coordinate-space handling in Sheet instead of repeating it across forms.
- Remove the duplicate list pagination implementation and import CatalogPagination directly.
- Move pure watch-link modules and their tests into `@movies/api`; update web consumers directly, with no compatibility re-export.
- API additions validate inputs and outputs. Server-only fetches stay in Hono; no native secrets or database access.

## Acceptance still requiring devices

Check portrait/landscape and display cutouts, iOS home indicator/Android navigation modes, rapid paging, rotation during a swipe, VoiceOver/TalkBack, large text, video close/replacement, sheet keyboards and dismissal on actual iOS/Android. The native gallery intentionally uses system paging and Done/system Back instead of the former custom downward-drag dismiss gesture. Full-screen modal animation follows the OS.

Existing release acceptance also includes OAuth provider redirects, passkey signing/domain associations, secure-session restart, foreground recovery and performance. These are not established by JavaScript exports or browser tests. Direct provider links require outbound access to `www.wikidata.org`; failures retain the TMDB fallback.

## Verification — 14 November 2026

- Unit suite: 1,423 passed, 36 opt-in tests skipped.
- Root/native/server TypeScript checks passed. Formatting passed; lint passed with the three pre-existing warnings.
- All 193 native browser workflows were exercised using system Chromium: 190 passed in the full run; the three Discover toolbar geometry checks initially caught a two-pixel alignment mismatch and passed at 320/390/430px after matching the filter button to the 48-point tabs.
- Final web, iOS and Android exports passed, including native Hermes compilation.
- Fallow against the starting PR head (`9f05a68`) passed with no newly introduced issues. The full PR audit retains existing advisories.
- Inspected browser captures of Search at 320px, Discover in light appearance, the list editor, gallery and season guide. These use controlled fixture data and do not replace the device acceptance above.
