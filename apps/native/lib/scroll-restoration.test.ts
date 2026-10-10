import { canRestoreScroll } from '@native/lib/scroll-restoration';
import { describe, expect, it } from 'vitest';

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
