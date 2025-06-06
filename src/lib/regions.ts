import { z } from 'zod';

export const regions = [
  { code: 'SE', name: 'Sweden' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
] as const;

export type RegionCode = (typeof regions)[number]['code'];
export type Region = (typeof regions)[number];

export const DEFAULT_REGION: RegionCode = 'SE';

export const regionSchema = z.string().min(1, 'Region is required');

export function getRegionByCode(code: string) {
  return regions.find((region) => region.code === code);
}

export function isValidRegionCode(code: string) {
  return regions.some((region) => region.code === code);
}
