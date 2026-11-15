'use client';
import { useSearchList } from '@movies/api/react/use-search-query';

import ItemCard from '@/components/item-card';
import ItemGrid from '@/components/item-grid';
import PersonCard from '@/components/person-card';
import SearchBox from '@/components/search-box';
import type { MediaType } from '@/types/media-type';

export default function SearchResults({
  searchQuery,
  currentPage,
  mediaType,
  userId,
}: {
  searchQuery: string;
  currentPage: number;
  mediaType: MediaType;
  userId?: string;
}) {
  const query = useSearchList({ query: searchQuery, page: currentPage, type: mediaType });
  if (!searchQuery) {
    return <SearchBox mediaType={mediaType} />;
  }
  return <SearchQueryResults query={query} searchQuery={searchQuery} userId={userId} />;
}

function SearchQueryResults({
  query,
  searchQuery,
  userId,
}: {
  query: ReturnType<typeof useSearchList>;
  searchQuery: string;
  userId?: string;
}) {
  switch (query.status) {
    case 'pending':
      return <ItemGrid.Skeletons className="w-full" />;
    case 'error':
      return (
        <div className="col-span-full text-center text-red-500">
          Error loading search results. Please try again.
        </div>
      );
    case 'success':
      return <Results items={query.data.items} searchQuery={searchQuery} userId={userId} />;
  }
}

function Results({
  items,
  searchQuery,
  userId,
}: {
  items: import('@movies/api/search').SearchItem[];
  searchQuery: string;
  userId?: string;
}) {
  if (!items.length) {
    return (
      <p className="col-span-full text-center text-zinc-400">
        No results found for “{searchQuery}”
      </p>
    );
  }
  return items.map((item) =>
    item.type === 'person' ? (
      <PersonCard key={'person:' + item.id} person={item} userId={userId} />
    ) : (
      <ItemCard key={item.type + ':' + item.id} resource={item} userId={userId} />
    ),
  );
}
