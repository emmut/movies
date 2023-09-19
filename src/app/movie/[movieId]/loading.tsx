import Spinner from '@/components/Spinner';

export default function LoadingMovies() {
  return (
    <div className="grid max-w-screen-lg gap-4 md:grid-cols-12">
      <div className="group relative col-span-4 grid aspect-[2/3] w-full animate-pulse overflow-hidden rounded-md">
        <div className="col-span-full row-span-full rounded-md border border-white/25 bg-neutral-50/10 p-3 text-center transition-opacity duration-200 ease-in"></div>
      </div>
      <div className="col-span-8">
        <Spinner />
      </div>
    </div>
  );
}
