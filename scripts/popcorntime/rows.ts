import type { popcorntimeLinks } from '@movies/db/schema/popcorntime';
import { z } from 'zod';

import { popcorntimeTokenSchema } from '@/lib/popcorntime-contract';
import type { WatchOfferType } from '@/types/watch-provider';

import type { mapProviders } from './providers';

export type ImportedLink = typeof popcorntimeLinks.$inferInsert;
type MediaIdentity = { tmdbId: number; mediaType: 'movie' | 'tv' };

const mediaSchema = z.object({
  id: z.string().min(1),
  tmdb_id: z.string().nullable(),
  content_type: z.string().nullable(),
});

/** Conflicting crosswalks are unusable, including movie/TV collisions. */
export function mapMedia(rows: Iterable<unknown>) {
  const identities = new Map<string, MediaIdentity>();
  const ambiguous = new Set<string>();
  for (const value of rows) {
    const row = mediaSchema.parse(value);
    if (row.tmdb_id === null || !['movie', 'tv_show'].includes(row.content_type ?? '')) continue;
    const tmdbId = z.coerce.number().int().positive().max(2_147_483_647).parse(row.tmdb_id);
    const identity: MediaIdentity = {
      tmdbId,
      mediaType: row.content_type === 'movie' ? 'movie' : 'tv',
    };
    const prior = identities.get(row.id);
    if (prior && (prior.tmdbId !== tmdbId || prior.mediaType !== identity.mediaType))
      ambiguous.add(row.id);
    identities.set(row.id, identity);
  }
  for (const id of ambiguous) identities.delete(id);
  return identities;
}

const nullableDate = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.iso.date().nullable(),
);
const linkSchema = z.object({
  media_id: z.string(),
  provider_id: z.string(),
  addon_provider_id: z.string().nullable(),
  season_number: z.number().int().nullable(),
  episode_number: z.number().int().nullable(),
  link_token: popcorntimeTokenSchema,
  price_types: z.array(z.string()).nullable(),
  available_from: nullableDate,
  available_to: nullableDate,
});

type LinkContext = {
  region: string;
  media: ReturnType<typeof mapMedia>;
  providers: ReturnType<typeof mapProviders>;
};

function parseLink(value: unknown, context: LinkContext): ImportedLink[] {
  const row = linkSchema.parse(value);
  // Detail pages represent entire works, never a selected season/episode or add-on.
  if (row.addon_provider_id !== null || row.season_number !== null || row.episode_number !== null)
    return [];
  const media = context.media.get(row.media_id);
  if (!media) return [];
  if (row.available_from && row.available_to && row.available_from >= row.available_to) {
    throw new Error('Popcorn Time link has an invalid availability interval');
  }
  return (context.providers.get(row.provider_id) ?? []).flatMap((rule) =>
    rule.types
      .filter((type) => row.price_types?.includes(type))
      .map((offerType: WatchOfferType) => ({
        ...media,
        region: context.region,
        providerId: rule.id,
        offerType,
        linkToken: row.link_token,
        availableFrom: row.available_from,
        availableTo: row.available_to,
      })),
  );
}

/** Keep one unambiguous destination per TMDB work, country, provider and offer. */
export async function collectLinks(batches: AsyncIterable<unknown[]>, context: LinkContext) {
  const links = new Map<string, ImportedLink>();
  const ambiguous = new Set<string>();
  let total = 0;
  for await (const batch of batches) {
    for (const row of batch) {
      total++;
      for (const link of parseLink(row, context)) {
        const key = `${link.mediaType}/${link.tmdbId}/${link.providerId}/${link.offerType}`;
        const prior = links.get(key);
        if (
          prior &&
          (prior.linkToken !== link.linkToken ||
            prior.availableFrom !== link.availableFrom ||
            prior.availableTo !== link.availableTo)
        )
          ambiguous.add(key);
        links.set(key, link);
      }
    }
  }
  for (const key of ambiguous) links.delete(key);
  if (links.size === 0)
    throw new Error(
      `Popcorn Time ${context.region}: no supported, unambiguous links in ${total} rows`,
    );
  return { links: [...links.values()], total, ambiguous: ambiguous.size };
}
