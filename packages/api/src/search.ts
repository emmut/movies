import { z } from 'zod';

import { mediaCardSchema } from './home';

export const searchInput = z.object({
  query: z.string().trim().min(1).max(500),
  page: z.number().int().min(1).max(500).default(1),
  type: z.enum(['all', 'movie', 'tv', 'person']).default('all'),
});
export const searchedPersonCardSchema = z.object({
  id: z.number().int().positive(),
  type: z.literal('person'),
  name: z.string(),
  profileUrl: z.string().url().nullable(),
  department: z.string(),
  knownFor: z.array(z.string()),
});
export const searchPageSchema = z.object({
  items: z.array(z.union([mediaCardSchema, searchedPersonCardSchema])),
  totalPages: z.number().int().min(0).max(500),
});
export type SearchInput = z.infer<typeof searchInput>;
export type SearchPage = z.infer<typeof searchPageSchema>;
export type SearchPersonCard = z.infer<typeof searchedPersonCardSchema>;
export type SearchItem = SearchPage['items'][number];
