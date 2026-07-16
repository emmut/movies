import Link from 'next/link';
import { Users } from 'lucide-react';

import { CastSlider } from '@/components/cast-slider';
import { Imgproxy } from '@/components/image-proxy';
import { getMovieCredits } from '@/lib/movies';
import { optional } from '@/lib/tmdb';

const WRITER_JOBS = new Set(['Writer', 'Screenplay', 'Story', 'Original Story']);

/**
 * Directors, writers, and billed cast for a movie. Fetched independently so a
 * slow or failed `/credits` response streams in (or degrades to nothing)
 * without blocking the rest of the page.
 */
export async function MovieCredits({ movieId }: { movieId: number }) {
  const credits = await optional(getMovieCredits(movieId), { id: movieId, cast: [], crew: [] });

  const directors = credits.crew.filter((person) => person.job === 'Director');
  const writers = credits.crew.filter((person) => WRITER_JOBS.has(person.job));

  return (
    <>
      {directors.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Directors</h2>
          <div className="flex flex-wrap gap-4">
            {directors.map((director) => (
              <Link
                key={director.credit_id}
                href={`/person/${director.id}`}
                className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
              >
                {director.profile_path ? (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Imgproxy
                      src={director.profile_path}
                      alt={director.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700">
                    <Users className="h-5 w-5 text-zinc-400" />
                  </div>
                )}
                <span className="font-medium hover:text-white">{director.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {writers.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Writers</h2>
          <div className="flex flex-wrap gap-4">
            {writers.map((writer) => (
              <div
                key={writer.credit_id}
                className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3"
              >
                {writer.profile_path ? (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Imgproxy
                      src={writer.profile_path}
                      alt={writer.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700">
                    <Users className="h-5 w-5 text-zinc-400" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{writer.name}</span>
                  <span className="text-xs text-zinc-400">{writer.job}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CastSlider cast={credits.cast} />
    </>
  );
}
