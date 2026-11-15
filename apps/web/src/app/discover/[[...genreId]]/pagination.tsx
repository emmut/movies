'use client';

import { useDiscoveryList } from '@movies/api/react/use-discovery-query';

import { PaginationControls } from '@/components/pagination-controls';
import Spinner from '@/components/spinner';
import { webDiscoveryInput, type DiscoverMediaParams } from '@/lib/discover-input';

export default function Pagination({ query }: { query: DiscoverMediaParams }) {
  const { data, isLoading } = useDiscoveryList(webDiscoveryInput(query));

  if (isLoading) {
    return <Spinner className="mx-auto mt-8" />;
  }

  if (!data) {
    return null;
  }

  return <PaginationControls totalPages={data.totalPages} />;
}
