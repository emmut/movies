import ResourceGrid from '@/components/item-grid';
import MediaTypeSelectorDropdown from '@/components/media-type-selector-dropdown';
import { PaginationControls } from '@/components/pagination-controls';
import SectionTitle from '@/components/section-title';
import { getUser } from '@/lib/auth-server';
import {
  fetchMoviesBySearchQuery,
  fetchMultiSearchQuery,
  fetchPersonsBySearchQuery,
  fetchTvShowsBySearchQuery,
} from '@/lib/search';
import { Suspense } from 'react';
import SearchResults from './search-results';

type MediaType = 'movie' | 'tv' | 'person' | 'all';

type SearchProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    mediaType?: string;
  }>;
};

/**
 * Displays the search page with results and pagination based on the provided search parameters.
 *
 * Supports searching for both movies and TV shows based on the mediaType parameter and applying sort filters.
 *
 * @param props - Contains a promise resolving to search parameters, including optional query, page, mediaType, and sort_by values.
 * @returns The rendered search page UI with results and pagination.
 */
export default async function SearchPage(props: SearchProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q ?? '';
  const page = searchParams.page ?? '1';
  const mediaType = (searchParams.mediaType ?? 'all') as MediaType;

  const user = await getUser();

  let totalPages = 0;

  if (query) {
    if (mediaType === 'tv') {
      const { totalPages: tvTotalPages } = await fetchTvShowsBySearchQuery(
        query,
        page
      );
      totalPages = tvTotalPages;
    } else if (mediaType === 'person') {
      const { totalPages: personTotalPages } = await fetchPersonsBySearchQuery(
        query,
        page
      );
      totalPages = personTotalPages;
    } else if (mediaType === 'movie') {
      const { totalPages: movieTotalPages } = await fetchMoviesBySearchQuery(
        query,
        page
      );
      totalPages = movieTotalPages;
    } else {
      // 'all' - use multi search
      const { totalPages: multiTotalPages } = await fetchMultiSearchQuery(
        query,
        page
      );
      totalPages = multiTotalPages;
    }
  }

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
        <Suspense fallback={<ResourceGrid.Skeletons className="w-full" />}>
          <SearchResults
            searchQuery={query}
            currentPage={page}
            mediaType={mediaType}
            userId={user?.id}
          />
        </Suspense>
      </div>

      <PaginationControls totalPages={totalPages} pageType="search" />
    </>
  );
}
