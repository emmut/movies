import { describe, expect, it } from 'vitest';

import { displayRating } from './home';

describe('card and detail rating display', () => {
  it.each([
    [7.31, 7.4],
    [8.21, 8.3],
    [8.2, 8.2],
    [0, 0],
    [10, 10],
  ])('displays %s as %s across clients', (rating, expected) => {
    expect(displayRating(rating)).toBe(expected);
  });
});
