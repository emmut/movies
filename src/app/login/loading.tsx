import Spinner from '@/components/spinner';

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-zinc-400">Loading...</p>
    </div>
  );
}
