# Vite+ migration

This existing pnpm monorepo now uses Vite+ **1.4.0**, with bundled Vitest
**5.0.5**, for tests, linting, formatting, and the local task CLI. The starting
worktree was clean.

## Setup

- Ran the target release through `pnpm dlx --package=vite-plus@1.4.0`, after
  reading `vp help` and `vp help migrate`. Migration ran from the workspace root
  with `--no-interactive --no-hooks --no-agent --no-editor`.
- The original Vitest 5.0.0 setup already met the upstream prerequisites;
  no preliminary upgrade was needed. Node 24.11.1 is pinned via `vp env pin`
  in `.node-version`. Vite+ now manages Node and pnpm; mise was removed and
  both CI workflows use a commit-pinned `setup-vp` with the shared version pins.
- Pinned the latest stable pnpm, **12.15.0**, with its registry integrity hash.
  Preserved patches, existing overrides, workspace exports, and build behavior.
  Kept the migrator's Vite/Vitest
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
- Replaced Nub with `vp run` / `vp exec` for tasks and `vpx` for TypeScript
  utilities. Preserved Node environment-file flags, path aliases, argument
  forwarding, and Turbo/Next.js orchestration. Drizzle's compiled CLI runs on
  Node with the same optional environment file. Updated Railway build/start,
  migrations, cron commands, Playwright startup, CI, shebangs, and documentation;
  removed Nub's package, mise pin, and build permissions.
  Fallow explicitly ignores the Tailwind lint plugin dependency because it is
  loaded through `lint.jsPlugins` rather than a source import.

pnpm 12 records its package-manager bootstrap metadata in an additional lockfile
document. Its lockfile verification also enforces the existing one-day release
delay against Vite+ 1.4.0, which was published on the migration date. The release
delay now lives in `pnpm-workspace.yaml`, with exceptions limited to the ten
explicit Vite+ 1.4.0 package/version pairs; all other versions retain the delay.
`runtimeOnFail: ignore` and `pmOnFail: ignore` give Vite+ sole responsibility for
Node/pnpm provisioning. Validation used an isolated global Vite+ installation in
`/tmp`, leaving the user's shell configuration unchanged.
Fallow currently misses the application lockfile document when checking the
esbuild override, so that false positive has a scoped suppression; the security
override itself remains active and the frozen installation validates it.

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

The same full suite passed with four workers after removing Nub. Runtime smoke
checks verified TypeScript enum transformation, root path aliases, top-level
async execution, arguments, environment-file loading, shell-variable precedence,
and optional versus required missing environment files. Both `db:migrate` and
`db:migrate:railway` passed against the temporary database. Disabled title-sync
and search-ingest entrypoints exited cleanly; seed rejected missing arguments;
IMDb's entrypoint loaded correctly with network access intentionally intercepted
before downloading or writing data.

Final validation under Vite+-managed Node 24.11.1 and pnpm 12.15.0 passed the
frozen install, `pnpm check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`
(all 546 tests, no skips), `pnpm fallow`, workspace type checks, and the production
build plus all 72 Chromium/mobile WebKit tests. The workflow YAML parses and all
four runtime setup jobs use the shared Node/Vite+ pins. Browser validation used
isolated port 3100 because an existing service on port 3000 did not respond;
that existing service was left untouched.
The full coverage suite also passed under the final managed environment with
all 546 tests and the same coverage percentages listed above.

The repository's [Railway configuration skill](../.agents/skills/railway-config/SKILL.md)
requires: "After editing `.railway/railway.ts`, run `railway config plan`."
That read-only plan was attempted for the runtime-command changes but could not
run because the local Railway CLI is unauthenticated. No configuration was
applied; Railway-side plan validation remains outstanding.

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

Use the global Vite+ CLI to manage the pinned environment and run the local
project toolchain:

```sh
vp env install
vp install
vp check
vp test run
pnpm test:watch
vp run dev
vp run build
vp run <task>
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

## Dependency refresh

All direct workspace dependencies now use their latest stable npm releases as
of October 23, 2026, including Next.js 16.4.3, React 19.3.1, Railway 3.16.0,
Fallow 3.35.0, and Turbo 2.11.10. Dependencies shared across workspace manifests
use the default pnpm catalog, so their versions are defined once. The one-day
release delay remains, with exact package/version exceptions for the selected
new Next.js, Octicons, and PostHog releases and their required dependencies.

The Next.js scroll patch was removed after all six existing Chromium detail and
loading-skeleton scroll regressions passed against unpatched Next.js 16.4.3.
The Railway patch still preserves database deploy settings and has been rebased
onto 3.16.0, covering ESM and CommonJS exports from both `railway` and
`railway/iac`. Its 32 regression checks verify sleep settings, resource limits,
region precedence, generic databases, and default behavior. The IaC compiler
now lives in Railway CLI (minimum 5.42.1), rather than the SDK.

Validation for this refresh passed frozen installation, the recursive outdated
check (no outdated packages), `vp check`, lint, root and app type checks, Fallow's
audit gate, all 578 unit/integration tests with a disposable migrated PostgreSQL
database, and the production build. All six Chromium scroll regressions passed
with the compiled public auth URL matching the test server's port. The mobile
WebKit checks could not launch because this host lacks libicu74 and libflite1.
The read-only Railway plan remains blocked by missing local authentication.
