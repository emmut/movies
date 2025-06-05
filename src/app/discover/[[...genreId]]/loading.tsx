import Movies from '@/components/movies';
import SectionTitle from '@/components/section-title';
import Spinner from '@/components/spinner';

export default function Loading() {
  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
      </div>

      <div className="relative mt-2 flex flex-wrap gap-2">
        <Spinner className="flex h-12 items-center justify-center" />
      </div>

      <div
        id="movies-container"
        tabIndex={0}
        className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <Movies.Ghosts />
      </div>

      <div className="mt-8 flex justify-center">
        <Spinner className="mx-auto" />
      </div>
    </>
  );
}
