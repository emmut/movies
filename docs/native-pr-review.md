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
