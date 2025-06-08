import ResourceGrid from '@/components/resource-grid';
import SectionTitle from '@/components/section-title';

export default function Loading() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle>Search</SectionTitle>
        <div className="h-10 w-32 animate-pulse rounded-md bg-neutral-50/10" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <ResourceGrid.Skeletons className="w-full" />
      </div>

      <div className="mt-8 flex justify-center">
        <div className="mx-auto h-6 w-6 animate-pulse rounded-md bg-neutral-50/10" />
      </div>
    </>
  );
}
