# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repo.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, architecture, and conventions. Read it before non-trivial work.

## Working agreements

- **When building a feature**: write tests (aim for 100% coverage) and run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm fallow` before calling it done — all must pass.
- If fallow finds duplicate code, but the abstraction to merge the code does not make sens, use suppression
- Prefer normal functions over arrows except inline.
- Use clean code and senior engineering patterns: clear ownership, small interfaces, explicit validation/error handling and readable control flow. Avoid overusing ternaries, nested conditionals and dense chained expressions; use meaningful helpers, intermediate values and ordinary blocks.
- Server-only modules import `server-only`; keep secrets and DB access out of client components.
- **Native/web recognition**: native screens must preserve the web app's branding, colors, content hierarchy, card treatments and actions, and look closer to web than the current native homepage. Compare the running web screen before implementing its native counterpart; use native navigation, back buttons/gestures, sheets and controls where they make sense. Follow [the native decisions and parity roadmap](./docs/native-app-roadmap.md).
- Native styling uses Tailwind/Uniwind; StyleSheet or inline style objects require a specific API limitation that classes cannot handle.
- Native/Hono envs follow the reference's per-app Varlock pattern: tracked schemas, generated app-scoped `ENV`, and no hand-written env re-export wrappers. Inspect `/home/emmut/code/movies-app-example` and its relevant config when diagnosing setup problems; web remains the visual/product source of truth.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
