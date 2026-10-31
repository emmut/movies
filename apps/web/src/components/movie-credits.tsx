import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { CastSlider } from '@/components/cast-slider';
import { CrewList } from '@/components/crew-list';
import { getBilledCastMembers } from '@/lib/cast-members';
import { getMovieCredits } from '@/lib/movies';
import { optional } from '@/lib/tmdb';

const WRITER_JOBS = new Set(['Writer', 'Screenplay', 'Story', 'Original Story']);

/** Credits stream independently and disappear when the optional request fails. */
export async function MovieCredits({ movieId }: { movieId: number }) {
  const credits = await optional(getMovieCredits(movieId), { id: movieId, cast: [], crew: [] });
  const directors = credits.crew.filter((person) => person.job === 'Director');
  const writers = credits.crew.filter((person) => WRITER_JOBS.has(person.job));

  return (
    <>
      {credits.crew.length > 0 && (
        <section aria-labelledby="crew-heading" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 id="crew-heading" className="text-xl font-semibold">
              Crew
            </h2>
            <Link
              href={`/movie/${movieId}/crew`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-zinc-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              View all crew <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          {directors.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-zinc-400">Directors</h3>
              <CrewList crew={directors} />
            </div>
          )}
          {writers.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-zinc-400">Writers</h3>
              <CrewList crew={writers} />
            </div>
          )}
        </section>
      )}
      <CastSlider cast={getBilledCastMembers(credits.cast)} />
    </>
  );
}
