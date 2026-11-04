import { z } from 'zod';

import type { PopcornTimeAvailability, StreamingOffer } from '@/types/watch-provider';

const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  parent_id: z.string().min(1).nullable(),
  logo: z.string().nullish(),
});
const offerTypeSchema = z.enum([
  'flatrate',
  'rent',
  'buy',
  'free',
  'ads',
  'cinema',
  'fast',
  'flatrate_and_buy',
]);
const linkSchema = z.object({
  provider_id: z.string().min(1),
  addon_provider_id: z.string().min(1).nullable(),
  link_token: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{16,4096}$/),
  price_types: z.array(z.string()).nullable(),
  available_from: z.iso.date().nullish(),
  available_to: z.iso.date().nullish(),
});
type Provider = z.infer<typeof providerSchema>;

function safeLogo(value: string | null | undefined) {
  const parsed = z.url().safeParse(value);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
}

function getRegistry(providerData: unknown, region: string) {
  const registry = z
    .object({ country: z.literal(region), providers: z.array(z.unknown()) })
    .safeParse(providerData);
  if (!registry.success) return null;
  const entries = new Map<string, Provider[]>();
  for (const raw of registry.data.providers) {
    const result = providerSchema.safeParse(raw);
    if (result.success) {
      const provider = result.data;
      entries.set(provider.id, [...(entries.get(provider.id) ?? []), provider]);
    }
  }
  return new Map(
    [...entries].flatMap(([id, providers]) =>
      providers.length === 1 ? [[id, providers[0]] as const] : [],
    ),
  );
}

function isAvailable(link: z.infer<typeof linkSchema>, today: string) {
  return (
    (link.available_from == null || link.available_from <= today) &&
    (link.available_to == null || link.available_to > today)
  );
}

/** Resolve both channel encodings: a child provider, or an explicit host/add-on pair. */
function getProviderContext(link: z.infer<typeof linkSchema>, registry: Map<string, Provider>) {
  const listed = registry.get(link.provider_id);
  if (!listed) return null;
  const provider = link.addon_provider_id ? registry.get(link.addon_provider_id) : listed;
  if (!provider) return null;
  const hostId = link.addon_provider_id ? listed.id : provider.parent_id;
  if (hostId === null) return { provider, host: null };
  const host = registry.get(hostId);
  if (!host || host.id === provider.id) return null;
  if (provider.parent_id !== null && provider.parent_id !== host.id) return null;
  return { provider, host };
}

function getOffers(raw: unknown, registry: Map<string, Provider>, today: string): StreamingOffer[] {
  const parsed = linkSchema.safeParse(raw);
  if (!parsed.success || !isAvailable(parsed.data, today)) return [];
  const link = parsed.data;
  const context = getProviderContext(link, registry);
  if (!context) return [];
  const { provider, host } = context;
  const types = link.price_types?.length ? link.price_types : ['other'];
  return types.map((value) => {
    const type = offerTypeSchema.safeParse(value);
    return {
      providerId: `popcorntime:${host?.id ?? ''}:${provider.id}`,
      providerName: provider.name,
      via: host?.name ?? null,
      logo: safeLogo(provider.logo),
      type: type.success ? type.data : 'other',
      // The token itself represents a web URL; native-platform metadata is optional.
      url: `https://popcorntime.app/go/${link.link_token}`,
      source: 'popcorntime' as const,
      availabilitySource: 'popcorntime' as const,
    };
  });
}

/** Every registered provider is eligible; no TMDB IDs, names or service allowlist required. */
export function buildPopcornTimeAvailability(
  providerData: unknown,
  linkData: unknown,
  region: string,
  today: string,
): PopcornTimeAvailability {
  const registry = getRegistry(providerData, region);
  if (!registry || !Array.isArray(linkData)) return { region, offers: [] };
  const offers = new Map<string, StreamingOffer>();
  for (const raw of linkData) {
    for (const offer of getOffers(raw, registry, today)) {
      // Keep distinct valid editions/qualities; identical rows need only one card.
      const key = `${offer.providerId}:${offer.type}:${offer.url}`;
      offers.set(key, offer);
    }
  }
  return { region, offers: [...offers.values()] };
}
