'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import ItemCard from '@/components/item-card';
import { useUserRegion } from '@/hooks/use-user-region';
import { getHomeMediaList, HomeMediaCategory } from '@/lib/home-media';
import { queryKeys } from '@/lib/query-keys';
import { DEFAULT_REGION } from '@/lib/regions';
import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';

type MediaItem = Movie | TvShow;

type PersonalizedMediaListProps = {
  category: HomeMediaCategory;
  type: 'movie' | 'tv';
  initialItems: MediaItem[];
};

/**
 * Renders a home-page media slider that personalizes to the user's region after hydration.
 *
 * The server prerenders {@link initialItems} for the default region, so the initial markup is
 * cacheable and never streams (avoiding the cacheComponents hydration crash on next@16.2.9). Once
 * the client resolves the user's region, a region-specific list is fetched and swapped in; while it
 * loads the previous list stays visible. Default-region users keep the prerendered list unchanged.
 */
export default function PersonalizedMediaList({
  category,
  type,
  initialItems,
}: PersonalizedMediaListProps) {
  const { data: region } = useUserRegion();
  const effectiveRegion = region ?? DEFAULT_REGION;

  const { data } = useQuery({
    queryKey: queryKeys.home.list(category, effectiveRegion),
    queryFn: () => getHomeMediaList(category, effectiveRegion),
    initialData: effectiveRegion === DEFAULT_REGION ? initialItems : undefined,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const items = data ?? initialItems;

  return items.map((item) => (
    <ItemCard className="max-w-[150px]" key={item.id} resource={item} type={type} />
  ));
}
