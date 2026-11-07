import { z } from 'zod';

import type { WatchOfferType } from '@/types/watch-provider';

type ProviderRule = {
  id: number;
  types: WatchOfferType[];
  regions?: string[];
  excludeRegions?: string[];
};
const streaming: WatchOfferType[] = ['flatrate'];
const store: WatchOfferType[] = ['rent', 'buy'];

// Exact registry names only. Never infer identity from a slug, logo, fuzzy name,
// or a parent provider: channels and subscription bundles are separate products.
const rules: Record<string, ProviderRule[]> = {
  Netflix: [{ id: 8, types: streaming }],
  'Disney+': [{ id: 337, types: streaming }],
  'Disney Plus': [{ id: 337, types: streaming }],
  Hulu: [{ id: 15, types: streaming, regions: ['US'] }],
  'Apple TV+': [{ id: 350, types: streaming }],
  'Apple TV Store': [{ id: 2, types: store }],
  iTunes: [{ id: 2, types: store }],
  'Amazon Prime Video': [
    { id: 9, types: streaming, regions: ['US'] },
    { id: 119, types: streaming, excludeRegions: ['US'] },
  ],
  'Amazon Video': [{ id: 10, types: store }],
  Viaplay: [{ id: 76, types: [...streaming, ...store] }],
  'Rakuten TV': [{ id: 35, types: store }],
  Blockbuster: [{ id: 423, types: store }],
  'SF Anytime': [{ id: 426, types: store }],
  'SVT Play': [{ id: 493, types: ['free'] }],
  'TV4 Play': [{ id: 1944, types: ['flatrate', 'free', 'ads'] }],
  'HBO Max': [{ id: 1899, types: streaming }],
  Plex: [{ id: 538, types: ['free', 'ads'] }],
};

const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  parent_id: z.string().nullable(),
  country: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
});

export function mapProviders(rows: Iterable<unknown>, region: string) {
  const mapped = new Map<string, ProviderRule[]>();
  const names = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const value of rows) {
    const row = providerSchema.parse(value);
    if (row.parent_id !== null || (row.country !== null && row.country !== region)) continue;
    if (names.has(row.id) && names.get(row.id) !== row.name) ambiguous.add(row.id);
    names.set(row.id, row.name);
    const candidates = (rules[row.name] ?? []).filter(
      (rule) =>
        (!rule.regions || rule.regions.includes(region)) && !rule.excludeRegions?.includes(region),
    );
    mapped.set(row.id, candidates);
  }
  for (const id of ambiguous) mapped.delete(id);
  return mapped;
}
