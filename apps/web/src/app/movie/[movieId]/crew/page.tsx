import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CrewList } from '@/components/crew-list';
import { getMovieCredits, getMovieDetails } from '@/lib/movies';
import type { CrewMember } from '@/types/movie';

export default async function MovieCrewPage({ params }: { params: Promise<{ movieId: string }> }) {
  const { movieId } = await params;
  const id = Number(movieId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    notFound();
  }

  const [movie, credits] = await Promise.all([getMovieDetails(id), getMovieCredits(id)]);
  const departments = new Map<string, CrewMember[]>();
  for (const person of credits.crew) {
    const department = person.department === '' ? 'Other' : person.department;
    const members = departments.get(department) ?? [];
    members.push(person);
    departments.set(department, members);
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl">
      <Link
        href={`/movie/${id}`}
        className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-zinc-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
        Back to {movie.title}
      </Link>
      <h1 className="mb-1 text-3xl font-bold">Full crew</h1>
      <p className="mb-8 text-zinc-400">{movie.title}</p>
      {departments.size === 0 ? (
        <p className="text-zinc-400">No crew information available.</p>
      ) : (
        <div className="space-y-8">
          {[...departments]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([department, crew]) => (
              <section key={department} aria-label={department}>
                <h2 className="mb-2 text-xl font-semibold">{department}</h2>
                <CrewList crew={crew} />
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
