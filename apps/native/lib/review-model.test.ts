import {
  formatReviewDate,
  isReviewExpandable,
  readReviewsInput,
  reviewCountLabel,
} from '@native/lib/review-model';
import { describe, expect, it } from 'vite-plus/test';

describe('native review presentation and route state', () => {
  it('formats review dates consistently and omits invalid dates', () => {
    expect(formatReviewDate('2026-10-28T12:00:00Z')).toBe('Oct 28, 2026');
    expect(formatReviewDate('2026-10-27T23:30:00-05:00')).toBe('Oct 28, 2026');
    expect(formatReviewDate('invalid')).toBeNull();
    expect(formatReviewDate('')).toBeNull();
  });
  it('offers expansion for long text or many short lines without hiding short reviews', () => {
    expect(isReviewExpandable('Short review.')).toBe(false);
    expect(isReviewExpandable('x'.repeat(300))).toBe(false);
    expect(isReviewExpandable('x'.repeat(301))).toBe(true);
    expect(isReviewExpandable('a\nb\nc\nd\ne\nf')).toBe(true);
  });
  it('uses readable counts without losing singular or zero states', () => {
    expect(reviewCountLabel(0)).toBe('0 reviews');
    expect(reviewCountLabel(1)).toBe('1 review');
    expect(reviewCountLabel(1200)).toBe('1,200 reviews');
  });
  it('accepts movie and TV routes, repeated parameters, and page-one defaults', () => {
    expect(readReviewsInput({ id: '42', type: 'movie' }).data).toEqual({
      id: 42,
      type: 'movie',
      page: 1,
    });
    expect(
      readReviewsInput({ id: ['42', '7'], type: ['tv', 'person'], page: ['2', '4'] }).data,
    ).toEqual({ id: 42, type: 'tv', page: 2 });
  });
  it.each(['0', '-1', '1.5', '501', 'invalid'])('resets invalid page %s to page one', (page) => {
    expect(readReviewsInput({ id: '42', type: 'movie', page }).data?.page).toBe(1);
  });
  it.each([
    { id: '2+2', type: 'movie' },
    { id: '42', type: 'person' },
    { id: '0', type: 'tv' },
    {},
  ])('rejects invalid title identifiers %j', (params) => {
    expect(readReviewsInput(params).success).toBe(false);
  });
});
