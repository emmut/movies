import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';
import ItemCard from './item-card';

type ItemGridProps = {
  resources: Movie[] | TvShow[];
  type: 'movie' | 'tv';
};

/**
 * Displays a grid of resource cards for movies or TV shows.
 *
 * Renders a ResourceCard for each resource in the provided array. If no resources are found, displays an appropriate message.
 *
 * @param resources - Array of movies or TV shows to display.
 * @param type - The type of resource ('movie' or 'tv').
 * @param userId - Optional user ID to enable list functionality.
 */
export function ItemGrid({ resources, type }: ItemGridProps) {
  const resourceName = type === 'movie' ? 'movies' : 'TV shows';

  return (
    <>
      {resources.map((resource) => (
        <ItemCard key={resource.id} resource={resource} type={type} />
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
