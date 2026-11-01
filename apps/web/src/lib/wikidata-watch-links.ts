import { z } from 'zod';

import type { DirectWatchLink, WatchOfferType } from '@/types/watch-provider';

const statementSchema = z.object({
  rank: z.enum(['normal', 'preferred']),
  mainsnak: z.object({
    snaktype: z.literal('value'),
    datatype: z.literal('external-id'),
    datavalue: z.object({ value: z.string() }),
  }),
  qualifiers: z.record(z.string(), z.unknown()).optional(),
});

const uuid = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const appleId = /^umc\.cmc\.[a-z0-9]{22,25}$/;

type LinkRule = {
  property: string;
  providerIds: number[];
  types: WatchOfferType[];
  pattern: RegExp;
  prefix: string;
  regions?: string[];
};

function linkRules(type: 'movie' | 'tv'): LinkRule[] {
  return [
    {
      property: 'P1874',
      providerIds: [8],
      types: ['flatrate'],
      pattern: /^\d{6,8}$/,
      prefix: 'https://www.netflix.com/title/',
    },
    // Use the current browse identifier, not legacy Disney movie/series URLs.
    {
      property: 'P13902',
      providerIds: [337],
      types: ['flatrate'],
      pattern: new RegExp(`^entity-${uuid}$`),
      prefix: 'https://www.disneyplus.com/browse/',
    },
    {
      property: type === 'movie' ? 'P9586' : 'P9751',
      providerIds: [350],
      types: ['flatrate'],
      pattern: appleId,
      prefix: `https://tv.apple.com/${type === 'movie' ? 'movie' : 'show'}/`,
    },
    {
      property: type === 'movie' ? 'P9586' : 'P9751',
      providerIds: [2],
      types: ['rent', 'buy'],
      pattern: appleId,
      prefix: `https://tv.apple.com/${type === 'movie' ? 'movie' : 'show'}/`,
    },
    {
      property: type === 'movie' ? 'P6466' : 'P6467',
      providerIds: [15],
      types: ['flatrate'],
      pattern: new RegExp(`^${uuid}$`),
      prefix: `https://www.hulu.com/${type === 'movie' ? 'movie' : 'series'}/`,
      regions: ['US'],
    },
    // P8055 explicitly identifies Amazon's US catalogue. Never reuse it abroad.
    {
      property: 'P8055',
      providerIds: [9],
      types: ['flatrate'],
      pattern: /^B[0-9A-Z]{9}$/,
      prefix: 'https://www.amazon.com/gp/video/detail/',
      regions: ['US'],
    },
    {
      property: 'P8055',
      providerIds: [10],
      types: ['rent', 'buy'],
      pattern: /^B[0-9A-Z]{9}$/,
      prefix: 'https://www.amazon.com/gp/video/detail/',
      regions: ['US'],
    },
  ];
}

function getIdentifier(value: unknown, pattern: RegExp) {
  if (!Array.isArray(value)) {
    return;
  }
  const statements = value.flatMap((entry) => {
    const result = statementSchema.safeParse(entry);
    // Qualified identifiers may apply only in a market or time period. Leave
    // these to the fallback until those qualifiers are explicitly supported.
    if (!result.success || Object.keys(result.data.qualifiers ?? {}).length > 0) {
      return [];
    }
    return [result.data];
  });
  const preferred = statements.filter((statement) => statement.rank === 'preferred');
  const candidates = preferred.length > 0 ? preferred : statements;
  const identifiers = [
    ...new Set(candidates.map((statement) => statement.mainsnak.datavalue.value)),
  ];
  // Multiple conflicting IDs are ambiguous; do not pick an arbitrary edition.
  return identifiers.length === 1 && pattern.test(identifiers[0]) ? identifiers[0] : undefined;
}

/** Construct URLs only from allowlisted properties, validated IDs and fixed provider origins. */
export function buildWikidataWatchLinks(
  claims: Record<string, unknown>,
  type: 'movie' | 'tv',
): DirectWatchLink[] {
  return linkRules(type).flatMap((rule) => {
    const id = getIdentifier(claims[rule.property], rule.pattern);
    if (!id) {
      return [];
    }
    return rule.providerIds.map((providerId) => ({
      providerId,
      url: `${rule.prefix}${id}`,
      types: rule.types,
      regions: rule.regions,
    }));
  });
}
