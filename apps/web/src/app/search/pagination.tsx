'use client';
import { useSearchList } from '@movies/api/react/use-search-query';

import { PaginationControls } from '@/components/pagination-controls';
import Spinner from '@/components/spinner';
import type { MediaType } from '@/types/media-type';

export default function SearchPagination({
  query,
  page,
  mediaType,
}: {
  query: string;
  page: number;
  mediaType: MediaType;
}) {
  const { data, isLoading } = useSearchList({ query, page, type: mediaType });
  if (!query) {
    return null;
  }
  if (isLoading) {
    return <Spinner className="mx-auto mt-8" />;
  }
  return data ? <PaginationControls totalPages={data.totalPages} /> : null;
}
