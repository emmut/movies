import type { HomeMediaCategory } from '@movies/api/home';
import { DEFAULT_REGION } from '@movies/config/regions';

import PersonalizedMediaList from '@/components/personalized-media-list';
import { getHomeMediaList } from '@/lib/home-media';

type MediaListProps = {
  category: HomeMediaCategory;
};

/**
 * Prerenders a home-page media slider for the default region, then hands off to
 * {@link PersonalizedMediaList} for client-side region personalization.
 *
 * Only cached, request-independent data is fetched here so the surrounding Suspense boundary can be
 * prerendered rather than server-streamed — streaming this content crashes hydration under
 * cacheComponents on next@16.2.9 (see the blank-landing-page bug). The user's region is resolved
 * client-side after hydration, never during this server render.
 *
 * @param category - The home-page media category to display.
 */
export default async function MediaList({ category }: MediaListProps) {
  const items = await getHomeMediaList(category, DEFAULT_REGION);

  return <PersonalizedMediaList category={category} initialItems={items} />;
}
