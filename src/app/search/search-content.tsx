'use client';

import MediaTypeSelectorDropdown from '@/components/media-type-selector-dropdown';
import SectionTitle from '@/components/section-title';
import { MediaType } from '@/types/media-type';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import SearchPagination from './pagination';
import SearchResults from './search-results';

type SearchContentProps = {
  userId?: string;
};

/**
 * Client component that handles the search page content with React Query.
 * Uses nuqs to manage URL state, which automatically triggers React Query refetches.
 */
export function SearchContent({ userId }: SearchContentProps) {
  // Use nuqs to manage URL state - changes automatically trigger React Query refetches
  const [urlState] = useQueryStates(
    {
      q: parseAsString,
      page: parseAsInteger.withDefault(1),
      mediaType: parseAsString.withDefault('all'),
    },
    {
      history: 'push',
    }
  );

  const query = urlState.q ?? '';
  const page = urlState.page;
  const mediaType = (urlState.mediaType ?? 'all') as MediaType;

  return (
    <>
      <div className="mt-4 mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle>Search</SectionTitle>
        <MediaTypeSelectorDropdown currentMediaType={mediaType} />
      </div>

      <div
        className="mt-8 grid scroll-m-5 grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
        id="content-container"
      >
        <SearchResults
          searchQuery={query}
          currentPage={page}
          mediaType={mediaType}
          userId={userId}
        />
      </div>

      <SearchPagination query={query} page={page} mediaType={mediaType} />
    </>
  );
}
