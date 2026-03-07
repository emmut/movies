## Context

The app currently renders too much content dynamically, which increases compute and cost on Vercel. Most logged-out traffic is identical across users and can be cached aggressively, while logged-in traffic mixes shared and personalized data in ways that reduce cache hit rate.

The change needs to preserve correctness and privacy while introducing stronger caching. The implementation will use Next.js cache directives and clear boundaries between cacheable public content and per-user content.

## Goals / Non-Goals

**Goals:**
- Maximize cache hit rate for logged-out traffic using remote cacheable rendering and data reads.
- Reduce repeated server compute for logged-in traffic using private caching where safe.
- Prevent cross-user data leakage by isolating personalized cache paths.
- Add explicit invalidation rules so cached data stays correct after writes and session changes.

**Non-Goals:**
- Rewriting the entire data access layer.
- Changing product behavior, UX flows, or authorization rules.
- Introducing third-party caching infrastructure outside Vercel/Next.js primitives.

## Decisions

1. Route-level rendering split between public and personalized paths
   - Decision: Keep public shells and anonymous reads cacheable; move personalized reads into server components/functions that can be cached privately.
   - Rationale: Prevents one personalized fetch from forcing full-page dynamic rendering.
   - Alternative considered: Keep current mixed rendering and only tune TTLs. Rejected because cache hit rate remains low.

2. Use `use cache: remote` for logged-out content
   - Decision: Apply remote cache directives to deterministic public read functions and page sections, with tag/time revalidation.
   - Rationale: Logged-out output is fully shareable and should be reused globally.
   - Alternative considered: Rely only on default static optimization. Rejected because explicit directives and tags provide clearer control and invalidation.

3. Use `use cache: private` for logged-in expensive reads
   - Decision: Wrap safe authenticated read paths in private caching with conservative cache lifetimes.
   - Rationale: Reuses results within a user/session scope without sharing across users.
   - Alternative considered: Mark all authenticated routes as fully dynamic/no-store. Rejected because it overpays on repeated reads.

4. Centralized invalidation strategy
   - Decision: Define cache tags by domain (for example: movies list, movie detail, recommendations, user profile) and call tag invalidation on writes/auth boundary events.
   - Rationale: Keeps correctness predictable and avoids stale personalized/public data.
   - Alternative considered: Time-based expiration only. Rejected because freshness after mutations becomes inconsistent.

## Risks / Trade-offs

- [Incorrect cache boundaries could expose personalized data] -> Restrict private caching to authenticated read helpers and audit that public caches never consume user-specific inputs.
- [Over-caching can serve stale data after mutations] -> Use explicit tag invalidation on writes plus bounded cache lifetimes.
- [Under-caching in logged-in paths reduces savings] -> Instrument cache hit/miss and iteratively expand private caching for safe read paths.
- [Directive misuse may break rendering assumptions] -> Roll out by route group with runtime verification and quick rollback to dynamic for affected paths.

## Migration Plan

1. Inventory routes and data reads; classify each as public-shareable, private-user, or dynamic-only.
2. Implement `use cache: remote` for logged-out page/data paths with initial tag/TTL policy.
3. Implement `use cache: private` for selected authenticated read paths.
4. Add invalidation hooks to write operations and auth/session transitions.
5. Validate correctness and cache behavior in preview; measure cache hit rate and server execution reduction.
6. Roll out gradually and keep a fallback path to disable caching directives per route if regressions appear.

## Open Questions

- Which authenticated endpoints are safe for private caching on day one versus follow-up phases?
- What initial cache lifetimes should we use per domain to balance freshness and cost?
- Do any current middleware/session patterns prevent expected private cache reuse?
