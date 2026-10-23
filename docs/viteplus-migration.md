# Vite+ migration

This existing pnpm monorepo now uses Vite+ **1.4.0**, with bundled Vitest
**5.0.5**, for tests, linting, formatting, and the local task CLI. The starting
worktree was clean.

## Setup

- Ran the target release through `pnpm dlx --package=vite-plus@1.4.0`, after
  reading `vp help` and `vp help migrate`. Migration ran from the workspace root
  with `--no-interactive --no-hooks --no-agent --no-editor`.
- The original Vitest 5.0.0 setup already met the upstream prerequisites;
  no preliminary upgrade was needed. Node 24.11.1 is supported.
- Preserved the pnpm 11.1.2 package-manager pin, patches, existing overrides,
  workspace exports, and build behavior. Kept the migrator's Vite/Vitest
  catalogs, aliases, overrides, and direct Vitest dependency.
- Added Vite+ to the root and the two packages whose tests import it. Aligned
  the coverage provider through the generated catalog.
- Consolidated `vitest.config.ts`, `oxlint.config.ts`, and `oxfmt.config.ts`
  into `vite.config.ts`. The migrator did not merge the TypeScript Oxlint and
  Oxfmt configs automatically, so those settings were merged manually. Fixed
  Tailwind stylesheet references to use the actual workspace-root-relative path.
- Retained test globs, aliases, environment, globals, lint plugins and rules,
  type checking, single quotes, import sorting, and Tailwind sorting. Formatting
  covers the existing `apps`, `packages`, and `scripts` directories plus the new
  config. Formatter changes to application files normalize existing formatting,
  imports, and Tailwind class ordering.
- Rewrote Vitest imports to `vite-plus/test`. Assertions and snapshots were not
  weakened or replaced. Watch scripts explicitly use `vp test watch`, and the
  web package delegates to the root task with `vp run -w test:watch apps/web/src`.
  The documented workspace-root selector avoids assuming how many directories
  separate a package from the workspace root, while retaining the web test filter.
- CI now runs `pnpm exec vp check` and `pnpm test`, retaining the additional
  root/application type checks and existing integration/browser jobs.
- Kept Nub and Turbo orchestration, Next.js development/production commands,
  database/cron scripts, Railway infrastructure, and Playwright configuration.
  Fallow explicitly ignores the Tailwind lint plugin dependency because it is
  loaded through `lint.jsPlugins` rather than a source import.

## Validation

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed for all seven workspace projects. |
| `pnpm exec vp check` / `pnpm check` | Passed; zero errors and three React compiler warnings. |
| `pnpm lint` | Passed with the same three warnings. |
| `pnpm exec tsc --noEmit` | Passed. |
| `pnpm exec vp run check-types` | Passed root and web package type checks. |
| `pnpm test` | Passed 542 tests, with the existing four database tests skipped without a database. |
| `SEARCH_TEST_DATABASE_URL=... pnpm exec vp test run` | Passed all 546 tests across 54 files, with no skips, using an isolated temporary PostgreSQL database and the existing migrations. |
| `SEARCH_TEST_DATABASE_URL=... pnpm test:coverage --maxWorkers=4` | Passed all 546 tests. Statements 60.68%, branches 59.02%, functions 52.74%, lines 60.86%. No coverage thresholds changed. |
| `SEARCH_TEST_DATABASE_URL=... pnpm --filter @movies/web test:watch --run` | Passed all 541 web tests through `vp run -w`; no skips. |
| `pnpm format:check` | Passed. |
| `pnpm fallow` | Passed the existing audit gate; retained advisory/inherited findings. |
| Production build (`pnpm exec vp run build`, also invoked by Playwright) | Passed after the TMDB credentials were corrected. |
| `pnpm e2e` | Passed all 72 Chromium and mobile WebKit tests against the production build. |

A coverage run concurrent with a Next.js build hit the existing startup test's
timing assertion. The complete suite passed when rerun with four workers;
no test code or timeouts were changed.

Initial production/browser attempts were blocked by TMDB HTTP 401. The final
Playwright-managed production build passed with the updated credentials and
isolated test database. Test image signing uses disposable `deadbeef`/`cafe`
credentials rather than project secrets.

The React warnings concern `Date` during person-page rendering and synchronous
state updates in `use-is-client` and `use-is-mounted`. Fallow reports the generated
`vite` catalog entry as unused because it does not count the `vite@*` override
as a catalog consumer. That required alias remains in place. Existing complexity,
duplication, styling, and hidden-directory notices remain governed by the
project's existing audit policy.

## Compatibility review

There are **no generated Vitest v4 compatibility candidates** in the root or
workspace configuration: the source runner was already Vitest 5. There are no
compatibility settings to retain or remove and no cleanup trial code changes.
The migrator reported no BLOCK or REVIEW findings.

There are **no tsdown compatibility candidates**. Shared packages export source
directly to Next.js and have no library emission or declaration build. `vp pack`
and emitted-library consumer checks do not apply to this workspace.

No Vitest browser-mode projects or benchmarks are configured. The browser suite
uses Playwright with Chromium and mobile WebKit. Docker bridge networking is
unavailable in this environment; a temporary imgproxy container was started with
explicit user approval, host networking, and disposable test credentials.
The temporary imgproxy containers/network and PostgreSQL server were removed or
stopped after validation.

## Commands

Use the project-local CLI without installing a global runtime manager:

```sh
pnpm install
pnpm exec vp check
pnpm exec vp test run
pnpm test:watch
pnpm exec vp run dev
pnpm exec vp run build
pnpm exec vp run <task>
```

`vp dev` starts Vite, and `vp build` builds a Vite app. This project needs
`vp run dev` and `vp run build` to invoke its Docker/Next.js scripts.
`vp test` runs Vitest once by default; `vp run test` selects the package script.
The `packageManager` field selects pnpm for `vp install`.

Guidance: [migration](https://viteplus.dev/guide/migrate),
[migration rules](https://viteplus.dev/guide/migrate-rules),
[Vitest 5 compatibility](https://viteplus.dev/guide/vitest-v5),
[upstream Vitest migration](https://vitest.dev/guide/migration/), and
[tsdown 0.23 release](https://github.com/rolldown/tsdown/releases/tag/v0.23.0).
