import { wikidataLinkRules } from '@/lib/wikidata-link-rules';
import { uniqueWikidataValue, wikidataStatements } from '@/lib/wikidata-statements';
import { wikidataUrlLinks } from '@/lib/wikidata-url-links';
import type { DirectWatchLink } from '@/types/watch-provider';

/** Regional availability comes from TMDB; all destinations come from this exact Wikidata item. */
export function buildWikidataWatchLinks(
  claims: Record<string, unknown>,
  type: 'movie' | 'tv',
  region: string,
  today: string,
): DirectWatchLink[] {
  const identifiers = wikidataLinkRules(type).flatMap((rule) => {
    if (rule.regions && !rule.regions.includes(region)) return [];
    const value = uniqueWikidataValue(
      wikidataStatements(claims[rule.property], 'external-id', region, today),
    );
    const id = rule.schema.safeParse(value);
    if (!id.success) return [];
    return rule.providerIds.map((providerId) => ({
      providerId,
      url: `${rule.prefix}${id.data}${rule.suffix ?? ''}`,
      types: rule.types,
      regions: [region],
    }));
  });
  // Structured IDs take precedence; reviewed official URLs fill each remaining provider/offer.
  return [...identifiers, ...wikidataUrlLinks(claims, type, region, today)];
}
