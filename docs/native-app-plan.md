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

## Navigation requirement — native implementation resumed

Use the standard system bottom tab bar, including iOS 26 Liquid Glass, with icons and labels for **Home, Discover, Search and More (…)**. More contains Watchlist, Watched, Lists, Settings and sign-in/account destinations. Keep movie/TV detail stacks inside Home so the tab bar stays available and native back navigation preserves context.

**Owner update: resume the full native page implementation.** The current browser bridges are transitional, not completed native workflows. A tab shell or an external link does not satisfy feature parity.

Continue the remaining page work:

- Implement every navigation destination as a real native screen: Discover, Search, Watchlist, Watched, Lists and individual lists, Settings, sign-in and account/security flows. Complete related person, reviews and catalog routes in the parity inventory too.
- Preserve each web page's content, actions, loading/error/empty behavior, shared sessions and backend rules. Preserve search ranking, filters, pagination, region and scroll/back context.
- Remove every Movies-web navigation bridge, including menus, genre discovery and related internal links. Browser opening remains appropriate for truly external provider, source and official-site links.
- Verify every menu item and internal link reaches its native destination without opening the web app. Add workflow tests and verify the system tab bar, back gestures and deep links on real iOS and Android devices.

The remaining page work is active again. Implement and verify each workflow before marking its parity row complete. Use app path aliases rather than relative parent imports.
