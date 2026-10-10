# Native app short plan

Follow [the full roadmap and session decisions](native-app-roadmap.md) for scope, architecture, safeguards and acceptance criteria. Goal: complete web feature parity with a recognizable shared Movies design and appropriate native interactions.

1. **Align the homepage.** Compare with web and restore familiar branding, movie/TV accents, trending overlays, poster cards and actions. Establish native navigation. Treat the current homepage as a starting point.
2. **Port catalog details.** Movie, TV and person screens, metadata, ratings, trailers, providers, credits and recommendations. Replace temporary web-detail links with native routes and back navigation.
3. **Port identity and preferences.** Sessions, anonymous users, social sign-in, account linking and supported passkey flows; shared region/provider settings.
4. **Port watchlist and watched.** Persistent lists, quick actions, filtering, sorting and pagination; ownership checks and cross-client cache refresh.
5. **Port custom lists.** Create/edit/delete, add/remove titles and reorder lists/items with native sheets, menus and touch interactions.
6. **Port search and discovery.** Preserve web ranking, fuzzy fallback, filters, pagination and navigation context.
7. **Complete reviews and settings.** Audit every web screen/action against the native parity checklist; document any platform-specific alternative.
8. **Verify and release.** Side-by-side visual checks, real iOS/Android workflows, shared backend correctness, accessibility, deployment configuration and release builds.

Work in small vertical slices; port only the required oRPC procedures. Use canonical shared modules, Tailwind/Uniwind and per-app Varlock. Consult `/home/emmut/code/movies-app-example` for setup problems. Prefer clean, cohesive code, meaningful helpers and ordinary blocks over nested ternaries or dense chains. Run the repository gates and the relevant browser/device checks for each slice.
