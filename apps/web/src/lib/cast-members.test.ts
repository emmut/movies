import { describe, expect, it } from 'vite-plus/test';

import { getBilledCastMembers, getSeriesCastMembers } from './cast-members';

describe('Cast card data', () => {
  it('preserves billed order, characters, and missing artwork without inventing episode counts', () => {
    const cast = [
      { id: 2, name: 'Second', character: 'Detective', profile_path: null },
      { id: 1, name: 'First', character: 'Narrator', profile_path: '/profile.jpg' },
    ];
    expect(getBilledCastMembers(cast)).toEqual([
      { ...cast[0], episodeCount: null },
      { ...cast[1], episodeCount: null },
    ]);
    expect(cast[0]).not.toHaveProperty('episodeCount');
  });

  it('deduplicates nonempty series roles in their original order and preserves totals', () => {
    const roles = [
      { character: 'Detective', episode_count: 2 },
      { character: '', episode_count: 1 },
      { character: 'Narrator', episode_count: 1 },
      { character: 'Detective', episode_count: 1 },
    ];
    expect(
      getSeriesCastMembers([
        { id: 42, name: 'Actor', profile_path: null, total_episode_count: 5, roles },
        { id: 43, name: 'Guest', profile_path: '/guest.jpg', total_episode_count: 0, roles: [] },
      ]),
    ).toEqual([
      {
        id: 42,
        name: 'Actor',
        profile_path: null,
        character: 'Detective, Narrator',
        episodeCount: 5,
      },
      { id: 43, name: 'Guest', profile_path: '/guest.jpg', character: '', episodeCount: 0 },
    ]);
    expect(roles).toHaveLength(4);
  });

  it('keeps empty cast lists empty', () => {
    expect(getBilledCastMembers([])).toEqual([]);
    expect(getSeriesCastMembers([])).toEqual([]);
  });
});
