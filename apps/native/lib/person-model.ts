import type { PersonDetail } from '@movies/api/person';
import type { CatalogStat } from '@native/lib/catalog-model';

function year(date: string | null) {
  if (!date) return null;
  const value = new Date(date).getFullYear();
  return Number.isFinite(value) ? value : null;
}
export function personStats(
  person: PersonDetail,
  credits: number | undefined,
  now = new Date(),
): CatalogStat[] {
  const stats: CatalogStat[] = [
    { label: 'Popularity', value: String(Math.round(person.popularity)), accent: 'yellow' },
    { label: 'Credits', value: credits === undefined ? '—' : String(credits), accent: 'purple' },
  ];
  const born = year(person.birthday);
  if (born) stats.push({ label: 'Born', value: String(born), accent: 'green' });
  if (born && !year(person.deathday)) {
    stats.push({ label: 'Age', value: String(now.getFullYear() - born), accent: 'green' });
  }
  if (person.birthplace)
    stats.push({
      label: 'Origin',
      value: person.birthplace.split(', ').slice(-1)[0],
      accent: 'blue',
    });
  return stats;
}
export function personFacts(person: PersonDetail) {
  const facts = [
    { label: 'Known for', value: person.department },
    { label: 'Birthday', value: person.birthday },
    { label: 'Died', value: person.deathday },
    { label: 'Place of birth', value: person.birthplace },
    { label: 'Also known as', value: person.aliases.join(', ') },
  ];
  return facts.filter((fact) => Boolean(fact.value));
}

export function personCreditCount(movie: unknown[] | undefined, tv: unknown[] | undefined) {
  return (movie?.length ?? 0) + (tv?.length ?? 0);
}
