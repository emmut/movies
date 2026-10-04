import { describe, expect, it } from 'vitest';

import {
  getOptimisticGenreIds,
  getTotalActiveFilterCount,
  toggleGenre,
} from './genre-navigation-client';

describe('toggleGenre', () => {
  it('adds a genre that is not selected', () => {
    expect(toggleGenre([], 28)).toEqual([28]);
    expect(toggleGenre([35], 28)).toEqual([35, 28]);
  });

  it('removes a genre that is already selected', () => {
    expect(toggleGenre([28, 35], 28)).toEqual([35]);
    expect(toggleGenre([28], 28)).toEqual([]);
  });
});

describe('getTotalActiveFilterCount', () => {
  it('adds individual genre selections to the other active filters', () => {
    expect(getTotalActiveFilterCount(0, [])).toBe(0);
    expect(getTotalActiveFilterCount(2, [28, 35])).toBe(4);
  });
});

describe('getOptimisticGenreIds', () => {
  it('shows a pending selection while the URL state is unchanged', () => {
    expect(
      getOptimisticGenreIds([28], {
        baseGenreIds: [28],
        selectedGenreIds: [28, 35],
      }),
    ).toEqual([28, 35]);
  });

  it('uses the canonical selection after the URL state changes', () => {
    expect(
      getOptimisticGenreIds([28, 35], {
        baseGenreIds: [28],
        selectedGenreIds: [],
      }),
    ).toEqual([28, 35]);
  });
});
