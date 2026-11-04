# Direct provider title links

The app uses TMDB/JustWatch for country-specific availability. Provider title
links prefer Popcorn Time, with Wikidata filling individual gaps. A title identifier does not establish a streaming
licence, price, subscription entitlement, or regional availability. The UI only
uses a direct link for a matching TMDB provider and allowed offer type in the
selected country. Provider pages may still require login or be unavailable in the
viewer's actual location.

## Popcorn Time primary links

Set the optional server-only `POPCORNTIME_API_KEY` to use the documented
[developer API](https://docs.popcorntime.app/developers/introduction/). Without it,
the app uses Wikidata directly. The API key is sent only as an Authorization
header to `https://api.popcorntime.app`; redirects on authenticated requests are
rejected. There is no browser-visible key, page scraping, token decryption or
collection of final redirect destinations.

1. Search the TMDB title in the selected country and movie/TV namespace, with a
   maximum of three candidates. Name matching alone never establishes identity.
2. Read candidate media details and require a single exact `tmdb` external ID,
   the expected content type and the same candidate ID. Conflicting or missing
   identity data retains the fallback. The documented API does not expose a
   direct TMDB lookup route; only verified search results are accepted.
3. Read that media item's links and the selected country's provider registry.
   Match registry names to a provider in the same TMDB country and offer group.
   Explicit aliases cover Prime Video and Apple's store/subscription naming.
   Unknown names, ambiguous matches, channel add-ons and child providers are
   skipped. Ad tiers do not inherit base-service aliases.
4. Accept only validated base58 tokens, supported offer types and web-compatible
   links whose availability dates allow use today. An expiry date equal to today
   is excluded conservatively. Unsupported combined/cinema/FAST offer types are
   not inferred as subscription or free offers. Duplicate quality rows sharing
   a token are collapsed; conflicting tokens for one provider/offer are skipped.
5. Link to `https://popcorntime.app/go/{token}?platform=web`, as described in the
   [redirect documentation](https://docs.popcorntime.app/developers/link-tokens/).
   Only an exact provider/country/offer match takes precedence over Wikidata.

Successful title lookups (including ordinary no-match results) revalidate after
15 minutes and expire after one hour. Country provider registries revalidate
daily and expire after two days. Both use remote caching. HTTP/network/JSON
failures escape the cached functions and are handled outside; there are no
automatic retries. The search/detail/link sequence shares a four-second deadline,
and the parallel registry request has its own four-second deadline. Logs never
include response bodies or credentials. At most six API calls are needed on a
fully cold lookup, including up to three identity checks; cached registries and
title results reduce repeat calls. The documented 60 requests/minute account
limit can still produce 429s on bursts; these fall back without retrying.

Availability streams immediately with labelled TMDB links, independently of
both optional sources. Country changes perform a server refresh; Popcorn Time
links from the previous country cannot be reused while new data arrives. The
source credit reflects only links actually displayed. `/credits` also explains
Popcorn Time's provider redirects and potential affiliate attribution.

### Access and live verification — 2026-11-04

The developer API needs an account/key and permission for this project's usage.
The public [snapshot licence summary](https://docs.popcorntime.app/developers/snapshots/)
describes non-commercial use and a separate commercial licence, but does not
establish the complete terms for this API integration. The general website terms
contain restrictions. Review the applicable account/API agreement before enabling
the key; this PR does not claim a full licence review or TMDB endorsement. Keep
the existing TMDB/JustWatch attribution and any required commercial licences.

No Popcorn Time key was available in the managed workspace, and its API host was
not in the outbound allowlist. Live requests and redirect destinations were not
verified. Tests use the documented request/response contract and mocked failures.
Before marking the integration ready:

- Confirm the configured API host, `external_ids` source labels, provider names,
  response envelopes, date formats and redirect route against live responses.
- Test `movie/1051896` (Arcadian), `movie/1284041` (The Last House), and a TV title
  in Sweden and another supported country; verify correct work, market and offer.
- Confirm actual provider coverage, attribution, cache/retention rules and token
  lifetime with the applicable account. Never copy tokens into public fixtures.
- Confirm missing/disabled credentials and service failures leave Wikidata and
  TMDB options usable, including after changing countries.

## Wikidata fallback flow and coverage

1. Fetch `/{movie|tv}/{id}/external_ids` through the existing authenticated TMDB
   client. Accept only an exact Wikidata `Q` identifier; never match titles by name.
2. Read claims using Wikidata's `wbgetentities` API with an identifying User-Agent
   and `maxlag=5`. No provider or TMDB web pages are scraped.
3. Construct a URL from an allowlisted property, validated identifier, and fixed
   HTTPS provider origin. No URL templates or arbitrary URLs are executed from
   Wikidata data. Only unqualified, non-deprecated, unambiguous identifiers are
   used; preferred statements take precedence over normal statements.
4. Select the link only for an exact TMDB provider ID and supported offer type.
   Channel bundles and ad tiers retain the fallback unless explicitly supported.

| Provider | Wikidata properties | TMDB provider IDs | Supported offers | Markets |
| --- | --- | --- | --- | --- |
| Netflix | [P1874](https://www.wikidata.org/wiki/Property:P1874) | 8 | Subscription | Where TMDB reports it |
| Disney+ | [P13902](https://www.wikidata.org/wiki/Property:P13902) | 337 | Subscription | Where TMDB reports it |
| Apple TV | [P9586](https://www.wikidata.org/wiki/Property:P9586) (movie), [P9751](https://www.wikidata.org/wiki/Property:P9751) (TV) | 350 (subscription), 2 (store) | Subscription; store rental/purchase | Where TMDB reports it |
| Hulu | [P6466](https://www.wikidata.org/wiki/Property:P6466) (movie), [P6467](https://www.wikidata.org/wiki/Property:P6467) (TV) | 15 | Subscription | US only |
| Amazon | [P8055](https://www.wikidata.org/wiki/Property:P8055) | 9 (subscription), 10 (store) | Subscription; store rental/purchase | US only: P8055 describes the US catalogue |

Disney uses current `entity-…` browse IDs, not the legacy movie/series IDs or
collection `page-…` IDs. Within the Wikidata fallback, other services, unsupported markets, missing Wikidata
items, malformed/qualified/conflicting identifiers, and API failures all keep
explicitly labelled TMDB watch links. Free and ad-supported availability remains
visible with the same fallback. Coverage is incomplete: the property examples
are useful validation cases, not a measured catalogue-wide coverage percentage.

One hourly external-ID response cache serves both the IMDb and Wikidata readers,
tagged with the title's details tag and, for TV, the existing IMDb-ID tag.
Wikidata links revalidate daily with a seven-day maximum lifetime. Failures are
caught outside the cached functions. The Wikidata request has a three-second
abort timeout. Availability and labelled TMDB watch options render as soon as
the provider lookup completes; a nested Suspense boundary streams in direct
links independently, so even a slow external-ID lookup cannot delay availability. Restricted deployments must allow `www.wikidata.org`.

## TMDB policy review — 2026-11-01

Reviewed the official public documentation:

- [Movie watch providers](https://developer.themoviedb.org/reference/movie-watch-providers)
  and [TV watch providers](https://developer.themoviedb.org/reference/tv-series-watch-providers)
  require attribution to JustWatch. They describe the returned TMDB watch URL as
  an available way to reach deep links; they do not state that every provider
  button must open TMDB.
- [TMDB FAQ](https://developer.themoviedb.org/docs/faq) requires an approved TMDB
  logo and the non-endorsement notice in an About/Credits section. The existing
  logo is retained, the footer uses TMDB's spelling, and `/credits` contains the
  logo and required notice. JustWatch attribution appears alongside availability.
- The FAQ describes free API access as non-commercial. Commercial use still
  requires an appropriate TMDB licence; this change does not establish the
  account's commercial licensing status.
- [Movie external IDs](https://developer.themoviedb.org/reference/movie-external-ids)
  and [TV external IDs](https://developer.themoviedb.org/reference/tv-series-external-ids)
  document Wikidata IDs as supported external identifiers.

Implementation assessment: direct links derived independently from Wikidata are
consistent with the retrieved public watch-provider and attribution documentation.
The UI preserves a separate, visible title-specific TMDB watch link even when all
provider buttons link directly, credits JustWatch via TMDB, and adds Wikidata
credit when its identifiers are used. This is an assessment of those documented
requirements, not a claim of TMDB endorsement or a complete legal determination.

Verification limit: the full [TMDB API Terms of Use](https://www.themoviedb.org/api-terms-of-use)
page could not be retrieved because the browsing service reports it blocked by
robots.txt. Its current full text and any account-specific agreement therefore
remain unverified. The public developer documentation must not be represented as
an exhaustive review of that contract.

## Wikidata usage

Wikidata's [structured data is CC0](https://www.wikidata.org/wiki/Wikidata:Licensing).
The app nevertheless credits Wikidata next to direct links and on `/credits`.
The server sends an identifying User-Agent with the repository URL, follows the
[User-Agent policy](https://foundation.wikimedia.org/wiki/Policy:User-Agent_policy),
uses a bounded read-only API request and respects overload responses by falling
back without immediate retries. See [Wikidata data access](https://www.wikidata.org/wiki/Wikidata:Data_access).

Live Wikidata API calls were not exercised in the managed workspace because
`www.wikidata.org` is not in its outbound policy. Provider formats were checked
against the property documentation; parser, server-fetch and UI behavior are
covered with fixtures and mocked upstream failures.

Live TMDB spot checks on 2026-11-01 confirmed `tv/66732` (Stranger Things) maps
to `Q19798734`, `movie/862` (Toy Story) to `Q171048`, and `tv/97546` (Ted Lasso)
to `Q96407897`. The corresponding Netflix, Disney browse and Apple TV property
examples were checked against Wikidata's published property documentation.
