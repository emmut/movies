import AvailableGenresNavigation from '@/components/available-genre-navigation';
import Movies from '@/components/movies';
import SectionTitle from '@/components/section-title';

export default function Loading() {
  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
      </div>

      <div className="relative mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Movies.Skeletons />
      </div>

      <div className="mt-8 flex justify-center">
        <div className="mx-auto h-6 w-6 animate-pulse rounded-md bg-neutral-50/10" />
      </div>
    </>
  );
}
