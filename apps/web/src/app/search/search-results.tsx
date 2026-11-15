'use client';

import { useSearchList } from '@movies/api/react/use-search-query';
import type { SearchItem } from '@movies/api/search';

import ItemCard from '@/components/item-card';
import ItemGrid from '@/components/item-grid';
import PersonCard from '@/components/person-card';
import SearchBox from '@/components/search-box';
import type { MediaType } from '@/types/media-type';

type SearchResultsProps = {
  searchQuery: string;
  currentPage: number;
  mediaType: MediaType;
  userId?: string;
};

export default function SearchResults({
  searchQuery,
  currentPage,
  mediaType,
  userId,
}: SearchResultsProps) {
  const query = useSearchList({ query: searchQuery, page: currentPage, type: mediaType });
  if (!searchQuery) {
    return <SearchBox mediaType={mediaType} />;
  }
  return <SearchQueryResults query={query} searchQuery={searchQuery} userId={userId} />;
}

type SearchQueryResultsProps = {
  query: ReturnType<typeof useSearchList>;
  searchQuery: string;
  userId?: string;
};

function SearchQueryResults({ query, searchQuery, userId }: SearchQueryResultsProps) {
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

type ResultsProps = {
  items: SearchItem[];
  searchQuery: string;
  userId?: string;
};

function Results({ items, searchQuery, userId }: ResultsProps) {
  if (items.length === 0) {
    return (
      <p className="col-span-full text-center text-zinc-400">
        No results found for “{searchQuery}”
      </p>
    );
  }
  return items.map((item) => {
    const key = `${item.type}:${item.id}`;
    if (item.type === 'person') {
      return <PersonCard key={key} person={item} userId={userId} />;
    }
    return <ItemCard key={key} resource={item} userId={userId} />;
  });
}
