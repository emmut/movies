import PersonalizedMediaList from '@/components/personalized-media-list';
import { getHomeMediaList, HomeMediaCategory } from '@/lib/home-media';
import { DEFAULT_REGION } from '@/lib/regions';

type MediaListProps = {
  category: HomeMediaCategory;
  type: 'movie' | 'tv';
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
 * @param type - The media type, either 'movie' or 'tv'.
 */
export default async function MediaList({ category, type }: MediaListProps) {
  const items = await getHomeMediaList(category, DEFAULT_REGION);

  return <PersonalizedMediaList category={category} type={type} initialItems={items} />;
}
