import { getDiscoverMedia } from '@/lib/discover-client';
import ItemGrid from './item-grid';

type DiscoverGridProps = {
  currentGenreId: number;
  currentPage: number;
  mediaType: 'movie' | 'tv';
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  runtimeLte?: number;
  userId?: string;
};

export default async function DiscoverGrid({
  currentGenreId,
  currentPage,
  mediaType,
  sortBy,
  watchProviders,
  watchRegion,
  runtimeLte,
  userId,
}: DiscoverGridProps) {
  const data = await getDiscoverMedia(
    mediaType,
    currentGenreId,
    currentPage,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeLte,
  );

  if (!data || data.results.length === 0) {
    return <div className="text-muted-foreground col-span-full text-center">No results found.</div>;
  }

  return <ItemGrid resources={data.results} type={mediaType} userId={userId} />;
}
