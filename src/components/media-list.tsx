import ItemCard from '@/components/item-card';
import { getUser } from '@/lib/auth-server';
import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';

type MediaItem = Movie | TvShow;

type MediaListProps = {
  fetchUserItems?: () => Promise<MediaItem[]>;
  fetchItems: () => Promise<MediaItem[]>;
  type: 'movie' | 'tv';
};

/**
 * Generic component that displays a list of media items (movies or TV shows) as resource cards.
 *
 * Fetches either personalized or general items depending on user authentication, and renders each as an {@link ItemCard}.
 *
 * @param fetchUserItems - Optional function to fetch user-specific items. If not provided, fetchItems will be used for all users.
 * @param fetchItems - Function to fetch general items (used when user is not logged in or when fetchUserItems is not provided).
 * @param type - The media type, either 'movie' or 'tv'.
 * @returns An array of {@link ItemCard} elements representing the media items.
 */
export default async function MediaList({
  fetchUserItems,
  fetchItems,
  type,
}: MediaListProps) {
  const user = await getUser();
  const items =
    user && fetchUserItems ? await fetchUserItems() : await fetchItems();

  return items.map((item) => (
    <ItemCard
      className="max-w-[150px]"
      key={item.id}
      resource={item}
      type={type}
      userId={user?.id}
    />
  ));
}
