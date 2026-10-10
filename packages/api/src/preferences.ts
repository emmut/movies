import { regions, type RegionCode } from '@movies/config/regions';
import { z } from 'zod';

const regionCodes = regions.map((region) => region.code) as [RegionCode, ...RegionCode[]];

/** The signed-in account's region; the same supported set and default as web settings. */
export const regionPreferenceSchema = z.object({ region: z.enum(regionCodes) });
export type RegionPreference = z.infer<typeof regionPreferenceSchema>;
