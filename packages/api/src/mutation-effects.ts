import { z } from 'zod';

import type { SystemListType } from './validations';

type Resource = { resourceId: number; resourceType: 'movie' | 'tv' | 'person' };

/** Domain-level cache effects; adapters decide how their host responds. */
export type MutationEffect =
  | { domain: 'preferences' }
  | { domain: 'customLists'; listId?: string; resource?: Resource }
  | { domain: 'systemLists'; listType: SystemListType; resource?: Resource };

export type MutationEvent = MutationEffect & { userId: string };

/** The internal HTTP callback accepts the same typed effects emitted by the router. */
const resource = z.object({
  resourceId: z.number().int().positive(),
  resourceType: z.enum(['movie', 'tv', 'person']),
});
const account = { userId: z.string().min(1) };
export const mutationEventSchema = z.discriminatedUnion('domain', [
  z.object({ ...account, domain: z.literal('preferences') }),
  z.object({
    ...account,
    domain: z.literal('customLists'),
    listId: z.string().uuid().optional(),
    resource: resource.optional(),
  }),
  z.object({
    ...account,
    domain: z.literal('systemLists'),
    listType: z.enum(['watchlist', 'watched']),
    resource: resource.optional(),
  }),
]);
