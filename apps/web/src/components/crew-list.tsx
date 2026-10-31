import { UserRound } from 'lucide-react';

import { BackTargetLink } from '@/components/back-target-link';
import { Imgproxy } from '@/components/image-proxy';
import { groupCrewMembers } from '@/lib/crew-members';
import type { CrewMember } from '@/types/movie';

/** Consistent, responsive person rows shared by the preview and full crew. */
export function CrewList({ crew }: { crew: CrewMember[] }) {
  return (
    <ul className="grid gap-x-6 sm:grid-cols-2">
      {groupCrewMembers(crew).map((person) => (
        <li key={person.id} className="min-w-0 border-b border-zinc-800">
          <BackTargetLink
            href={`/person/${person.id}`}
            className="flex h-full items-center gap-3 rounded-md py-3 pr-2 transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
              {person.profile_path !== null && person.profile_path !== '' ? (
                <Imgproxy
                  src={person.profile_path}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound aria-hidden="true" className="h-5 w-5 text-zinc-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium wrap-anywhere">{person.name}</p>
              <p className="text-sm wrap-anywhere text-zinc-400">{person.jobs.join(' · ')}</p>
            </div>
          </BackTargetLink>
        </li>
      ))}
    </ul>
  );
}
