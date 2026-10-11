import {
  canRestoreScroll,
  clampScrollOffset,
  readScrollOffset,
  readScrollDimensions,
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

describe('native transparent-header insets', () => {
  it('preserves the native resting position below a translucent header', () => {
    expect(clampScrollOffset(-88, 88)).toBe(-88);
    expect(clampScrollOffset(300, 88)).toBe(300);
  });
  it('clamps bounce to the inset edge and uses zero for browsers without native insets', () => {
    expect(clampScrollOffset(-120, 88)).toBe(-88);
    expect(clampScrollOffset(-20, 0)).toBe(0);
    expect(clampScrollOffset(-20, -1)).toBe(0);
  });
});

it('checks the current browser layout rather than stale measurements when returning', () => {
  expect(readScrollDimensions({ scrollHeight: 1868, clientHeight: 600 }, 2500, 600)).toEqual({
    content: 1868,
    viewport: 600,
  });
  expect(readScrollDimensions({ scrollHeight: 0, clientHeight: 0 }, 2500, 600)).toEqual({
    content: 0,
    viewport: 0,
  });
  expect(readScrollDimensions(null, 2500, 600)).toEqual({ content: 2500, viewport: 600 });
});
