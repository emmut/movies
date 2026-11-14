# Shared product API

Both apps import domain query and mutation hooks directly from `@movies/api/react/use-<domain>-query`. The shared hooks own contract inputs, query keys, enabled guards, pagination placeholders, mutation invalidation and retry policies. Screens own rendering, URL/navigation state and form drafts. Avoid forwarding modules in the app folders.

`ApiProvider` supplies query utilities and account identity. Web calls the same-origin `/api/rpc` route with its existing cookies. Native calls Hono's `/rpc` endpoint with its existing authenticated transport. Both hosts execute `@movies/api/router` and services from `@movies/services`; services own the database and upstream reads rather than importing one application's implementation into another.

The shared domains are home, catalog (including credits, providers, reviews, images, trailers, seasons, collections and IMDb), person, search, discovery/facets, preferences, custom lists and system lists. Better Auth and passkeys retain their browser/native SDK adapters and platform-specific hooks.

Next server components cannot call React Query hooks. They call the same router through `createServerApi`, then prefetch with `createApiQueryUtils` where the client resumes the query. Existing server-only catalog presentation readers continue to serve metadata and rich server-rendered sections. Public upstream reads retain Next's cache; private service reads always resolve the verified session. Successful web mutations also invalidate Next's render caches.

Private keys start with `['account', accountId]`. A managed signed-out provider disables private reads; native adapters can supply their current identity explicitly. Mutation invalidation captures the submitting identity, so a late response cannot refresh a replacement account's cache. Private hooks switch cache identities with the session; native's session boundary also resets its caches on account changes.

Regression coverage includes router authorization/input validation, shared service behavior, server-prefetch hydration, signed-out/account-switch isolation, late mutations, and Next's RPC/cache-invalidation boundary. Former web server-action wrapper tests were replaced by these common service and transport boundaries rather than retaining a second implementation.
