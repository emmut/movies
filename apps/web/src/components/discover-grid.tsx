'use client';

import type { MediaCard } from '@movies/api/home';
import { useDiscoveryList } from '@movies/api/react/use-discovery-query';

import { webDiscoveryInput, type DiscoverMediaParams } from '@/lib/discover-input';

import ItemGrid from './item-grid';

type DiscoverGridProps = {
  query: DiscoverMediaParams;
  userId?: string;
};

export default function DiscoverGrid({ query, userId }: DiscoverGridProps) {
  const { data, isPending, isError } = useDiscoveryList(webDiscoveryInput(query));

  if (isPending) {
    return <ItemGrid.Skeletons className="w-full" />;
  }

  if (isError) {
    return (
      <div className="col-span-full text-center text-red-500">
        Error loading content. Please try again.
      </div>
    );
  }

  return <DiscoveryResults items={data.items} query={query} userId={userId} />;
}

function DiscoveryResults({ items, query, userId }: DiscoverGridProps & { items: MediaCard[] }) {
  if (items.length === 0) {
    return <div className="col-span-full text-center text-muted-foreground">No results found.</div>;
  }

  return <ItemGrid resources={items} type={query.mediaType} userId={userId} />;
}
