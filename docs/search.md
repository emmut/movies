# Search retrieval

The local catalog uses PostgreSQL 16 with `pg_trgm` and built-in full-text
search. No new extension or external search service is required.

Three GIN-backed candidate scans cover different input:

- Whole-title trigram similarity handles misspellings such as `intersteller`.
- Word similarity finds approximate fragments inside longer titles.
- `to_tsvector('simple', search_title)` matches every query word in any order,
  treating the final word as a prefix: `rings fellowship` and `fellowship rin`
  both find *The Lord of the Rings: The Fellowship of the Ring*.

The `simple` dictionary keeps names and words such as “the”; matching uses the
same case, accent and punctuation folding as ingest. User input is normalized
before constructing a parameterized `tsquery`, so search operators in input
are treated as punctuation.

Each scan keeps 40 candidates. Equal trigram distances use popularity before
the cutoff, with media type and id providing deterministic ties. The word scan
also protects exact titles from the cutoff. Candidates are deduplicated and
ordered by exact title, then coverage of all query words, then the existing
similarity/prefix/popularity score. Complete word matches survive even if a
long title dilutes their trigram similarity below the fuzzy threshold.

The existing 1.5-second statement timeout, connection deadline, media filters,
TMDB fallback, page-one merging and hydration limits still apply. The palette
consults the local index only when TMDB returns nothing.

## Migration and validation

Run `pnpm db:migrate` to apply `0019_search_title_words`. It adds an expression
GIN index over existing titles; no backfill, title rewrite or re-ingest is needed.
The ordinary index build runs in the migration transaction and blocks writes
to `search_index` while it builds, so schedule it outside the nightly ingest.
Allow disk space for the additional index.

Run the database regressions against a migrated test database:

```sh
SEARCH_TEST_DATABASE_URL="$DATABASE_URL" pnpm test apps/web/src/lib/search-index.integration.test.ts
```

Fixtures live in a temporary table. Tests cover typos through the page and
palette, reordered words, partial words, accents, exact-title priority,
candidate cutoff ties, deduplication, unrelated input, media filters, index
eligibility and server cancellation. These fixtures verify correctness;
full-catalog latency and index size still need measurement on the deployment.

## Extension assessment (November 2026)

| Option | Fit for this app |
| --- | --- |
| [PlanetScale TIN](https://planetscale.com/blog/introducing-tin) | Supports BM25, fuzzy terms and wildcard queries. The production implementation is offered on PlanetScale. Its public [Lead substitute](https://planetscale.com/blog/introducing-lead) is for development/CI and performs full table scans; it is unsuitable for this catalog in production. |
| [ParadeDB `pg_search`](https://github.com/paradedb/paradedb) | A portable, AGPL-3.0 extension with BM25 and [fuzzy matching](https://www.paradedb.com/blog/v2api). A candidate if search requirements outgrow the current implementation, but it needs server installation and deployment/CI image changes; it is not included in the stock `postgres:16` image used here. |
| [`pg_trgm`](https://www.postgresql.org/docs/16/pgtrgm.html) + [built-in text search](https://www.postgresql.org/docs/16/textsearch-controls.html) | Already compatible with the current database. Trigrams handle typos, while indexed word matching covers reordered terms and final-word autocomplete without changing providers. This is the implemented choice. |

TIN benchmark results are vendor measurements on document corpora, not
measurements of this app's short-title catalog.
