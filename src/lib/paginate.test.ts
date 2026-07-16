import { describe, expect, it } from 'vitest';

import { paginate } from './paginate';

describe('paginate', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  it('returns the requested page slice with metadata', () => {
    expect(paginate(items, 2, 2)).toEqual({
      pageItems: ['c', 'd'],
      totalItems: 5,
      totalPages: 3,
      currentPage: 2,
      itemsPerPage: 2,
    });
  });

  it('clamps past-the-end pages to the last page', () => {
    const result = paginate(items, 99, 2);

    expect(result.pageItems).toEqual(['e']);
    expect(result.currentPage).toBe(3);
  });

  it('clamps pages below 1 up to the first page', () => {
    const result = paginate(items, 0, 2);

    expect(result.pageItems).toEqual(['a', 'b']);
    expect(result.currentPage).toBe(1);
  });

  it('returns an empty first page for an empty set', () => {
    expect(paginate([], 3, 2)).toEqual({
      pageItems: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      itemsPerPage: 2,
    });
  });
});
