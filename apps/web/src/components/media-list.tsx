import ItemCard from '@/components/item-card';
import { authClient } from '@/lib/auth-client';
import { Movie } from '@movies/api/types/movie';
import { TvShow } from '@movies/api/types/tv-show';

type MediaItem = Movie | TvShow;

type MediaListProps = {
  items: MediaItem[];
  type: 'movie' | 'tv';
};

/**
 * Displays a list of media items (movies or TV shows) as resource cards.
 */
export default function MediaList({ items, type }: MediaListProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  return (
    <>
      {items.map((item) => (
        <ItemCard
          className="max-w-[150px]"
          key={item.id}
          resource={item}
          type={type}
          userId={userId}
        />
      ))}
    </>
  );
}
