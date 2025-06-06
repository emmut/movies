import AvailableGenresNavigation from '@/components/available-genre-navigation';
import ResourceGrid from '@/components/resource-grid';
import SectionTitle from '@/components/section-title';

/**
 * Renders a loading placeholder UI for the genre discovery page.
 *
 * Displays skeleton loaders for the section title, genre navigation, movies grid, and a footer indicator to visually represent loading states.
 */
export default function Loading() {
  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
      </div>

      <div className="relative mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <AvailableGenresNavigation.Skeleton />
        </div>

        <div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-50/10" />
      </div>

      <div
        id="content-container"
        tabIndex={0}
        className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <ResourceGrid.Skeletons className="w-full" />
      </div>

      <div className="mt-8 flex justify-center">
        <div className="mx-auto h-6 w-6 animate-pulse rounded-md bg-neutral-50/10" />
      </div>
    </>
  );
}
