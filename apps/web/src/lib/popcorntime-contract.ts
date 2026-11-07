import { z } from 'zod';

// Tokens are opaque bs58 strings, never arbitrary URLs or URL fragments.
export const popcorntimeTokenSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{24,4096}$/);
export const POPCORNTIME_MAX_AGE_DAYS = 21;

export function popcorntimeWatchUrl(token: string) {
  return `https://popcorntime.app/go/${popcorntimeTokenSchema.parse(token)}`;
}
