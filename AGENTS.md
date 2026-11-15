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

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
