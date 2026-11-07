# Dependency upgrade — 2026-11-07

Checked every external dependency in the root and workspace manifests and the shared catalog against npm's stable `latest` tag. Packages already current remain unchanged, including React, TypeScript, Drizzle, Base UI, Railway, and Turbo. Workspace and catalog references stay shared. Regenerated the lockfile, including pnpm's bootstrap document.

The existing `minimumReleaseAge: 1440` policy and its existing exceptions are unchanged. Tailwind 4.3.5, TanStack Query/devtools 5.107.1, and PostHog JS 1.447.3 are deferred because they were published within that window. The installed versions below are the newest eligible releases.

| Package | Before | After |
| --- | --- | --- |
| `@better-auth/passkey`, `better-auth` | 1.7.12 | 1.7.18 |
| `@tailwindcss/postcss`, `tailwindcss` | 4.3.3 | 4.3.4 |
| `@tanstack/react-query`, `@tanstack/react-query-devtools` | 5.104.5 | 5.106.1 |
| `@types/node` | 26.6.5 | 26.6.6 |
| `cn` | 0.5.0 | 0.5.2 |
| `lucide-react` | 1.61.0 | 1.70.0 |
| `next` | 16.4.3 | 16.4.5 |
| `postcss` | 8.5.31 | 8.5.32 |
| `posthog-js` | 1.438.21 | 1.447.2 |
| `posthog-node` | 5.57.1 | 5.63.1 |
| `vite-plus`, Vite+ core alias | 1.4.0 | 1.5.0 |
| `vitest`, `@vitest/coverage-v8` | 5.0.5 | 5.1.0 |
| `@playwright/test` | 1.64.1 | 1.65.0 |
| `fallow` | 3.35.0 | 3.40.0 |
| `shadcn` | 4.22.1 | 4.23.0 |
| pnpm | 12.15.0 | 12.18.0 |

## Release-note review and compatibility

- [Next.js 16.4.4](https://github.com/vercel/next.js/releases/tag/v16.4.4) and [16.4.5](https://github.com/vercel/next.js/releases/tag/v16.4.5): backported fixes and security fixes, including Cache Components information disclosure. Read the bundled `adopting-partial-prefetching.md` guide after the new build warning. Set `partialPrefetching: false` explicitly to preserve current navigation/prefetch semantics; adopting shared App Shell prefetching is a separate migration.
- [Better Auth 1.7.13–1.7.18](https://github.com/better-auth/better-auth/compare/v1.7.12...v1.7.18): security fixes affect session revocation, OAuth verification, anonymous linking, and passkey origins. The app uses PostgreSQL, a fixed `baseURL`, and default passkey settings, so the wildcard-host origin migration and MySQL test-server requirement do not apply. The stricter type-only exports pass type checking. No schema migration is required by these notes.
- [Playwright 1.65](https://github.com/microsoft/playwright/releases/tag/v1.65.0): reviewed class-field initialization, inert actionability, cookie path/host matching, proxy authentication, request query merging, CSS import existence, accessibility names, empty shards, and reporter output cleanup. The suite has no page-object class initializers, custom proxies, query `params` options, or blob reporter. Its keyword test checks inert content before expanding it and only clicks revealed controls. All 106 tests still collect. CI already reinstalls browsers and runs Node 24, which remains supported.
- [Vite+ 1.5](https://github.com/voidzero-dev/vite-plus/releases/tag/v1.5.0): aligned core alias, runner, and coverage provider with its bundled Vitest 5.1. New lint rules flag effect-driven hydration state; replaced it with `useSyncExternalStore` using a false server snapshot and true client snapshot, provided directly by `useIsClient` at every call site. No configuration migrations were required by the new formatter.
- [Vitest 5.1](https://github.com/vitest-dev/vitest/releases/tag/v5.1.0): adds fake timers for Node timer modules and changes browser mode's default port. This suite uses Node mode. The startup regression now waits for lazy imports with `vi.dynamicImportSettled()` before checking connection attempts and advancing the retry timer, avoiding the old one-second polling deadline on cold imports.
- [Fallow 3.35–3.40](https://github.com/fallow-rs/fallow/compare/v3.35.0...v3.40.0): adds Vite+ recognition and dependency checks, namespace/binary rules, and changes some audit attribution. Existing v3 CI wrapper remains compatible. Audit succeeds with inherited/advisory findings; no rules were disabled to make this upgrade pass.
- [shadcn 4.23](https://github.com/shadcn-ui/ui/releases/tag/shadcn%404.23.0): MCP export changes from `Server` to `McpServer`; this repository does not import `shadcn/mcp`, so no migration is needed.
- [cn 0.5.1/0.5.2](https://github.com/shadcn-ui/cn/releases): changes merging of legacy `bg-gradient-to-*` utilities and fixes declaration exports. Migrated the two trending overlays from `bg-gradient-to-t` to `bg-linear-to-t` so cn keeps treating them as gradient images. Application type checking and lint pass.
- [TanStack Query changes](https://github.com/TanStack/query/compare/%40tanstack/react-query%405.104.5...%40tanstack/react-query%405.106.1): observer, cancellation, filtering, and type fixes. Existing invalidation tests and application types pass; runtime/devtools versions stay aligned.
- [PostHog browser changelog](https://github.com/PostHog/posthog-js/blob/main/packages/browser/CHANGELOG.md) and [Node changelog](https://github.com/PostHog/posthog-js/blob/main/packages/node/CHANGELOG.md): replay, masking, identity restoration, error parsing, and additive metrics/email APIs. Experimental histogram buckets change, but the app does not use metrics. Existing SDK initialization/capture code needs no API changes.
- [Tailwind 4.3.4](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.4), [PostCSS 8.5.32](https://github.com/postcss/postcss/releases/tag/8.5.32), [Lucide 1.61–1.70](https://github.com/lucide-icons/lucide/compare/1.61.0...1.70.0), and [Node type changes](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/master/types/node): CSS/parser fixes, icon additions/design fixes and type maintenance. Existing imports and types remain compatible.
- [pnpm 12.15–12.18](https://github.com/pnpm/pnpm/compare/v12.15.0...v12.18.0): reviewed install/peer resolution, agent-skill linking, registry/variant, and lockfile changes. This project uses the npm registry and keeps Vite+ provisioning settings. No dependency skills were approved or activated.
- Railway is already at its latest stable 3.16.0. Kept its deploy-options patch; all ESM/CommonJS database helper regression tests pass.

## Validation

- Frozen installation with pnpm 12.18.0 and supply-chain checks.
- `pnpm check`: formatting, lint, and type-aware checks pass with no warnings.
- `pnpm run check-types`: root and web workspace pass.
- `pnpm test`: 79 files / 742 tests pass; the PostgreSQL integration file remains skipped without `SEARCH_TEST_DATABASE_URL` (4 tests).
- `pnpm fallow`: audit passes with inherited/advisory findings.
- Playwright collection: 106 tests in 26 files. Browser execution is blocked: browser downloads from `cdn.playwright.dev` return HTTP 403 `Domain forbidden` under this environment's network policy.
- `SKIP_ENV_VALIDATION=true pnpm build`: blocked fetching Inter from `fonts.googleapis.com` during Next.js compilation; the same failure occurs outside the command sandbox. Production build completion is unverified in this restricted environment.
- `pnpm outdated -r --format json`: `{}` with the release-age policy applied.
