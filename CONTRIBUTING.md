# Contributing

A Next.js (App Router) movies app in TypeScript, backed by PostgreSQL/Drizzle and the TMDB API.

## Prerequisites

- **pnpm** (enforced via Volta / the `packageManager` field).
- A **PostgreSQL** database for local development.
- A **TMDB API** access token and the other secrets defined in `src/env.ts`.

## Getting started

1. Install dependencies: `pnpm install`.
2. Copy the environment template and fill it in — `src/env.ts` is the source of truth for what's required. `SKIP_ENV_VALIDATION=true` bypasses validation (used in tests/CI).
3. Apply the schema to your database: `pnpm db:push`.
4. Start the dev server: `pnpm dev`.

`pnpm dev` also boots a local PostgreSQL and imgproxy via Docker Compose, so Docker needs to be running. The default `DATABASE_URL` in `.env.example` points at that local database; run `pnpm db:push` once it's up to apply the schema.

## Common commands

The most-used scripts — run `pnpm run` for the full list, which is authoritative.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server. |
| `pnpm lint` / `pnpm format` | Lint / format. |
| `pnpm test` | Unit tests. |
| `pnpm fallow` | Audit changed files (dead code, complexity, duplication). |
| `pnpm db:push` / `pnpm db:studio` | Apply schema / open Drizzle Studio. |

Before opening a PR, make sure `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm fallow` all pass.

## Conventions

- Prefer normal functions over arrow functions except for inline usage.
- Naming: kebab-case files, PascalCase exports.
- Server-only modules import `server-only`; keep secrets and DB access out of client components.
- Mutations go through server actions: every action authenticates via `requireUser()` and validates input with the Zod schemas in `src/lib/validations.ts`.
- Caching uses the `'use cache'` directive with tags in `src/lib/cache-tags.ts`; invalidate via the helpers in `src/lib/cache-invalidation.ts`.
- URL state (filters, pagination) via `nuqs` loaders in `src/lib/*-search-params.ts`. Fetch in server components; keep interactivity in client components.

## Design notes (non-obvious)

- Anonymous users are supported; their watchlist is migrated onto the account on link/sign-in.
- Auth is Better Auth with Discord/GitHub social providers and passkey support.
- UI primitives are Base UI (`@base-ui/react`) styled in `src/components/ui/`, shadcn-managed via `components.json`.

## Testing

- Vitest, Node environment, tests co-located as `src/**/*.test.ts`.
- Pure logic is tested directly. Server actions mock `@/lib/db`, `@/lib/auth-server`, and `next/cache` — see `src/lib/lists.test.ts` for the chainable db-mock pattern.

## CI

`.github/workflows/ci.yml` gates PRs targeting `main`:

- **Lint, typecheck & test**.
- **Fallow audit** — fails only on findings newly introduced relative to the merge-base.
