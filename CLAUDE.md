# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repo.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full setup, commands, architecture, and conventions. Read it before non-trivial work.

## Quick reference

- **Stack**: Next.js 16 App Router · React 19 (React Compiler) · TypeScript · PostgreSQL/Drizzle · Better Auth · TMDB API · Tailwind 4.
- **Package manager**: `pnpm` (enforced by Volta).
- **After code changes**: `pnpm lint` · `pnpm exec tsc --noEmit` · `pnpm test`.
- **When building a feature**: agents must write tests (aim for 100% coverage) and run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm fallow` before calling it done — all must pass. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
- **Path alias**: `@/*` → `src/*`.
- **Conventions**: kebab-case files, PascalCase exports; prefer normal functions over arrows except inline.

## Where things live

| Need | File(s) |
| --- | --- |
| Commands & architecture | `CONTRIBUTING.md` |
| Env vars (source of truth) | `src/env.ts` |
| DB instance / schema | `src/lib/db.ts` · `src/db/schema/` |
| Auth config / session helpers | `src/lib/auth.ts` · `src/lib/auth-server.ts` (`requireUser`) |
| TMDB client / resources | `src/lib/tmdb.ts` · `src/lib/{movies,tv-shows,persons}.ts` |
| Server actions (mutations) | `src/lib/{watchlist-actions,lists,user-actions}.ts` |
| Input validation (Zod) | `src/lib/validations.ts` |
| Caching tags / invalidation | `src/lib/cache-tags.ts` · `src/lib/cache-invalidation.ts` |
| Tests & config | `src/**/*.test.ts` · `vitest.config.ts` |
| CI | `.github/workflows/ci.yml` |
