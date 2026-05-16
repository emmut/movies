'use client';

import { Route } from '@/routes/search';
import MediaTypeSelectorDropdown from '@/components/media-type-selector-dropdown';
import SectionTitle from '@movies/ui/components/section-title';
import { useScrollOnPageChange } from '@movies/ui/hooks/use-scroll-on-page-change';
import { MediaType } from '@movies/api/types/media-type';

import SearchPagination from './search-pagination';
import SearchResults from './search-results';

type SearchContentProps = {
  userId?: string;
};

export function SearchContent({ userId }: SearchContentProps) {
  const { q, page, mediaType } = Route.useSearch();

  useScrollOnPageChange(page);

  return (
    <>
      <div className="mt-4 mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle>Search</SectionTitle>
        <MediaTypeSelectorDropdown currentMediaType={mediaType as MediaType} />
      </div>

      <div
        className="mt-8 grid scroll-m-5 grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
        id="content-container"
      >
        <SearchResults
          searchQuery={q}
          currentPage={page}
          mediaType={mediaType as MediaType}
          userId={userId}
        />
      </div>

      <SearchPagination query={q} page={page} mediaType={mediaType as MediaType} />
    </>
  );
}
