import {
  canRestoreScroll,
  readScrollOffset,
  restoreScrollPosition,
} from '@native/lib/scroll-restoration';
import { describe, expect, it, vi } from 'vitest';

describe('restoring a remembered scroll position', () => {
  it.each([
    { offset: 0, content: 100, viewport: 0, ready: false },
    { offset: 0, content: 100, viewport: 200, ready: false },
    { offset: 0, content: 200, viewport: 200, ready: true },
    { offset: 300, content: 400, viewport: 200, ready: false },
    { offset: 300, content: 500, viewport: 200, ready: true },
    { offset: 300, content: 600, viewport: 200, ready: true },
    { offset: 1900, content: 2384, viewport: 600, ready: false },
    { offset: 1900, content: 2500, viewport: 600, ready: true },
  ])(
    'waits for the viewport and complete scroll range: $offset/$content/$viewport',
    ({ offset, content, viewport, ready }) => {
      expect(canRestoreScroll(offset, content, viewport)).toBe(ready);
    },
  );
});

describe('scroll adapters', () => {
  it('restores both scroll views and virtualized lists without animation', () => {
    const scrollTo = vi.fn();
    const scrollToOffset = vi.fn();
    restoreScrollPosition({ scrollTo }, 300);
    restoreScrollPosition({ scrollToOffset }, 400);
    expect(scrollTo).toHaveBeenCalledWith({ y: 300, animated: false });
    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 400, animated: false });
  });
  it.each([
    null,
    12,
    {},
    { scrollTop: 5 },
    { scrollTop: '12', clientHeight: 600 },
    { scrollTop: 0, clientHeight: 0 },
  ])('preserves the last event for native handles and hidden browser nodes %j', (node) => {
    expect(readScrollOffset(node, 1900)).toBe(1900);
  });
  it('captures the actual browser offset before blur and clamps overscroll', () => {
    expect(readScrollOffset({ scrollTop: 1900, clientHeight: 600 }, 1268)).toBe(1900);
    expect(readScrollOffset({ scrollTop: -10, clientHeight: 600 }, 300)).toBe(0);
  });
});
