import type { CrewMember } from '@/types/movie';

/** One entry per person, preserving billing order and every distinct job. */
export function groupCrewMembers(crew: CrewMember[]) {
  const people = new Map<
    number,
    Pick<CrewMember, 'id' | 'name' | 'profile_path'> & { jobs: string[] }
  >();
  for (const person of crew) {
    const existing = people.get(person.id);
    if (existing !== undefined) {
      if (!existing.jobs.includes(person.job)) {
        existing.jobs.push(person.job);
      }
    } else {
      people.set(person.id, {
        id: person.id,
        name: person.name,
        profile_path: person.profile_path,
        jobs: [person.job],
      });
    }
  }
  return [...people.values()];
}
