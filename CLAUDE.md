# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repo.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, architecture, and conventions. Read it before non-trivial work.

## Working agreements

- **When building a feature**: write tests (aim for 100% coverage) and run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm fallow` before calling it done — all must pass.
- Prefer normal functions over arrows except inline.
- Server-only modules import `server-only`; keep secrets and DB access out of client components.
