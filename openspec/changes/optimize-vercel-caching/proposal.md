## Why

The app is more expensive to run on Vercel than necessary because too much content is rendered dynamically and bypasses cache. Logged-out traffic is fully shareable and should be cached aggressively, while logged-in traffic needs a safer strategy that still reduces repeated compute.

## What Changes

- Introduce an explicit caching strategy that separates anonymous and authenticated rendering paths.
- Cache logged-out pages and shared data with remote cache directives and predictable revalidation.
- Add private caching for logged-in user-specific reads to reduce repeated server work without leaking data across users.
- Refactor route/data boundaries so personalized fragments do not force entire pages to be dynamic.
- Add cache invalidation rules tied to mutations and auth/session state changes.

## Capabilities

### New Capabilities
- `public-content-caching`: Cache all logged-out route output and shared read-heavy data using remote cache semantics and tag/time-based revalidation.
- `personalized-session-caching`: Cache authenticated user-specific reads with private cache semantics, scoped by user/session, with conservative lifetimes and explicit invalidation.

### Modified Capabilities
- None.

## Impact

- Affected code: App Router pages/layouts, server data-fetching utilities, auth-aware rendering boundaries, and mutation handlers.
- Affected systems: Vercel remote cache behavior, per-user private cache behavior, and cache invalidation flow.
- Dependencies: Next.js cache directives (`use cache: remote`, `use cache: private`) and existing auth/session context.
