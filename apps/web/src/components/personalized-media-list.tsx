'use client';

import type { MediaCard, HomeMediaCategory } from '@movies/api/home';
import { useApiAccountId } from '@movies/api/react';
import { useHomeList } from '@movies/api/react/use-home-query';
import { useAccountRegion } from '@movies/api/react/use-preferences-query';
import { DEFAULT_REGION } from '@movies/config/regions';

import ItemCard from '@/components/item-card';

type PersonalizedMediaListProps = {
  category: HomeMediaCategory;
  initialItems: MediaCard[];
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
  initialItems,
}: PersonalizedMediaListProps) {
  const accountId = useApiAccountId();
  const { data: accountRegion } = useAccountRegion(accountId);
  const region = accountRegion?.region ?? DEFAULT_REGION;
  const { data } = useHomeList({ category, region });
  const items = data ?? initialItems;

  return items.map((item) => <ItemCard className="max-w-[150px]" key={item.id} resource={item} />);
}
