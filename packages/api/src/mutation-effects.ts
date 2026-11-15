import type { SystemListType } from './validations';

type Resource = { resourceId: number; resourceType: 'movie' | 'tv' | 'person' };

/** Domain-level cache effects; adapters decide how their host responds. */
export type MutationEffect =
  | { domain: 'preferences' }
  | { domain: 'customLists'; listId?: string; resource?: Resource }
  | { domain: 'systemLists'; listType: SystemListType; resource?: Resource };

export type MutationEvent = MutationEffect & { userId: string };
