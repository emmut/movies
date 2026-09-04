import { describe, expect, it } from 'vitest';

import { pageWindow } from './paginate';

describe('pageWindow', () => {
  it('returns the page metadata and row offset', () => {
    expect(pageWindow(5, 2, 2)).toEqual({
      totalItems: 5,
      totalPages: 3,
      currentPage: 2,
      itemsPerPage: 2,
      offset: 2,
    });
  });

  it('clamps past-the-end pages to the last page', () => {
    const result = pageWindow(5, 99, 2);

    expect(result.currentPage).toBe(3);
    expect(result.offset).toBe(4);
  });

  it('clamps pages below 1 up to the first page', () => {
    const result = pageWindow(5, 0, 2);

    expect(result.currentPage).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('reports no pages and the first page for an empty set', () => {
    expect(pageWindow(0, 3, 20)).toEqual({
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      itemsPerPage: 20,
      offset: 0,
    });
  });
});
