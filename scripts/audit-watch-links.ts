#!/usr/bin/env vpx

/** Read-only benchmark: vpx --env-file-if-exists=apps/web/.env scripts/audit-watch-links.ts SE [movie/1051896 ...]. */
import { z } from 'zod';

import {
  summarizeWatchLinkCoverage,
  type WatchLinkAuditRow,
} from '../apps/web/src/lib/watch-link-coverage';
import { getDirectWatchUrl } from '../apps/web/src/lib/watch-links';
import {
  canonicalWikidataItem,
  matchesWikidataIdentity,
  wikidataIdentitySearch,
} from '../apps/web/src/lib/wikidata-identity';
import { wikidataLinkRules } from '../apps/web/src/lib/wikidata-link-rules';
import { buildWikidataWatchLinks } from '../apps/web/src/lib/wikidata-watch-links';
import type { RegionWatchProviders, WatchOfferType } from '../apps/web/src/types/watch-provider';

const defaultTitles = [
  'movie/1051896',
  'movie/1284041',
  'movie/862',
  'movie/603',
  'movie/1233413',
  'tv/66732',
  'tv/97546',
  'tv/95396',
  'tv/76479',
];
const offerTypes: WatchOfferType[] = ['flatrate', 'rent', 'buy', 'free', 'ads'];
const itemIdSchema = z.string().regex(/^Q[1-9]\d*$/);

async function wikiRequest(params: Record<string, string>) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.search = new URLSearchParams({ ...params, format: 'json', maxlag: '5' }).toString();
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Movies/1.0 (https://github.com/emmut/movies; watch-link coverage audit)',
    },
    redirect: 'error',
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error(`Wikidata HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

type ExternalIds = { wikidata_id?: string | null; imdb_id: string | null };
type Title = {
  title?: string;
  name?: string;
  external_ids?: ExternalIds;
  'watch/providers'?: { results?: Record<string, RegionWatchProviders> };
};

async function findItem(type: 'movie' | 'tv', id: number, external: ExternalIds) {
  const parsed = itemIdSchema.safeParse(external.wikidata_id);
  if (parsed.success) return { id: parsed.data, reverse: false };
  const data = z
    .object({ query: z.object({ search: z.array(z.object({ title: itemIdSchema })) }) })
    .parse(
      await wikiRequest({
        action: 'query',
        list: 'search',
        srnamespace: '0',
        srsearch: wikidataIdentitySearch(type, id, external.imdb_id),
        srlimit: '2',
      }),
    );
  return data.query.search.length === 1 ? { id: data.query.search[0].title, reverse: true } : null;
}

async function entityClaims(id: string) {
  const entity = z
    .object({ entities: z.record(z.string(), z.unknown()), redirects: z.unknown().optional() })
    .parse(
      await wikiRequest({ action: 'wbgetentities', ids: id, props: 'claims', redirects: 'yes' }),
    );
  const canonical = canonicalWikidataItem(id, entity.redirects);
  return z.object({ claims: z.record(z.string(), z.unknown()) }).parse(entity.entities[canonical])
    .claims;
}

async function lookupClaims(type: 'movie' | 'tv', id: number, external: ExternalIds) {
  const item = await findItem(type, id, external);
  if (!item) return null;
  const claims = await entityClaims(item.id);
  return !item.reverse || matchesWikidataIdentity(claims, type, id, external.imdb_id)
    ? claims
    : null;
}

function failureReason(error: unknown) {
  if (error instanceof z.ZodError) return 'invalid_response';
  return error instanceof Error && /^Wikidata HTTP \d+$/.test(error.message)
    ? error.message
    : 'request_failed';
}

async function auditLookup(type: 'movie' | 'tv', id: number, external: ExternalIds) {
  try {
    const claims = await lookupClaims(type, id, external);
    return {
      claims,
      status: claims ? ('resolved' as const) : ('missing_item' as const),
      failure: undefined,
    };
  } catch (error) {
    return { claims: null, status: 'lookup_failed' as const, failure: failureReason(error) };
  }
}

function tmdbHeaders() {
  const token = process.env.MOVIE_DB_ACCESS_TOKEN;
  if (!token) throw new Error('MOVIE_DB_ACCESS_TOKEN is required');
  return { Authorization: `Bearer ${token}` };
}

async function fetchTitle(resource: string): Promise<Title> {
  const response = await fetch(
    `https://api.themoviedb.org/3/${resource}?append_to_response=external_ids,watch/providers`,
    {
      headers: tmdbHeaders(),
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error(`TMDB HTTP ${response.status}`);
  return response.json();
}

function resourceIdentity(resource: string) {
  const match = /^(movie|tv)\/([1-9]\d*)$/.exec(resource);
  if (!match) throw new Error('Use movie/123 or tv/123 resource arguments');
  return { type: match[1] as 'movie' | 'tv', id: Number(match[2]) };
}

function offerResults(
  providers: RegionWatchProviders | undefined,
  links: ReturnType<typeof buildWikidataWatchLinks>,
  region: string,
) {
  return offerTypes.flatMap((type) =>
    (providers?.[type] ?? []).map((provider) => ({
      providerId: provider.provider_id,
      providerName: provider.provider_name,
      type,
      direct: Boolean(getDirectWatchUrl(links, provider.provider_id, region, type)),
    })),
  );
}

function selectedProviders(title: Title, region: string) {
  return title['watch/providers']?.results?.[region];
}

function presentProperties(type: 'movie' | 'tv', claims: Record<string, unknown> | null) {
  const registered = new Set([
    ...wikidataLinkRules(type).map((rule) => rule.property),
    'P856',
    'P953',
    'P973',
  ]);
  return Object.keys(claims ?? {}).filter((key) => registered.has(key));
}

function titleLabel(title: Title, resource: string) {
  return title.title ?? title.name ?? resource;
}

async function auditTitle(resource: string, region: string) {
  const { type, id } = resourceIdentity(resource);
  const title = await fetchTitle(resource);
  const lookup = await auditLookup(type, id, title.external_ids ?? { imdb_id: null });
  const links = lookup.claims
    ? buildWikidataWatchLinks(lookup.claims, type, region, new Date().toISOString().slice(0, 10))
    : [];
  const row: WatchLinkAuditRow = {
    resource,
    title: titleLabel(title, resource),
    status: lookup.status,
    offers: offerResults(selectedProviders(title, region), links, region),
  };
  return {
    ...row,
    failure: lookup.failure,
    presentProperties: presentProperties(type, lookup.claims),
  };
}

function selectedResources() {
  const selected = [...new Set(process.argv.slice(3))];
  return z
    .array(z.string().regex(/^(movie|tv)\/[1-9]\d*$/))
    .max(30)
    .parse(selected.length ? selected : defaultTitles);
}

async function main() {
  const region = z
    .string()
    .regex(/^[A-Z]{2}$/)
    .parse((process.argv[2] ?? 'SE').toUpperCase());
  const rows = [];
  // Deliberately serial: a coverage audit should not burst Wikimedia's API.
  for (const resource of selectedResources()) rows.push(await auditTitle(resource, region));
  console.log(
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        region,
        summary: summarizeWatchLinkCoverage(rows),
        rows,
      },
      null,
      2,
    ),
  );
  if (rows.some((row) => row.status === 'lookup_failed')) process.exitCode = 2;
}

main().catch(() => {
  console.error(
    'Watch-link audit failed before coverage could be measured. Check credentials, resource arguments and network access.',
  );
  process.exitCode = 1;
});
