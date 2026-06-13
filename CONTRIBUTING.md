# Contributing

A Next.js (App Router) movies app in TypeScript, backed by PostgreSQL/Drizzle and the TMDB API.

## Prerequisites

- **pnpm** as package manager (version pinned via the `packageManager` field; Node via `engines`/Volta).
- A **PostgreSQL** database for local development.
- Environment variables configured (see [Environment](#environment--configuration)).

## Development Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack). Also brings up the local imgproxy via Docker Compose. |
| `pnpm build` | Lint, then build for production. |
| `pnpm start` | Start the production server. |
| `pnpm lint` | Run Oxc linting. Run after code changes. |
| `pnpm lint:fix` | Apply Oxc lint autofixes. |
| `pnpm format` | Format `src` with oxfmt. |
| `pnpm format:check` | Check formatting without writing. |
| `pnpm test` | Run Vitest unit tests once. |
| `pnpm test:watch` | Run Vitest in watch mode. |
| `pnpm test:coverage` | Run tests with a coverage report. |
| `pnpm fallow` | Audit changed files (dead code, complexity, duplication) with a pass/warn/fail verdict. |
| `pnpm fallow:dead-code` | Full dead-code / dependency / cycle scan. |
| `pnpm db:generate` | Generate migrations from schema changes. |
| `pnpm db:push` | Push schema changes to the database. |
| `pnpm db:migrate` | Run pending migrations. |
| `pnpm db:studio` | Open Drizzle Studio. |

## Architecture

Next.js 16 App Router, TypeScript, React 19 (React Compiler enabled).

### Database & ORM

- PostgreSQL with Drizzle ORM (Neon serverless driver).
- Schema modules in `src/db/schema/`: `auth`, `watchlist`, `lists`, `user-watch-providers` (re-exported from `index.ts`).
- Database instance exported from `src/lib/db.ts`.
- Migrations in `drizzle/`.

### Authentication

- Better Auth with social providers (Discord, GitHub) and passkey support.
- Anonymous users supported; watchlist is migrated to the account on link/sign-in.
- Configuration in `src/lib/auth.ts`; server-side session helpers in `src/lib/auth-server.ts` (`getSession`, `getUser`, `requireUser`).

### API Integration

- TMDB for movie/TV/person data via a shared client in `src/lib/tmdb.ts`.
- Resource-specific functions: `src/lib/movies.ts`, `src/lib/tv-shows.ts`, `src/lib/persons.ts`.
- Caching via the `'use cache'` directive plus cache tags defined in `src/lib/cache-tags.ts`; invalidation helpers in `src/lib/cache-invalidation.ts`.

### Environment & Configuration

- Type-safe env vars via `@t3-oss/env-nextjs` in `src/env.ts`. Validation can be bypassed with `SKIP_ENV_VALIDATION=true` (used in tests/CI).
- App constants in `src/lib/config.ts` and `src/lib/constants.ts`.
- Required: `MOVIE_DB_ACCESS_TOKEN`, `DATABASE_URL`, auth provider secrets, imgproxy keys. See `src/env.ts` for the full schema.

### UI

- Base UI (`@base-ui/react`) primitives with custom styling in `src/components/ui/`; shadcn-managed (`components.json`).
- Tailwind CSS 4 for styling.
- Sidebar layout with search.
- Naming: kebab-case files, PascalCase exports.

### State Management

- URL state via `nuqs` for filters and pagination (loaders in `src/lib/*-search-params.ts`).
- Server components for data fetching; client components for interactivity.
- Mutations through server actions (`src/lib/watchlist-actions.ts`, `src/lib/lists.ts`, `src/lib/user-actions.ts`). Every action authenticates via `requireUser()` and validates input with Zod schemas in `src/lib/validations.ts`.

### Key Directories

- `src/app/` — App Router pages and API routes.
- `src/components/` — React components and UI primitives.
- `src/lib/` — business logic, API clients, server actions, utilities.
- `src/db/schema/` — Drizzle schema.
- `src/types/` — TMDB response types.
- `src/hooks/` — custom React hooks.

## Conventions

- Use `pnpm` (enforced by Volta config).
- Prefer normal functions over arrow functions except for inline usage.
- Path alias `@/*` maps to `src/*`.
- Server-only modules import `server-only`; keep secrets and DB access out of client components.

## Testing

- Vitest, config in `vitest.config.ts` (Node environment, `@/*` alias, `server-only`/`client-only` stubbed, env validation skipped).
- Tests are co-located: `src/**/*.test.ts`.
- Pure logic (`utils`, `validations`, `regions`, `cache-tags`) is tested directly; server actions mock `@/lib/db`, `@/lib/auth-server`, and `next/cache` (see `src/lib/lists.test.ts` for the chainable db-mock pattern).

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and PRs targeting `main`:

- **Lint, typecheck & test** — `pnpm lint`, `tsc --noEmit`, `pnpm test`.
- **Fallow audit** — `pnpm fallow` against the merge-base; fails on newly introduced findings.

Versions (pnpm, Node) are derived from `package.json`, not pinned in the workflow.
