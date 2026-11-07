'use client';

import { PaginationControls } from '@/components/pagination-controls';
import Spinner from '@/components/spinner';
import { useDiscoverMedia, type DiscoverMediaParams } from '@/hooks/use-discover-query';

export default function Pagination({ query }: { query: DiscoverMediaParams }) {
  const { data, isLoading } = useDiscoverMedia(query);

  if (isLoading) {
    return <Spinner className="mx-auto mt-8" />;
  }

  if (!data) {
    return null;
  }

  return <PaginationControls totalPages={data.totalPages} />;
}
