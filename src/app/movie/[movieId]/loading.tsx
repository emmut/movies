import Spinner from '@/components/Spinner';

export default function LoadingMovies() {
  return (
    <div className="grid w-full max-w-screen-lg gap-4 md:grid-cols-12">
      <div className="relative col-span-4 grid aspect-[2/3] w-full animate-pulse overflow-hidden rounded-md">
        <div className="h-[460px] w-[300px] rounded-md border border-white/25 bg-neutral-50/10 p-3 text-center"></div>
      </div>
      <div className="col-span-8">
        <Spinner />
      </div>
    </div>
  );
}
