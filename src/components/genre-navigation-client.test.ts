import { describe, expect, it } from 'vitest';

import { toggleGenre } from './genre-navigation-client';

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
