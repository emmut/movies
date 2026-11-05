# Direct provider title links

TMDB/JustWatch determines which services and offers are available in the selected
country. Wikidata supplies optional provider title identifiers and official title
URLs. No additional account or API key is required. A title link never creates
an availability or subscription claim: the UI uses it only for the matching TMDB
provider, country and offer type, and always retains a labelled TMDB fallback.

## Resolution and coverage

1. Fetch TMDB's `/{movie|tv}/{id}/external_ids` using the existing client and use
   its exact Wikidata `Q` identifier.
2. If that identifier is absent/invalid, use Wikidata's Action API search with
   `haswbstatement:P4947={id}` for movies or `haswbstatement:P4983={id}` for TV.
   Read at most two results. Require exactly one candidate and verify its claims
   contain a unique exact ID in the correct namespace before using it. Never
   match titles by name or assume a movie/TV ID is interchangeable. This is a
   read-only lookup; it does not add or edit Wikidata statements.
3. Fetch the item's claims with `wbgetentities`, an identifying User-Agent and
   `maxlag=5`. Resolve every reviewed provider property listed below. Current
   international Prime Video IDs and GTIs precede the US-only Amazon ASIN.
4. Fill remaining provider links from `official website` (P856), `full work
   available at URL` (P953), and `described at URL` (P973). Accept only reviewed
   provider hosts and title paths in `wikidata-url-links.ts`. A generic homepage,
   person, category, search or account page is not a title destination. Runtime
   property formatter URLs, arbitrary hosts and reference URLs are never used.
5. Evaluate supported country and time qualifiers before rank selection. An
   applicable local statement takes precedence over an unqualified one;
   preferred rank then takes precedence over normal rank. Conflicting remaining
   values abstain for that provider. Language/name annotations are accepted;
   multiple different identifiers still abstain. Unknown qualifiers, unknown
   country IDs, non-Gregorian/imprecise dates, deprecated and non-value statements
   retain the fallback. Start dates are inclusive; end dates are conservatively
   exclusive. Dates are evaluated outside the raw-claims cache on every lookup.
6. Construct HTTPS URLs from validated IDs and fixed prefixes, or retain the
   reviewed provider URL with tracking/query/fragment data removed. Only required
   Google Play/YouTube identifiers and the documented Plex fragment are retained.
   Reject credentials, non-standard ports, unsafe schemes, routing escapes and
   encoded separators. ISO country prefixes on Apple, Rakuten, SkyShowtime and
   Paramount URLs, and country-specific Viaplay hosts, constrain the destination.
7. Return links scoped to the selected country. Changing countries refreshes the
   server section; stale links cannot be used in the new country. TMDB options
   render before Wikidata settles, so optional lookups do not delay availability.

The registry covers **65 current TMDB provider IDs/variants**, checked against
TMDB's movie/TV provider catalogues on 2026-11-05. It has **35 dedicated external-ID
properties**, plus the three URL properties. This is implementation coverage,
not a measured title-level success rate. Provider additions require a reviewed
property/domain rule and a fixture. Wikidata remains incomplete, and not every
streaming service has an identifier property or a title URL on every item.

### Dedicated identifier properties

Unless a market is explicitly listed, the title identity can be used where TMDB
reports the matching offer. Provider pages may require login, payment or a local
account. Regional availability remains TMDB's responsibility.

| Service | Wikidata properties | TMDB provider IDs | Offer / market restrictions |
| --- | --- | --- | --- |
| Netflix, Kids, Standard with Ads | [P1874](https://www.wikidata.org/wiki/Property:P1874) | 8, 175, 1796 | Subscription; no channel bundles |
| Disney+ | [P13902](https://www.wikidata.org/wiki/Property:P13902) | 337, 122 | Current `entity-…` browse IDs only; legacy P7595/P7596 and collection `page-…` IDs are excluded |
| Apple TV / Store | [P9586](https://www.wikidata.org/wiki/Property:P9586), [P9751](https://www.wikidata.org/wiki/Property:P9751), [P6398](https://www.wikidata.org/wiki/Property:P6398) | 350, 2 | Subscription and store rental/purchase stay separate; iTunes movie ID is a US-only store fallback |
| Hulu | [P6466](https://www.wikidata.org/wiki/Property:P6466), [P6467](https://www.wikidata.org/wiki/Property:P6467) | 15 | US subscription; movie/series namespaces stay separate |
| Prime Video / Amazon Video | [P14440](https://www.wikidata.org/wiki/Property:P14440), [P14462](https://www.wikidata.org/wiki/Property:P14462), [P8055](https://www.wikidata.org/wiki/Property:P8055) | 9, 119, 2100, 613; store 10 | International ID / GTI first; ASIN P8055 only in US. Subscription/free/ads versus store rent/buy remain separate |
| HBO Max | [P8298](https://www.wikidata.org/wiki/Property:P8298) | 1899 | Movie/show UUIDs and exact work-level legacy feature/series URNs; no season/episode IDs |
| MUBI | [P7299](https://www.wikidata.org/wiki/Property:P7299) | 11 | Standalone film/TV title pages; no Amazon channel substitution |
| Tubi | [P7760](https://www.wikidata.org/wiki/Property:P7760), [P7761](https://www.wikidata.org/wiki/Property:P7761) | 73 | Free/ads; movie/series namespaces stay separate |
| Peacock | [P11815](https://www.wikidata.org/wiki/Property:P11815) | 386, 387 | US; movie/TV paths stay separate |
| Paramount+ | [P13147](https://www.wikidata.org/wiki/Property:P13147) | 531, 2303, 2304, 2616 | This video property is used only for US movies, never whole TV series; exact series URLs can fill TV links |
| SVT Play | [P6817](https://www.wikidata.org/wiki/Property:P6817) | 493 | Sweden; title slugs only, excluding categories and people |
| NRK TV | [P9979](https://www.wikidata.org/wiki/Property:P9979) | 442 | Norway; whole series/programme pages, excluding season/episode suffixes |
| Yle Areena | [P3414](https://www.wikidata.org/wiki/Property:P3414) | 323 | Finland |
| Filmstriben | [P8928](https://www.wikidata.org/wiki/Property:P8928) | 443 | Denmark; films only |
| Rakuten Viki | [P10344](https://www.wikidata.org/wiki/Property:P10344) | 344 | Movie/TV paths only; excludes celebrities |
| Plex | [P11460](https://www.wikidata.org/wiki/Property:P11460) | 538 | Free/ads; documented media-key fragment, not a fabricated watch.plex.tv slug |
| Fandango at Home / Free | [P7334](https://www.wikidata.org/wiki/Property:P7334) | 7, 332 | US; store rent/buy versus free/ads |
| Kanopy | [P7985](https://www.wikidata.org/wiki/Property:P7985) | 191 | Free/subscription; library access may be required |
| Hoopla | [P5680](https://www.wikidata.org/wiki/Property:P5680) | 212 | Free/subscription; library access may be required |
| BBC iPlayer | [P827](https://www.wikidata.org/wiki/Property:P827) | 38 | UK; BBC programme title page, or exact iPlayer title URL |
| Crunchyroll | [P11330](https://www.wikidata.org/wiki/Property:P11330) | 283 | Current series-page ID, including films catalogued on those pages; deprecated P4110 is excluded |
| RaiPlay | [P11119](https://www.wikidata.org/wiki/Property:P11119) | 222 | Italy |
| U-NEXT | [P14567](https://www.wikidata.org/wiki/Property:P14567) | 84 | Japan |
| ABEMA | [P14599](https://www.wikidata.org/wiki/Property:P14599) | 1884 | Japan |
| FOD | [P14596](https://www.wikidata.org/wiki/Property:P14596) | 2683 | Japan |
| NFB | [P4606](https://www.wikidata.org/wiki/Property:P4606) | 441 | Film title pages; conflicting language/edition IDs retain fallback |
| Ivi | [P11682](https://www.wikidata.org/wiki/Property:P11682) | 113 | Work-level watch pages; provider availability still comes from TMDB |
| Okko | [P14727](https://www.wikidata.org/wiki/Property:P14727) | 115 | Films only |
| Brew | [P14403](https://www.wikidata.org/wiki/Property:P14403) | 2736 | Film title pages |

### Additional services through exact Wikidata URLs

These have explicit host/title-path rules. A link must already be stored on the
work's Wikidata item; the app does not invent a slug or search a provider website.
The same URL-property flow also covers alternate title URL shapes for the
identifier-backed services above.

| Service | TMDB provider IDs | Accepted destination / restrictions |
| --- | --- | --- |
| Google Play Movies | 3 | Movie details URL with required validated `id`; rent/buy only |
| YouTube / YouTube Free | 192, 235 | Movie `watch?v=…` URL in **P953 only**, free/ads; P1651 and ordinary URL claims often identify trailers and are excluded |
| Viaplay | 76 | Country-specific title/store pages; subscription and transactional paths stay separate |
| SF Anytime | 426 | Localized movie/TV title paths; rent/buy |
| Rakuten TV | 35 | Country-specific movie/TV title paths; never another country's URL |
| TV4 Play | 1944 | Swedish programme title IDs |
| Cineasterna | 496 | Swedish title pages |
| SkyShowtime | 1773 | Country-specific movie/TV title pages |
| ITVX / Premium | 41, 2300 | UK watch-title paths |
| Channel 4 / Plus | 103, 2311 | UK programme title pages |
| BFI Player | 224 | UK subscription versus rental title paths; no channel substitution |
| ARTE | 234 | Localized video title IDs |
| DRTV | 620 | Danish programme/series title pages |
| Filmin / Plus | 63, 64 | Spain/Portugal title pages, with country and film/series paths preserved |
| Curiosity Stream | 190 | Film video IDs versus TV series IDs |
| Shudder | 99 | Standalone movie/series watch pages; no channel substitution |
| Kinopoisk | 117 | Exact streaming title URLs on hd.kinopoisk.ru; public database IDs are not converted into streaming UUIDs |
| Vimeo | 2529 | On Demand title pages for rent/buy, or movie video pages explicitly identified as the full work by P953; ordinary clip/trailer IDs are excluded |
| Criterion Channel | 258 | US/Canada film slugs; generic site routes excluded; Criterion Collection disc/catalogue IDs do not imply a Channel stream |

### Known limits

- All TMDB offers remain visible, including providers without usable Wikidata
  data. Those buttons explicitly open the title's TMDB watch-options page.
- A standalone service ID never grants a link for its Amazon, Apple or Roku
  channel bundle. Those need a destination on the actual channel host. The
  registry does not pretend a standalone subscription uses that entitlement.
- URLs and identifiers are validated structurally, not playback-tested on each
  request. Provider redirects, account requirements, retired identifiers and
  regional catalogue differences can still affect the landing page.
- Database-only identifiers are not assumed to be streaming IDs. For example,
  Kinopoisk P2603 cannot generate a streaming UUID, and Criterion Collection IDs
  do not identify Criterion Channel streams. Megogo P2826 was reviewed but has
  no matching provider in the current TMDB registry, so it cannot establish an
  offer under this availability source.
- New provider properties and URL shapes need review; arbitrary runtime URL
  templates would allow unsafe destinations and incorrect provider mappings.
- Exact reverse search is bounded and can miss items whose TMDB statement is
  absent or not yet indexed. Ambiguous items retain fallback instead of guessing.

## Caching and operational behaviour

TMDB external IDs share the existing hourly response cache with the IMDb reader.
Wikidata claims and exact reverse lookups revalidate daily with a seven-day
maximum lifetime, using remote caching. Country/date filtering happens outside
that cache, so country changes reuse the same entity data and expired identifiers
are filtered against today's UTC date. HTTP/network/JSON/maxlag failures escape
the cache and are caught by the optional resolver; no immediate retries occur.
Requests use three-second deadlines, `redirect: error`, and `cache: no-store`
inside the remote-cache boundary. Restricted deployments need outbound HTTPS to
`www.wikidata.org`; there is no SPARQL endpoint or extra credential dependency.
An ordinary lookup needs one Wikidata request on a cold entity cache; a missing
TMDB Wikidata ID needs at most a reverse-search request and one entity request.

## Validation — 2026-11-05

Provider IDs were checked against the live authenticated TMDB movie/TV registry.
Property definitions, formatter URLs and examples were read from the Wikidata
pages linked above. Additional first-party route examples include
[Viaplay's Arcadian store page](https://viaplay.se/store/arcadian-2024),
[SF Anytime movie pages](https://www.sfanytime.com/sv/movie/results),
[TV4 Play programme pages](https://www.tv4play.se/program/251c6ee386132c89bd70/mollys-game),
[BFI subscription title pages](https://player.bfi.org.uk/subscription/film/watch-the-400-blows-1959-online),
and [Criterion Channel URLs stored on film items](https://www.wikidata.org/wiki/Q2479210).
The resolver has fixtures for every identifier-backed service and URL-only
service, with market, rank, date, ambiguity, malformed data, missing identities,
upstream failures, namespaces, source priority and fallback cases.

Live Wikidata Action API requests and provider playback were not exercised in
the managed workspace: `www.wikidata.org` is outside its outbound policy, and
attempts to inspect machine-readable data through the research browser failed.
The new rules do not establish a measured catalogue-wide coverage percentage.

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

Implementation assessment: direct links derived independently from Wikidata identifiers/official title URLs are
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
