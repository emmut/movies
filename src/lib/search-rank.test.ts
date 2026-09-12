import { describe, expect, it } from 'vitest';

import { MATCH_TIER, matchTier, rankByTitleMatch } from './search-rank';

describe('matchTier', () => {
  it('grades exact, word-prefix, prefix, contains and none', () => {
    expect(matchTier({ title: 'Alien' }, 'alien')).toBe(MATCH_TIER.exact);
    expect(matchTier({ title: 'Alien: Romulus' }, 'alien')).toBe(MATCH_TIER.wordPrefix);
    expect(matchTier({ title: 'Aliens' }, 'alien')).toBe(MATCH_TIER.prefix);
    expect(matchTier({ title: 'Cowboys & Aliens' }, 'alien')).toBe(MATCH_TIER.contains);
    expect(matchTier({ title: 'Predator' }, 'alien')).toBe(MATCH_TIER.none);
  });

  it('folds case, accents and punctuation on both sides', () => {
    expect(matchTier({ title: 'Amélie' }, 'amelie')).toBe(MATCH_TIER.exact);
    expect(matchTier({ title: 'Spider-Man' }, 'spider man')).toBe(MATCH_TIER.exact);
    expect(matchTier({ title: 'WALL·E' }, 'wall e')).toBe(MATCH_TIER.exact);
    expect(matchTier({ title: 'Heat' }, '  HEAT  ')).toBe(MATCH_TIER.exact);
  });

  it('takes the best tier across title, original title and names', () => {
    expect(matchTier({ title: 'Le fabuleux destin', original_title: 'Amélie' }, 'amelie')).toBe(
      MATCH_TIER.exact,
    );
    expect(matchTier({ name: 'Brad Pitt' }, 'brad')).toBe(MATCH_TIER.wordPrefix);
    expect(matchTier({ name: 'Dark', original_name: 'Dark' }, 'dark')).toBe(MATCH_TIER.exact);
  });

  it('ignores empty names and empty queries', () => {
    expect(matchTier({ title: '', name: undefined }, 'alien')).toBe(MATCH_TIER.none);
    expect(matchTier({ title: 'Alien' }, '   ')).toBe(MATCH_TIER.none);
    expect(matchTier({}, 'alien')).toBe(MATCH_TIER.none);
  });
});

describe('rankByTitleMatch', () => {
  it('moves closer title matches ahead of looser ones', () => {
    const results = [
      { id: 1, title: 'Alien: Romulus' },
      { id: 2, title: 'Cowboys & Aliens' },
      { id: 3, title: 'Aliens' },
      { id: 4, title: 'Predator' },
      { id: 5, title: 'Alien' },
    ];

    expect(rankByTitleMatch('alien', results).map((result) => result.id)).toEqual([5, 1, 3, 2, 4]);
  });

  it('is stable within a tier so the incoming order breaks ties', () => {
    const results = [
      { id: 1, title: 'Alien: Covenant' },
      { id: 2, title: 'Alien' },
      { id: 3, title: 'Alien: Romulus' },
      { id: 4, title: 'Alien' },
      { id: 5, title: 'Alien: Resurrection' },
    ];

    expect(rankByTitleMatch('alien', results).map((result) => result.id)).toEqual([2, 4, 1, 3, 5]);
  });

  it('does not mutate the input and returns it as-is when too short to reorder', () => {
    const results = [
      { id: 1, title: 'Predator' },
      { id: 2, title: 'Alien' },
    ];
    const ranked = rankByTitleMatch('alien', results);
    expect(ranked).not.toBe(results);
    expect(results.map((result) => result.id)).toEqual([1, 2]);

    const single = [{ id: 1, title: 'Alien' }];
    expect(rankByTitleMatch('alien', single)).toBe(single);
    const empty: { title: string }[] = [];
    expect(rankByTitleMatch('alien', empty)).toBe(empty);
  });

  it('leaves the order alone when nothing matches', () => {
    const results = [
      { id: 1, title: 'Heat' },
      { id: 2, title: 'Ronin' },
      { id: 3, title: 'Thief' },
    ];
    expect(rankByTitleMatch('zzz', results).map((result) => result.id)).toEqual([1, 2, 3]);
  });
});
