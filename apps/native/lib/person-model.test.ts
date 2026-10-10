import type { PersonDetail } from '@movies/api/person';
import { personCreditCount, personFacts, personStats } from '@native/lib/person-model';
import { describe, expect, it } from 'vitest';

const person: PersonDetail = {
  id: 7,
  name: 'Person',
  biography: '',
  profileUrl: null,
  birthday: '1970-01-01',
  deathday: null,
  birthplace: 'Stockholm, Sweden',
  department: 'Acting',
  aliases: ['Alias'],
  popularity: 8.2,
  homepage: null,
  imdbUrl: null,
};
describe('person display metadata', () => {
  it('preserves web birth-year/age and origin conventions with a pending credit count', () => {
    expect(personStats(person, undefined, new Date('2026-10-10'))).toEqual([
      { label: 'Popularity', value: '8', accent: 'yellow' },
      { label: 'Credits', value: '—', accent: 'purple' },
      { label: 'Born', value: '1970', accent: 'green' },
      { label: 'Age', value: '56', accent: 'green' },
      { label: 'Origin', value: 'Sweden', accent: 'blue' },
    ]);
  });
  it('omits absent dates/origin and does not show an age for deceased people', () => {
    expect(
      personStats({ ...person, deathday: '2020-01-01' }, 3).some((stat) => stat.label === 'Age'),
    ).toBe(false);
    expect(personStats({ ...person, birthday: 'invalid', birthplace: null }, 0)).toHaveLength(2);
    expect(personStats({ ...person, birthday: null, birthplace: null }, 0)).toHaveLength(2);
  });
  it('keeps only supplied facts, including deathday and aliases', () => {
    expect(personFacts({ ...person, deathday: '2020-01-01' })).toContainEqual({
      label: 'Died',
      value: '2020-01-01',
    });
    expect(
      personFacts({ ...person, department: '', birthday: null, birthplace: null, aliases: [] }),
    ).toEqual([]);
  });
});

it('keeps credit totals unknown until both filmography sections are available', () => {
  expect(personCreditCount(undefined, undefined)).toBeUndefined();
  expect(personCreditCount([{}], undefined)).toBeUndefined();
  expect(personCreditCount(undefined, [{}])).toBeUndefined();
  expect(personCreditCount([], [])).toBe(0);
  expect(personCreditCount([{}], [{}, {}])).toBe(3);
});
