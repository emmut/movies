import { z } from 'zod/v4';

import { EMOJI_OPTIONS } from '@/lib/config';

/**
 * Validates that a movieId is a valid string that can be converted to a positive integer.
 * Movie IDs from TMDB are numeric but often passed as strings in URL parameters.
 * Transforms the string to a number for database storage.
 */
export const resourceIdSchema = z.object({
  resourceId: z.number().int().positive('Resource ID must be a positive integer'),
  resourceType: z.enum(['movie', 'tv']),
});

/**
 * Schema for validating resourceId as a number directly
 */
export const resourceIdNumberSchema = z
  .number()
  .int()
  .positive('Resource ID must be a positive integer');

export const resourceTypeSchema = z.enum(['movie', 'tv']);

/**
 * Per-user singleton lists managed by the app rather than the user
 * (`lists.type` values other than 'custom').
 */
export const systemListTypeSchema = z.enum(['watchlist', 'watched']);

export type SystemListType = z.infer<typeof systemListTypeSchema>;

/**
 * Schema for movie page route parameters
 */
export const resourcePageParamsSchema = z.object({
  resourceId: resourceIdNumberSchema,
  resourceType: resourceTypeSchema,
});

export type ResourcePageParams = z.infer<typeof resourcePageParamsSchema>;

// Shared name/description/emoji fields for the create and update list schemas.
const listFields = {
  name: z
    .string()
    .trim()
    .min(1, 'List name is required')
    .max(100, 'List name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .trim()
    .optional()
    .default(''),
  emoji: z
    .string()
    .refine(
      (emoji): emoji is (typeof EMOJI_OPTIONS)[number] => EMOJI_OPTIONS.includes(emoji),
      'Invalid emoji selection',
    )
    .default('📝'),
} as const;

/**
 * Schema for validating list creation data
 */
export const createListSchema = z.object({ ...listFields });

export type CreateListData = z.infer<typeof createListSchema>;

/**
 * Schema for validating list update data
 */
export const updateListSchema = z.object({
  listId: z.uuid('Invalid list ID'),
  ...listFields,
});

export type UpdateListData = z.infer<typeof updateListSchema>;

/**
 * Schema for validating list item data
 */
export const listItemSchema = z.object({
  listId: z.uuid('Invalid list ID'),
  resourceId: z.number().int().positive('Resource ID must be a positive integer'),
  resourceType: z.enum(['movie', 'tv', 'person']),
});

export type ListItemData = z.infer<typeof listItemSchema>;

/**
 * Schema for validating list item removal. Identical shape to {@link listItemSchema}.
 */
export const removeListItemSchema = listItemSchema;

export type RemoveListItemData = z.infer<typeof removeListItemSchema>;

export const mediaIdSchema = z.number().int().min(1);
export const mediaTypeSchema = z.enum(['movie', 'tv', 'person']);

export const listIdSchema = z.uuid('Invalid list ID');
export const pageSchema = z.number().int().min(1);
