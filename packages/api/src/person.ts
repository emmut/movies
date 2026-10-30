import { z } from 'zod';

export const personInput = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
export const personCreditsInput = personInput.extend({ type: z.enum(['movie', 'tv']) });
export const personDetailSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  biography: z.string(),
  profileUrl: z.string().url().nullable(),
  birthday: z.string().nullable(),
  deathday: z.string().nullable(),
  birthplace: z.string().nullable(),
  department: z.string(),
  aliases: z.array(z.string()),
  popularity: z.number(),
  homepage: z.string().url().nullable(),
  imdbUrl: z.string().url().nullable(),
});
export type PersonInput = z.infer<typeof personInput>;
export type PersonCreditsInput = z.infer<typeof personCreditsInput>;
export type PersonDetail = z.infer<typeof personDetailSchema>;
