# PR #350 pre-merge review

Reviewed [PR #350](https://github.com/emmut/movies/pull/350) against its confirmed base, `main` at `c500c6201d6fcbe91de1b5586cc54a327daeaf06`. Local HEAD was `6b8b9435c4d275476b7be90b003d32aa95348891`. The review includes the existing uncommitted changes across 80 files. The branch changes 681 files; this is a targeted review of consequential boundaries, not a claim that every line is defect-free.

Standards sources: `CONTRIBUTING.md`, the repository working agreements, and `docs/shared-api.md`. Spec sources: the PR description, `docs/native-app-roadmap.md`, and `docs/native-app-parity.md`. Existing PR review threads were read to avoid repeating already addressed feedback. No application code was changed or remote comments posted.

## Standards

### 1. P2: Make custom-list ownership checks atomic with mutations

**Evidence:** `packages/db/src/custom-lists.ts:292` checks ownership before deleting by list ID alone. Update, item add/remove, and `packages/db/src/list-item-order.ts:70` also separate authorization from the write. `packages/db/src/custom-list-transfer.ts:37` changes list ownership while preserving the list ID. Transfer takes account ordering locks, which these item writes and update/delete operations do not share.

**Failure:** a guest request passes its ownership check, linking transfers the list to an account, then the delayed guest request deletes or changes the transferred list. The router's verified session does not make a previously checked ownership relationship current. This is an interleaving found in source; it was not reproduced against PostgreSQL during this review.

**Suggested change:** include owner and custom-list type in update/delete predicates, check affected rows, and return the existing not-found error when ownership no longer matches. For item writes and reordering, check ownership inside the mutation transaction and lock the parent list row so ownership transfer cannot interleave. Keep a consistent lock order with the existing ordering locks. Do not introduce a generic repository framework.

**Reach:** custom-list store, item-order store, ownership transfer interactions, existing service error translation, and database integration tests. Normal calls must retain current not-found/conflict behavior.

**Regression:** deterministically pause a guest mutation after its preliminary lookup, transfer ownership, then resume it. Assert that the transferred list and its items survive unchanged or that the write serialized before transfer. Cover delete and at least one item mutation, plus reorder if it uses a separate locking path.

### 2. P3: Remove duplicate native system-list invalidation

**Evidence:** `apps/native/components/system-list-screen.tsx:251` gives `useSystemListsMoveMutation` an on-success callback that invalidates system-list queries. `packages/api/src/react/use-account-mutation.ts:38` has already awaited invalidation of the submitting account's queries before invoking that callback.

**Consequence:** a move can immediately refetch the same active list twice, lengthening its pending state. It also leaves invalidation ownership in both a screen and the shared mutation hook, contrary to `docs/shared-api.md`.

**Suggested change:** call `useSystemListsMoveMutation()` directly and remove the unused account-key/cache imports. Keep mutation invalidation in the shared hook. Do not replace the callback with a screen effect.

**Regression:** use the existing shared-hook mutation tests to retain account isolation; add a focused assertion that one native move does not initiate a second screen-driven refresh.

### 3. Optional: Share movie/TV list-card hydration

**Evidence:** `packages/services/src/system-list-service.ts:42` and `packages/services/src/custom-list-service.ts:90` repeat endpoint construction, schema parsing, ID verification, card conversion, and list-item identity attachment.

**Suggested change:** extract just that movie/TV hydration operation into a small service helper. Keep the custom-list person branch local. Preserve each caller's settled-result handling and unavailable-item counts; one failed upstream title must not fail the whole page or enable unsafe reordering.

**Regression:** retain successful movie/TV, mismatched-ID, and upstream-failure cases in the two service suites. Avoid duplicating the same helper implementation in new tests.

This is a duplication heuristic, not a merge blocker or a reason to combine the two list services.

### 4. Optional: Align raw metadata field validation

**Evidence:** `packages/services/src/catalog-service.ts:33` and `packages/api/src/metadata.ts:19` independently describe overlapping upstream title fields. For example, the compact reader requires a nonnegative integer runtime while the full metadata schema accepts any number. Their missing-runtime defaults also differ.

**Suggested change:** agree on the raw upstream field constraints and reuse those field schemas where the contracts actually coincide. Retain separate compact and full projections, including intentionally different presentation defaults. Do not make native screens download full web metadata merely to reduce duplication.

**Regression:** feed the same upstream fixtures to both readers, covering null/missing runtime, invalid numeric fields, wrong IDs and 404s. Assert intentional output differences explicitly before consolidating validation.

This is a maintenance opportunity, not evidence that different public projections are inherently wrong. Defer it if the intended differences are not yet agreed.

## Spec

### 1. P2: Reconcile server-clamped native system-list pages

**Requirement:** the parity checklist requires correct page bounds (`docs/native-app-parity.md:61`); the shared API design requires reconciled pages before reordering.

**Evidence:** `apps/native/components/system-list-screen.tsx:333` reads the page query without calling `useCanonicalListPage`, unlike the two custom-list screens. The reorder predicate correctly refuses results whose returned page differs from the requested page.

**Failure:** a saved `?page=3` link is opened after the list shrinks to one page. The server returns page 1, but the route remains page 3. Reordering stays disabled, and both page buttons are disabled because the result has only one page. Changing a filter or media tab can recover, but normal pagination cannot.

**Suggested change:** call the existing `useCanonicalListPage(query, input.page)` immediately after the query hook. Preserve its placeholder-data guard so old results cannot rewrite a newly requested page.

**Reach/regression:** native system-list screen and its browser workflow tests. Open an out-of-range Watchlist/Watched link, verify route replacement to the returned page, then reorder successfully. Also hold a page request pending and verify placeholder results do not reconcile the URL or enable moves.

### 2. P2: Connect native React Query to network changes

**Requirement:** roadmap phase 7 explicitly includes app foreground/reconnect (`docs/native-app-roadmap.md:61`).

**Evidence:** `apps/native/lib/api.ts:33` sets online state to true once. Native has an AppState focus listener but no connectivity subscription. `apps/native/lib/api.test.ts` currently asserts this forced-online behavior rather than recovery.

**Failure:** if connectivity drops and returns while the app remains foreground, React Query never receives the offline-to-online transition. Queries that exhausted their attempts can remain failed until a manual retry or focus cycle.

**Suggested change:** use the already installed `expo-network` to register `onlineManager.setEventListener`, initialize connectivity and remove the subscription on cleanup. Handle unknown initial reachability without incorrectly holding the app offline. Keep the browser's default listener. Account for an initial async read completing after a newer network event.

**Reach/regression:** native API initialization and its existing focus integration tests. Verify initial state, offline-to-online notifications, cleanup, unchanged browser listeners, and an actual failed-query recovery on reconnect. Device acceptance should include loss and restoration of connectivity while the app stays foreground.

## Validation and merge recommendation

- `pnpm lint`: passed, with two existing test `<img>` warnings.
- `pnpm exec tsc --noEmit`: passed.
- Native and server TypeScript checks (`pnpm exec tsc --noEmit -p apps/native/tsconfig.json` and `-p apps/server/tsconfig.json`): passed.
- `pnpm test`: 1,291 passed; 36 skipped across nine skipped files. The skipped opt-in integration tests are not fresh PostgreSQL/auth acceptance.
- `pnpm fallow`: passed for the existing working-tree changes.
- `pnpm exec fallow audit --changed-since c500c6201d6fcbe91de1b5586cc54a327daeaf06`: passed with advisories across all 681 changed files. The audit reports inherited findings and flags optional cross-client tests as skipped; those tests deliberately require local integration configuration. Coverage matched only 7 of 5,347 functions in this run, so its complexity output does not establish current branch-wide test coverage or a trustworthy zero-CRAP claim.

Fix the three behavioral findings before merge. Remove the duplicated invalidation as a small accompanying cleanup. The two broader schema/hydration suggestions can follow separately; a broad architectural rewrite would add unnecessary risk to this branch.

Production builds, browser workflows, live PostgreSQL concurrency, hosted ingress, and physical iOS/Android acceptance were not rerun. Signed-device OAuth, passkeys, secure-storage restart, gestures, safe areas and release behavior remain explicit roadmap acceptance gaps; the existing PR description also records them.

Totals: Standards has one ownership defect and three refactor suggestions; the ownership race is its highest-risk finding. Spec has two P2 behavioral findings; clamped pagination prevents an existing action, while reconnect handling leaves recovery incomplete.
