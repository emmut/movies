import ItemCard from '@/components/item-card';
import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';

type MediaItem = Movie | TvShow;

type MediaListProps = {
  fetchItems: () => Promise<MediaItem[]>;
  type: 'movie' | 'tv';
};

/**
 * Generic component that displays a list of media items (movies or TV shows) as resource cards.
 *
 * Renders only cached, request-independent data so the surrounding Suspense boundary can be
 * prerendered rather than server-streamed. Per-user state (the list/watchlist button) is resolved
 * client-side inside {@link ItemCard}'s ListButton via the auth session, so the markup stays cacheable.
 * Streaming this content instead crashes hydration under cacheComponents on next@16.2.9 — see the
 * blank-landing-page bug.
 *
 * @param fetchItems - Function to fetch the (cached) items to display.
 * @param type - The media type, either 'movie' or 'tv'.
 * @returns An array of {@link ItemCard} elements representing the media items.
 */
export default async function MediaList({ fetchItems, type }: MediaListProps) {
  const items = await fetchItems();

  return items.map((item) => (
    <ItemCard className="max-w-[150px]" key={item.id} resource={item} type={type} />
  ));
}
