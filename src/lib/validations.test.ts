import { describe, expect, it } from 'vitest';

import { EMOJI_OPTIONS } from './config';
import {
  createListSchema,
  listItemSchema,
  mediaIdSchema,
  mediaTypeSchema,
  moveListSchema,
  pageSchema,
  resourceIdNumberSchema,
  resourceIdSchema,
  resourcePageParamsSchema,
  resourceTypeSchema,
  updateListSchema,
} from './validations';

const UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('resourceIdSchema', () => {
  it('accepts positive integer movie/tv ids', () => {
    expect(resourceIdSchema.parse({ resourceId: 1, resourceType: 'movie' })).toEqual({
      resourceId: 1,
      resourceType: 'movie',
    });
    expect(resourceIdSchema.parse({ resourceId: 99, resourceType: 'tv' }).resourceType).toBe('tv');
  });

  it('rejects non-positive, fractional, and out-of-enum values', () => {
    expect(resourceIdSchema.safeParse({ resourceId: 0, resourceType: 'movie' }).success).toBe(
      false,
    );
    expect(resourceIdSchema.safeParse({ resourceId: -1, resourceType: 'movie' }).success).toBe(
      false,
    );
    expect(resourceIdSchema.safeParse({ resourceId: 1.5, resourceType: 'movie' }).success).toBe(
      false,
    );
    expect(resourceIdSchema.safeParse({ resourceId: 1, resourceType: 'person' }).success).toBe(
      false,
    );
    expect(resourceIdSchema.safeParse({ resourceId: '1', resourceType: 'movie' }).success).toBe(
      false,
    );
  });
});

describe('resourceIdNumberSchema / resourceTypeSchema', () => {
  it('validates standalone ids and types', () => {
    expect(resourceIdNumberSchema.parse(42)).toBe(42);
    expect(resourceIdNumberSchema.safeParse(0).success).toBe(false);
    expect(resourceTypeSchema.safeParse('movie').success).toBe(true);
    expect(resourceTypeSchema.safeParse('person').success).toBe(false);
  });
});

describe('resourcePageParamsSchema', () => {
  it('accepts valid params', () => {
    expect(resourcePageParamsSchema.parse({ resourceId: 5, resourceType: 'tv' })).toEqual({
      resourceId: 5,
      resourceType: 'tv',
    });
  });

  it('rejects invalid resource type', () => {
    expect(
      resourcePageParamsSchema.safeParse({ resourceId: 5, resourceType: 'book' }).success,
    ).toBe(false);
  });
});

describe('createListSchema', () => {
  it('applies defaults for description and emoji', () => {
    expect(createListSchema.parse({ name: 'My list' })).toEqual({
      name: 'My list',
      description: '',
      emoji: '📝',
    });
  });

  it('trims name and description', () => {
    const parsed = createListSchema.parse({ name: '  Faves  ', description: '  hi  ' });
    expect(parsed.name).toBe('Faves');
    expect(parsed.description).toBe('hi');
  });

  it('rejects empty and overlong names', () => {
    expect(createListSchema.safeParse({ name: '' }).success).toBe(false);
    expect(createListSchema.safeParse({ name: '   ' }).success).toBe(false); // trims to empty
    expect(createListSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });

  it('rejects overlong descriptions', () => {
    expect(createListSchema.safeParse({ name: 'ok', description: 'a'.repeat(501) }).success).toBe(
      false,
    );
  });

  it('accepts every allowed emoji and rejects others', () => {
    for (const emoji of EMOJI_OPTIONS) {
      expect(createListSchema.safeParse({ name: 'ok', emoji }).success).toBe(true);
    }
    expect(createListSchema.safeParse({ name: 'ok', emoji: '🦄' }).success).toBe(false);
    expect(createListSchema.safeParse({ name: 'ok', emoji: 'notanemoji' }).success).toBe(false);
  });
});

describe('updateListSchema', () => {
  it('requires a valid uuid listId', () => {
    expect(updateListSchema.safeParse({ listId: UUID, name: 'ok' }).success).toBe(true);
    expect(updateListSchema.safeParse({ listId: 'not-a-uuid', name: 'ok' }).success).toBe(false);
  });
});

describe('listItemSchema', () => {
  it('accepts movie, tv, and person resources with a uuid list', () => {
    for (const resourceType of ['movie', 'tv', 'person'] as const) {
      expect(listItemSchema.safeParse({ listId: UUID, resourceId: 1, resourceType }).success).toBe(
        true,
      );
    }
  });

  it('rejects bad uuid, non-positive id, and unknown type', () => {
    expect(
      listItemSchema.safeParse({ listId: 'x', resourceId: 1, resourceType: 'movie' }).success,
    ).toBe(false);
    expect(
      listItemSchema.safeParse({ listId: UUID, resourceId: 0, resourceType: 'movie' }).success,
    ).toBe(false);
    expect(
      listItemSchema.safeParse({ listId: UUID, resourceId: 1, resourceType: 'book' }).success,
    ).toBe(false);
  });
});

describe('moveListSchema', () => {
  it('accepts a uuid with a non-negative integer position', () => {
    expect(moveListSchema.safeParse({ listId: UUID, position: 0 }).success).toBe(true);
    expect(moveListSchema.safeParse({ listId: UUID, position: 7 }).success).toBe(true);
  });

  it('rejects bad uuid, negative, and fractional positions', () => {
    expect(moveListSchema.safeParse({ listId: 'not-a-uuid', position: 0 }).success).toBe(false);
    expect(moveListSchema.safeParse({ listId: UUID, position: -1 }).success).toBe(false);
    expect(moveListSchema.safeParse({ listId: UUID, position: 1.5 }).success).toBe(false);
  });
});

describe('mediaIdSchema / mediaTypeSchema / pageSchema', () => {
  it('validates media ids', () => {
    expect(mediaIdSchema.safeParse(1).success).toBe(true);
    expect(mediaIdSchema.safeParse(0).success).toBe(false);
    expect(mediaIdSchema.safeParse(-3).success).toBe(false);
  });

  it('validates media types', () => {
    expect(mediaTypeSchema.safeParse('person').success).toBe(true);
    expect(mediaTypeSchema.safeParse('audio').success).toBe(false);
  });

  it('validates pages as positive integers', () => {
    expect(pageSchema.safeParse(1).success).toBe(true);
    expect(pageSchema.safeParse(0).success).toBe(false);
    expect(pageSchema.safeParse(2.5).success).toBe(false);
  });
});
