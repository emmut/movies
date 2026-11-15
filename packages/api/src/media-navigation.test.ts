import { describe, expect, it } from 'vite-plus/test';

import {
  getAdjacentMediaIndex,
  getKeyboardMediaDirection,
  getSwipeMediaDirection,
} from './media-navigation';

describe('Media carousel navigation', () => {
  it('maps arrow keys without intercepting unrelated keys', () => {
    expect(getKeyboardMediaDirection('ArrowLeft')).toBe('previous');
    expect(getKeyboardMediaDirection('ArrowRight')).toBe('next');
    for (const key of ['Escape', 'Enter', ' ', 'Home', 'toString']) {
      expect(getKeyboardMediaDirection(key)).toBeNull();
    }
  });

  it('wraps at both ends and moves between neighboring slides', () => {
    expect(getAdjacentMediaIndex(3, 4, 'next')).toBe(0);
    expect(getAdjacentMediaIndex(0, 4, 'previous')).toBe(3);
    expect(getAdjacentMediaIndex(1, 4, 'next')).toBe(2);
    expect(getAdjacentMediaIndex(2, 4, 'previous')).toBe(1);
  });

  it('stays on the only slide in a single-item gallery', () => {
    expect(getAdjacentMediaIndex(0, 1, 'previous')).toBe(0);
    expect(getAdjacentMediaIndex(0, 1, 'next')).toBe(0);
  });

  it('requires a 60-pixel swipe in either direction', () => {
    expect(getSwipeMediaDirection(100, 100)).toBeNull();
    expect(getSwipeMediaDirection(100, 41)).toBeNull();
    expect(getSwipeMediaDirection(100, 159)).toBeNull();
    expect(getSwipeMediaDirection(NaN, 100)).toBeNull();
    expect(getSwipeMediaDirection(100, 40)).toBe('next');
    expect(getSwipeMediaDirection(100, 160)).toBe('previous');
  });
});
