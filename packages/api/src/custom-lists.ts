import { ITEMS_PER_PAGE, LISTS_PER_PAGE } from '@movies/config/constants';
import { DEFAULT_REGION } from '@movies/config/regions';
import { z } from 'zod';

import { mediaCardSchema } from './home';
import {
  postgresIntegerIdSchema,
  regionPreferenceSchema,
  watchProviderIdSchema,
} from './preferences';
import {
  createListSchema,
  updateListSchema,
  listIdSchema,
  listItemSchema,
  moveListSchema,
} from './validations';

export const customListResourceInput = listItemSchema
  .omit({ listId: true })
  .extend({ resourceId: postgresIntegerIdSchema });
export const customListItemInput = customListResourceInput.extend({ listId: listIdSchema });
export const customListIdInput = z.object({ listId: listIdSchema });
export const customListIndexInput = z.object({ page: z.number().int().positive().default(1) });
export const customListDetailInput = customListIdInput.extend({
  page: z.number().int().positive().default(1),
  providerIds: z.array(watchProviderIdSchema).default([]),
  region: regionPreferenceSchema.shape.region.default(DEFAULT_REGION),
});
export const customListMoveItemInput = z.object({
  itemId: z.uuid(),
  position: z.number().int().nonnegative(),
});
export const customListSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  emoji: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  itemCount: z.number().int().nonnegative(),
});
const paginationFields = {
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
};
export const customListIndexSchema = z.object({
  lists: z.array(customListSummarySchema),
  ...paginationFields,
  itemsPerPage: z.literal(LISTS_PER_PAGE),
});
export const customListEntrySchema = z.discriminatedUnion('type', [
  mediaCardSchema.extend({ type: z.literal('movie'), listItemId: z.uuid() }),
  mediaCardSchema.extend({ type: z.literal('tv'), listItemId: z.uuid() }),
  z.object({
    type: z.literal('person'),
    id: postgresIntegerIdSchema,
    title: z.string(),
    posterUrl: z.string().nullable(),
    listItemId: z.uuid(),
  }),
]);
export const customListDetailSchema = customListSummarySchema.extend({
  items: z.array(customListEntrySchema),
  ...paginationFields,
  itemsPerPage: z.literal(ITEMS_PER_PAGE),
  unavailableItems: z.number().int().nonnegative(),
});
export const customListStatusSchema = z.array(
  customListSummarySchema.extend({ hasItem: z.boolean() }),
);
export const customListSuccessSchema = z.object({ success: z.boolean() });
export const customListCreatedSchema = customListSuccessSchema.extend({ listId: z.uuid() });
export const customListContracts = {
  index: { input: customListIndexInput, output: customListIndexSchema },
  details: { input: customListDetailInput, output: customListDetailSchema },
  create: { input: createListSchema, output: customListCreatedSchema },
  update: { input: updateListSchema, output: customListSuccessSchema },
  delete: { input: customListIdInput, output: customListSuccessSchema },
  add: { input: customListItemInput, output: customListSuccessSchema },
  remove: { input: customListItemInput, output: customListSuccessSchema },
  status: { input: customListResourceInput, output: customListStatusSchema },
  move: { input: moveListSchema, output: customListSuccessSchema },
  moveItem: { input: customListMoveItemInput, output: customListSuccessSchema },
};
export type CustomListService = {
  [K in keyof typeof customListContracts]: (
    userId: string,
    input: z.output<(typeof customListContracts)[K]['input']>,
  ) => Promise<z.output<(typeof customListContracts)[K]['output']>>;
};
export type CustomListSummary = z.infer<typeof customListSummarySchema>;
export type CustomListEntry = z.infer<typeof customListEntrySchema>;
export type CustomListDetail = z.infer<typeof customListDetailSchema>;
export type CustomListIndex = z.infer<typeof customListIndexSchema>;
