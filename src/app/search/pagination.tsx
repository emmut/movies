'use client';

import { PaginationControls } from '@/components/pagination-controls';
import Spinner from '@/components/spinner';
import { useSearchQuery } from '@/hooks/use-search-query';
import { MediaType } from '@/types/media-type';

type SearchPaginationProps = {
  query: string;
  page: number;
  mediaType: MediaType;
};

/**
 * Renders pagination controls for search results based on the current query and filters.
 *
 * Fetches the total number of pages for the selected media type and query, then displays pagination controls for navigation.
 *
 * @param query - The search query string
 * @param page - The currently selected page number
 * @param mediaType - The type of media to paginate, either 'movie', 'tv', 'person', or 'all'
 * @returns A React element displaying pagination controls for the search results
 */
export default function SearchPagination({
  query,
  page,
  mediaType,
}: SearchPaginationProps) {
  const { data, isLoading } = useSearchQuery({
    query,
    page,
    mediaType,
  });

  if (isLoading) {
    return <Spinner className="mx-auto mt-8" />;
  }

  if (!data || !query) {
    return null;
  }

  return <PaginationControls totalPages={data.totalPages} pageType="search" />;
}
