import { z } from 'zod';

export const creditPersonSchema = z.object({
  creditId: z.string(),
  id: z.number().int().positive(),
  name: z.string(),
  role: z.string(),
  episodeCount: z.number().int().nonnegative().optional(),
  profileUrl: z.string().url().nullable(),
});
export type CreditPerson = z.infer<typeof creditPersonSchema>;
