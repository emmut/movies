import type { AggregateCredits, CastMemberSummary } from '@movies/api/tmdb-types/pdp';

type BilledCastMember = Omit<CastMemberSummary, 'episodeCount'>;

export function getBilledCastMembers(cast: BilledCastMember[]): CastMemberSummary[] {
  return cast.map(({ id, name, character, profile_path }) => ({
    id,
    name,
    character,
    profile_path,
    episodeCount: null,
  }));
}

export function getSeriesCastMembers(cast: AggregateCredits['cast']): CastMemberSummary[] {
  return cast.map((person) => ({
    id: person.id,
    name: person.name,
    profile_path: person.profile_path,
    character: [...new Set(person.roles.map((role) => role.character).filter(Boolean))].join(', '),
    episodeCount: person.total_episode_count,
  }));
}
