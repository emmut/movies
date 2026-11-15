import { z } from 'zod';

import { systemListTypeSchema } from './validations';

/** The internal HTTP callback accepts the same typed effects emitted by the router. */
const resource = z.object({
  resourceId: z.number().int().positive(),
  resourceType: z.enum(['movie', 'tv', 'person']),
});
export const mutationEffectSchema = z.discriminatedUnion('domain', [
  z.object({ domain: z.literal('preferences') }),
  z.object({
    domain: z.literal('customLists'),
    listId: z.string().uuid().optional(),
    resource: resource.optional(),
  }),
  z.object({
    domain: z.literal('systemLists'),
    listType: systemListTypeSchema,
    resource: resource.optional(),
  }),
]);

export const mutationEventSchema = z.intersection(
  mutationEffectSchema,
  z.object({ userId: z.string().min(1) }),
);
export type MutationEffect = z.infer<typeof mutationEffectSchema>;
export type MutationEvent = z.infer<typeof mutationEventSchema>;
