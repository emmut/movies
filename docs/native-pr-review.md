# Native PR review audit

The active native roadmap goal includes fixing every comment on [PR #350](https://github.com/emmut/movies/pull/350). This audit includes resolved and outdated feedback. GitHub resolution alone is not verification. The PR stays draft until the full roadmap is accepted.

## Review inventory — 2026-10-11

All 16 inline comments and both discussion comments were read. The discussion contains deployment status and the review summary; the summary repeats the six unresolved findings below. The review-thread query returned all threads with no further page.

| Comment | Current implementation and regression evidence |
| --- | --- |
| [Browser data stays stale](https://github.com/emmut/movies/pull/350#discussion_r4238292058) | `lib/api.ts` registers the AppState listener only on native, preserving browser focus handling. |
| [Reopened titles inherit old scroll](https://github.com/emmut/movies/pull/350#discussion_r4238292079) | Catalog and person scroll keys include the navigation entry. `home.spec.ts` checks a fresh title starts at zero and returning Home preserves its offset. |
| [Titles lose the selected country](https://github.com/emmut/movies/pull/350#discussion_r4238373086) | Poster links include their source region; catalog requests read the explicit route region. `discover.spec.ts` checks country context through detail navigation. |
| [Selected providers become hidden](https://github.com/emmut/movies/pull/350#discussion_r4238373089) | Shared native provider choices retain unavailable selected providers as removable rows. `discover.spec.ts` checks the label, selection and removal. |
| [Extra selections are silently dropped](https://github.com/emmut/movies/pull/350#discussion_r4238373092) | Choice sheets disable additions at the contract limit with explanatory text, while permitting removal. `discover.spec.ts` checks the 51st country. |
| [Logger setting is undeclared](https://github.com/emmut/movies/pull/350#discussion_r4238554257) | Tracked server schema declares validated `LOG_LEVEL`; generated accessor includes it. Server typecheck covers the consumer. |
| [Request logger never runs](https://github.com/emmut/movies/pull/350#discussion_r4238554260) | `createApp` registers injected middleware before routes. `logger.test.ts` verifies `/health` emits one structured log and silent configuration emits none. |
| [Cancelled touches lose reading position](https://github.com/emmut/movies/pull/350#discussion_r4238773058) | Drag/pointer cancellation clears the navigation capture. `home.spec.ts` checks cancelled dragging and tab return preserve the latest position. |
| [Failed requests show false totals](https://github.com/emmut/movies/pull/350#discussion_r4238773060) | Person totals require successful movie and TV queries; unavailable totals show `—`. `search-person.spec.ts` covers partial and full failure, including retries. |
| [New code skips required braces](https://github.com/emmut/movies/pull/350#discussion_r4238773063) | `createFuzzySearch` and `personStats` use braces for every conditional; new work follows the same convention. The broader end-goal style audit remains required. |
| [Old import path remains](https://github.com/emmut/movies/pull/350#discussion_r4238969462) | Removed the web constants re-export; the discovery test imports the canonical package directly. |
| [Earlier country overwrites latest choice](https://github.com/emmut/movies/pull/350#discussion_r4239202193) | Home prevents a second selection until the current account save and refresh finish, with a synchronous mutation guard and disabled control. `preferences.spec.ts` holds the first write pending and verifies only one request, then permits the next choice. |
| [Failed save stays selected](https://github.com/emmut/movies/pull/350#discussion_r4239202196) | Failed writes restore cached account data or reset the optimistic query when no prior data exists. Signed-in optimistic changes leave the local fallback untouched. `preferences.spec.ts` covers both known-account rollback and failed account reads. |
| [Quick add hides login](https://github.com/emmut/movies/pull/350#discussion_r4241520392) | The sign-in action dismisses the quick-add modal before navigation. `system-lists.spec.ts` checks login is exposed, the modal is gone and the sign-in control accepts a click. |
| [Sign-in drops the country](https://github.com/emmut/movies/pull/350#discussion_r4241520397) | Return URLs retain query parameters and omit dynamic parameters already represented in the path. Unit tests cover serialization; `system-lists.spec.ts` completes anonymous authentication and verifies explicit US context survives an account default of Norway. List sign-in also preserves page and filters. |
| [List pages inherit old scroll](https://github.com/emmut/movies/pull/350#discussion_r4241520403) | The scroll hook reloads the remembered offset when its key changes and resets new pages to zero without unmounting filter sheets. `system-lists.spec.ts` checks paging from the bottom and returning from details. |

## Validation

Verification of the final implementation:

- `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm check-types`: passed, with four existing web lint warnings.
- `pnpm test`: 915 passed, 14 skipped across 113 files. An earlier run under concurrent platform bundling timed out in the unchanged startup test; the full run after bundling passed.
- `pnpm fallow`: passed with no new dead-code, complexity or duplication findings.
- Fresh native web export and the full browser suite: 80 passed. This includes the earlier resolved review regressions and the new country-save, sign-in and paging tests.
- Focused unit coverage for `route-url.ts` and `scroll-memory.ts`: 100% statements, branches, functions and lines. This claim does not include every component or hook.
- PostgreSQL system-list integration: four passed against isolated fixtures, covering concurrent singleton creation, ownership, media-scoped ordering, SQL provider filtering and anonymous transfer.
- iOS, Android and web JavaScript exports passed to `/tmp/pr350-native-bundles`. Platform bundles do not prove device execution.
- A TypeScript AST audit of 209 tracked native, server and API source/test files found no unbraced conditional bodies.

Device verification and all remaining roadmap work retain their original scope. PR #350 was restored to draft in accordance with the roadmap. Recheck for newly added comments before roadmap acceptance.

## Additional review findings — 2026-10-11

| Comment | Fix and regression evidence |
| --- | --- |
| [Users share sign-in limits](https://github.com/emmut/movies/pull/350#discussion_r4241862976) | The host supplies socket identity or explicitly configured Railway public-ingress identity. The gateway signs the IP, timestamp, method and auth endpoint; web strips unsigned caller metadata and verifies signatures before Better Auth sees its IP key. The real Better Auth limiter test verifies three successful attempts for one IP, a 429 on its fourth even with forged headers, and a successful first attempt from another IP. Session checks use the same signed transport. |
| [Public Discover requires auth](https://github.com/emmut/movies/pull/350#discussion_r4241862979) | Auth-unconfigured responses carry a specific `AUTH_NOT_CONFIGURED` marker. Discover permits public access only for that marker without cached account identity; genuine session/account errors retain recovery. Browser regressions cover both kinds of 503. |
| [List filters keep old services](https://github.com/emmut/movies/pull/350#discussion_r4241862985) | Saving providers invalidates the saving account's `systemLists.options` prefix across regions. The browser test visits a list, saves different providers in Settings, returns immediately and verifies new options without a reload or freshness-window delay. |
| [Page buttons use old results](https://github.com/emmut/movies/pull/350#discussion_r4241862989) | Both page buttons are disabled while fetching, including placeholder results from an earlier input. A delayed TV response after Movies page 2 verifies disabled controls, then TV page 1 → 2, with no accidental page-3 request. |

Auth proxy trust is a deployment contract. Direct servers use the Node connection peer and ignore caller IP headers. `AUTH_IP_SOURCE=railway` consumes the single valid `X-Real-IP` supplied by Railway's public HTTP ingress. The private project network remains within the trusted service perimeter; do not use this mode behind an arbitrary unsanitized proxy or expose a direct untrusted path around that ingress. Railway documents the header as the remote client IP, and its support clarification states that public ingress overwrites caller copies. [Public-networking specifications](https://docs.railway.com/networking/public-networking/specs-and-limits#technical-specifications), [ingress trust clarification](https://station.railway.com/questions/need-authoritative-client-ip-proxy-tru-090eac86).

The public web ingress sees the gateway's egress address, so the original identity travels in separate signed headers. Web accepts that identity only after verifying the shared key, a 30-second clock window, request method and endpoint; unsigned custom IP headers are removed. Better Auth reads the verified identity first, then the public ingress's `X-Real-IP`, excluding arbitrary forwarded-header alternatives. [Better Auth rate-limit guidance](https://better-auth.com/docs/concepts/rate-limit).

The server's per-app Varlock schema declares `AUTH_IP_SOURCE` and sensitive `AUTH_PROXY_SECRET`. Production auth forwarding fails startup without the signing key. The Railway config references the canonical web auth secret rather than introducing a literal secret. `railway config plan --environment movies-pr-350 --json` succeeded with no diagnostics and exactly two safe variable updates; no resource deletion is planned. The CLI removed its tracked legacy skill file during planning; that unrelated deletion was restored. Hosted header/rollout verification remains required after deployment.

Focused verification: 39 tests passed with 100% statements/branches/functions/lines across proxy signing/verification, ingress selection, gateway forwarding, discovery session policy, the session marker and the web auth route. This coverage claim excludes native component rendering, which is verified separately by browser workflows. Root unit tests: 944 passed, 14 skipped. Lint and all typechecks passed with the existing four web warnings; Fallow passed.

The final rebuilt native browser suite passed all 84 tests, including all four new UI cases (the public-only/genuine-error distinction has two cases). The source remains under the full roadmap goal, now also explicitly including React Native Lucide icons and mobile-web design/UX parity, especially live search autocomplete and Discover filters. No phase or release is marked complete by these review fixes.
