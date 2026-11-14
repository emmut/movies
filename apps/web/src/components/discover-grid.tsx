'use client';

import { useDiscoveryList } from '@movies/api/react/use-discovery-query';

import { webDiscoveryInput, type DiscoverMediaParams } from '@/lib/discover-input';

import ItemGrid from './item-grid';

type DiscoverGridProps = {
  query: DiscoverMediaParams;
  userId?: string;
};

export default function DiscoverGrid({ query, userId }: DiscoverGridProps) {
  const { data, isLoading, error } = useDiscoveryList(webDiscoveryInput(query));

  if (isLoading) {
    return <ItemGrid.Skeletons className="w-full" />;
  }

  if (error) {
    return (
      <div className="col-span-full text-center text-red-500">
        Error loading content. Please try again.
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <div className="col-span-full text-center text-muted-foreground">No results found.</div>;
  }

  return <ItemGrid resources={data.items} type={query.mediaType} userId={userId} />;
}
