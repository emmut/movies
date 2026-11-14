import type { CustomListEntry } from '@movies/api/custom-lists';
import type { MediaCard } from '@movies/api/home';
import type { SearchPersonCard } from '@movies/api/search';

export type ApiListItem =
  | (MediaCard & { resourceType: 'movie' | 'tv'; listItemId: string })
  | (SearchPersonCard & { resourceType: 'person'; listItemId: string });

export function apiListItem(item: CustomListEntry): ApiListItem {
  if (item.type === 'person') {
    return {
      id: item.id,
      type: 'person',
      resourceType: 'person',
      name: item.title,
      profileUrl: item.posterUrl,
      department: '',
      knownFor: [],
      listItemId: item.listItemId,
    };
  }
  return { ...item, resourceType: item.type };
}
