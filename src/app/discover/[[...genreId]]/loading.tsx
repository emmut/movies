import AvailableGenresNavigation from '@/components/available-genre-navigation';
import Movies from '@/components/movies';
import SectionTitle from '@/components/section-title';

export default function Loading() {
  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
      </div>

      <div className="relative mt-2 flex flex-wrap gap-2">
        <AvailableGenresNavigation.Skeleton />
      </div>

      <div
        id="movies-container"
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
