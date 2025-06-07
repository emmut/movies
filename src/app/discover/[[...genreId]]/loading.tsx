import AvailableGenresNavigation from '@/components/available-genre-navigation';
import ResourceGrid from '@/components/resource-grid';
import SectionTitle from '@/components/section-title';

/**
 * Renders a loading placeholder UI for the genre discovery page.
 *
 * Displays skeleton loaders for the section title, genre navigation, media type selector, filters panel, movies grid, and pagination to visually represent loading states.
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

        <div className="h-10 w-48 animate-pulse rounded-lg bg-neutral-50/10" />
      </div>

      <div className="mt-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-54 flex-col gap-2">
              <div className="h-4 w-16 animate-pulse rounded bg-neutral-50/10" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-50/10" />
            </div>

            <div className="flex min-w-64 flex-col gap-2">
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-50/10" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-50/10" />
            </div>
          </div>
        </div>
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
