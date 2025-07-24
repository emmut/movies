import MediaTypeSelector from '@/components/media-type-selector';
import { PaginationControls } from '@/components/pagination-controls';
import ResourceGrid from '@/components/resource-grid';
import SectionTitle from '@/components/section-title';
import {
  fetchActorsBySearchQuery,
  fetchMoviesBySearchQuery,
  fetchTvShowsBySearchQuery,
} from '@/lib/search';
import { Suspense } from 'react';
import SearchResults from './search-results';

type MediaType = 'movie' | 'tv' | 'actor';

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
  const mediaType = (searchParams.mediaType ?? 'movie') as MediaType;

  let totalPages = 0;

  if (query) {
    if (mediaType === 'tv') {
      const { totalPages: tvTotalPages } = await fetchTvShowsBySearchQuery(
        query,
        page
      );
      totalPages = tvTotalPages;
    } else if (mediaType === 'actor') {
      const { totalPages: actorTotalPages } = await fetchActorsBySearchQuery(
        query,
        page
      );
      totalPages = actorTotalPages;
    } else {
      const { totalPages: movieTotalPages } = await fetchMoviesBySearchQuery(
        query,
        page
      );
      totalPages = movieTotalPages;
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle>Search</SectionTitle>
        <MediaTypeSelector currentMediaType={mediaType} includeActors />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Suspense fallback={<ResourceGrid.Skeletons />}>
          <SearchResults
            searchQuery={query}
            currentPage={page}
            mediaType={mediaType}
          />
        </Suspense>
      </div>

      <PaginationControls totalPages={totalPages} pageType="search" />
    </>
  );
}
