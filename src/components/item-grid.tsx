import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';

import ItemCard from './item-card';

type ItemGridProps = {
  resources: Movie[] | TvShow[];
  type: 'movie' | 'tv';
  userId?: string;
};

/**
 * Displays a grid of resource cards for movies or TV shows.
 *
 * Renders a ResourceCard for each resource in the provided array. If no resources are found, displays an appropriate message.
 *
 * @param resources - Array of movies or TV shows to display.
 * @param type - The type of resource ('movie' or 'tv').
 */
// First row of a grid page is above the fold; load those posters eagerly so
// the LCP image doesn't wait for the browser's lazy-load scan.
const EAGER_IMAGE_COUNT = 4;

export function ItemGrid({ resources, type, userId }: ItemGridProps) {
  const resourceName = type === 'movie' ? 'movies' : 'TV shows';

  return (
    <>
      {resources.map((resource, index) => (
        <ItemCard
          key={resource.id}
          resource={resource}
          type={type}
          userId={userId}
          eagerImage={index < EAGER_IMAGE_COUNT}
        />
      ))}
      {resources.length === 0 && (
        <p className="col-span-full text-center">No {resourceName} was found</p>
      )}
    </>
  );
}

type ItemGridSkeletonsProps = {
  className?: string;
};

/**
 * Renders a set of 20 skeleton placeholder cards for resources.
 *
 * Typically used to indicate a loading state while resource data is being fetched.
 *
 * @param className - Optional CSS class name to apply to the skeleton cards.
 */
function ItemGridSkeletons({ className }: ItemGridSkeletonsProps) {
  return (
    <>
      {Array.from({ length: 20 }).map((_, index) => (
        <ItemCard.Skeleton className={className} key={index} />
      ))}
    </>
  );
}

ItemGrid.Skeletons = ItemGridSkeletons;

export default ItemGrid;
