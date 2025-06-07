import ResourceGrid from '@/components/resource-grid';
import SectionTitle from '@/components/section-title';

export default function Loading() {
  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Search</SectionTitle>
      </div>

      <div
        id="movies-container"
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
