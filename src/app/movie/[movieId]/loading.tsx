import Spinner from '@/components/spinner';

export default function LoadingMovies() {
  return (
    <div className="grid max-w-(--breakpoint-lg) grid-cols-12 grid-rows-1 gap-4">
      <div className="relative col-span-7 grid aspect-2/3 animate-pulse overflow-hidden rounded-md md:col-span-4">
        <div className="h-[460px] w-[300px] rounded-md border border-white/25 bg-neutral-50/10 p-3 text-center"></div>
      </div>
      <div className="col-span-full md:col-span-8">
        <Spinner />
      </div>
    </div>
  );
}
