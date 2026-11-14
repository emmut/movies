# Web environment configuration

`apps/web/.env.schema` declares web configuration, defaults and public/sensitive boundaries. Next uses `@varlock/nextjs-integration` through the scoped `next>@next/env` pnpm override and the Next config plugin. The pinned integration matches Varlock 1.18, already used by native and Hono. Both Webpack and Turbopack use this loader.

Copy `.env.example` to `.env` in `apps/web`, fill in the required values, then start/build normally. Next validates configuration before serving the app. Read `ENV` directly from `@/env`; `apps/web/src/env.ts` is generated and ignored. Root `pnpm env:generate` and install's postinstall generate all three app modules without requiring deployment secrets. Do not add an env forwarding wrapper or edit generated types.

Server configuration such as pool size, auth test controls and deployment origins is explicitly dynamic, preserving runtime overrides. `NEXT_PUBLIC_*` browser values remain static build-time configuration.

Keep credentials sensitive. Browser variables must be explicitly `@public`; the Next plugin replaces these accesses and guards against leaking sensitive values. Public passkey signing identifiers retain their domain validation/normalization when building credential associations. Vercel hostnames become HTTPS origins in auth configuration.

Unit tests mock the environment boundary with typed, synthetic configuration in `src/test/setup-env.ts`. Schema tests load the actual tracked schema with isolated fixtures and verify coercion, sensitivity, invalid values and passkey identifiers. `SKIP_ENV_VALIDATION` remains for the standalone T3 script validator; it does not bypass Next's Varlock validation.

Database and cron commands retain `scripts/env.ts` and Node's existing `--env-file` loading. They do not import Next's generated runtime configuration. The shared web `.env` also declares their optional opt-in flags so loading it does not produce unknown-key warnings.
