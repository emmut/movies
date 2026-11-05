import { wikidataLinkRules } from '@/lib/wikidata-link-rules';
import {
  hasConflictingWikidataValues,
  uniqueWikidataValue,
  wikidataStatements,
} from '@/lib/wikidata-statements';
import { wikidataUrlLinks } from '@/lib/wikidata-url-links';
import type { DirectWatchLink } from '@/types/watch-provider';

type Rule = ReturnType<typeof wikidataLinkRules>[number];

function identifierLinks(
  rule: Rule,
  claims: Record<string, unknown>,
  region: string,
  today: string,
) {
  if (rule.regions && !rule.regions.includes(region)) return { links: [], conflicts: [] };
  const statements = wikidataStatements(claims[rule.property], 'external-id', region, today);
  if (hasConflictingWikidataValues(statements)) {
    return {
      links: [],
      conflicts: rule.providerIds.flatMap((id) => rule.types.map((offer) => `${id}:${offer}`)),
    };
  }
  const id = rule.schema.safeParse(uniqueWikidataValue(statements));
  if (!id.success) return { links: [], conflicts: [] };
  return {
    conflicts: [],
    links: rule.providerIds.map((providerId) => ({
      providerId,
      url: `${rule.prefix}${id.data}${rule.suffix ?? ''}`,
      types: rule.types,
      regions: [region],
    })),
  };
}

/** Regional availability comes from TMDB; all destinations come from this exact Wikidata item. */
export function buildWikidataWatchLinks(
  claims: Record<string, unknown>,
  type: 'movie' | 'tv',
  region: string,
  today: string,
): DirectWatchLink[] {
  const results = wikidataLinkRules(type).map((rule) =>
    identifierLinks(rule, claims, region, today),
  );
  const conflicts = new Set(results.flatMap((result) => result.conflicts));
  const candidates = [
    ...results.flatMap((result) => result.links),
    ...wikidataUrlLinks(claims, type, region, today),
  ];
  // A URL fallback must never resurrect an edition rejected for conflicting identifiers.
  return candidates.flatMap((link) => {
    const types = link.types.filter((offer) => !conflicts.has(`${link.providerId}:${offer}`));
    return types.length ? [{ ...link, types }] : [];
  });
}
