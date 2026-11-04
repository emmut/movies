import { z } from 'zod';

import type { DirectWatchLink, RegionWatchProviders, WatchOfferType } from '@/types/watch-provider';

const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parent_id: z.string().nullable(),
});
const linkSchema = z.object({
  provider_id: z.string(),
  addon_provider_id: z.string().nullable(),
  link_token: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{16,4096}$/),
  price_types: z.array(z.string()).nullable(),
  platforms: z.array(z.string()).nullish(),
  available_from: z.iso.date().nullish(),
  available_to: z.iso.date().nullish(),
});

const offerTypes = ['flatrate', 'rent', 'buy', 'free', 'ads'] as const;
// Aliases apply only within the exact offer type and selected-region availability.
// Ad tiers and channel bundles deliberately do not share these aliases.
const aliases: Record<number, string[]> = {
  2: ['appletv', 'appletvstore', 'itunes'],
  9: ['amazonprimevideo', 'primevideo'],
  10: ['amazonvideo'],
  119: ['amazonprimevideo', 'primevideo'],
  350: ['appletv', 'appletvplus'],
};

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replaceAll('+', 'plus')
    .replace(/[^a-z0-9]/g, '');
}

function matchingProviderIds(name: string, type: WatchOfferType, providers: RegionWatchProviders) {
  const normalized = normalizeName(name);
  return (providers[type] ?? [])
    .filter((provider) =>
      [normalizeName(provider.provider_name), ...(aliases[provider.provider_id] ?? [])].includes(
        normalized,
      ),
    )
    .map((provider) => provider.provider_id);
}

function getProviderNames(providerData: unknown, region: string) {
  const registry = z
    .object({ country: z.literal(region), providers: z.array(z.unknown()) })
    .safeParse(providerData);
  if (!registry.success) return null;

  const names = new Map<string, string[]>();
  for (const raw of registry.data.providers) {
    const result = providerSchema.safeParse(raw);
    if (result.success && result.data.parent_id === null) {
      const { id, name } = result.data;
      names.set(id, [...(names.get(id) ?? []), name]);
    }
  }

  return names;
}

function isAvailable(link: z.infer<typeof linkSchema>, today: string) {
  return (
    (link.available_from == null || link.available_from <= today) &&
    (link.available_to == null || link.available_to > today)
  );
}

function getDirectOffer(raw: unknown, today: string) {
  const result = linkSchema.safeParse(raw);
  if (!result.success) return null;
  const link = result.data;
  if (link.addon_provider_id !== null || !isAvailable(link, today)) return null;
  if (link.platforms != null && !link.platforms.includes('web')) return null;
  return link;
}

function matchOffers(
  link: z.infer<typeof linkSchema>,
  name: string,
  providers: RegionWatchProviders,
  region: string,
): DirectWatchLink[] {
  return offerTypes.flatMap((type) => {
    if (!link.price_types?.includes(type)) return [];
    const ids = matchingProviderIds(name, type, providers);
    if (ids.length !== 1) return [];
    return [
      {
        providerId: ids[0],
        regions: [region],
        types: [type],
        url: `https://popcorntime.app/go/${link.link_token}?platform=web`,
      },
    ];
  });
}

/** Match validated direct offers to TMDB availability, never to a similarly named channel. */
export function buildPopcornTimeWatchLinks(
  providerData: unknown,
  linkData: unknown,
  providers: RegionWatchProviders,
  region: string,
  today: string,
): DirectWatchLink[] {
  const names = getProviderNames(providerData, region);
  if (!names || !Array.isArray(linkData)) return [];
  const candidates = linkData.flatMap((raw) => {
    const link = getDirectOffer(raw, today);
    if (!link) return [];
    const providerNames = names.get(link.provider_id);
    return providerNames?.length === 1
      ? matchOffers(link, providerNames[0], providers, region)
      : [];
  });
  const matches = new Map<string, DirectWatchLink[]>();
  for (const candidate of candidates) {
    const key = `${candidate.providerId}:${candidate.types[0]}`;
    matches.set(key, [...(matches.get(key) ?? []), candidate]);
  }
  // Quality duplicates may share one token; different editions/tokens are ambiguous.
  return [...matches.values()].flatMap((candidates) =>
    new Set(candidates.map((candidate) => candidate.url)).size === 1 ? [candidates[0]] : [],
  );
}
