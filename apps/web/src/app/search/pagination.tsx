'use client';

import { useSearchList } from '@movies/api/react/use-search-query';

import { PaginationControls } from '@/components/pagination-controls';
import Spinner from '@/components/spinner';
import type { MediaType } from '@/types/media-type';

type SearchPaginationProps = {
  query: string;
  page: number;
  mediaType: MediaType;
};

export default function SearchPagination({ query, page, mediaType }: SearchPaginationProps) {
  const { data, isLoading } = useSearchList({ query, page, type: mediaType });
  if (!query) {
    return null;
  }
  if (isLoading) {
    return <Spinner className="mx-auto mt-8" />;
  }
  if (!data) {
    return null;
  }
  return <PaginationControls totalPages={data.totalPages} />;
}
