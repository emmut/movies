import { Movie } from '@/types/movie';
import { TvShow } from '@/types/tv-show';
import ResourceCard from './resource-card';

type ResourceGridProps = {
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
 */
export function ResourceGrid({ resources, type }: ResourceGridProps) {
  const resourceName = type === 'movie' ? 'movies' : 'TV shows';

  return (
    <>
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} type={type} />
      ))}
      {resources.length === 0 && (
        <p className="col-span-full text-center">No {resourceName} was found</p>
      )}
    </>
  );
}

type ResourceGridSkeletonsProps = {
  className?: string;
};

/**
 * Renders a set of 20 skeleton placeholder cards for resources.
 *
 * Typically used to indicate a loading state while resource data is being fetched.
 *
 * @param className - Optional CSS class name to apply to the skeleton cards.
 */
function ResourceGridSkeletons({ className }: ResourceGridSkeletonsProps) {
  return (
    <>
      {Array.from({ length: 20 }).map((_, index) => (
        <ResourceCard.Skeleton className={className} key={index} />
      ))}
    </>
  );
}

ResourceGrid.Skeletons = ResourceGridSkeletons;

export default ResourceGrid;
