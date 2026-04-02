import ItemGrid from '@/components/item-grid';
import { getUser } from '@/lib/auth-server';
import { Suspense } from 'react';
import { SearchContent } from './search-content';
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
 * Supports searching for movies, TV shows, persons, and multi-search based on the mediaType parameter.
 *
 * @param props - Contains a promise resolving to search parameters, including optional query, page, and mediaType values.
 * @returns The rendered search page UI with results and pagination.
 */
export default async function SearchPage(props: SearchProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q ?? '';
  const page = Number(searchParams.page ?? '1');
  const mediaType = (searchParams.mediaType ?? 'all') as MediaType;

  const user = await getUser();

  return (
    <SearchContent
      results={
        <Suspense fallback={<ItemGrid.Skeletons className="w-full" />}>
          <SearchResults
            searchQuery={query}
            currentPage={page}
            mediaType={mediaType}
            userId={user?.id}
          />
        </Suspense>
      }
    />
  );
}
