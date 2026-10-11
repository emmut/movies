import { captureActiveScroll, registerScrollCapture } from '@native/lib/navigation-scroll';
import { expect, it, vi } from 'vitest';

it('captures the current screen before a tab action and ignores a stale blur cleanup', () => {
  const first = vi.fn();
  const second = vi.fn();
  const removeFirst = registerScrollCapture(first);
  captureActiveScroll();
  expect(first).toHaveBeenCalledOnce();
  const removeSecond = registerScrollCapture(second);
  removeFirst();
  captureActiveScroll();
  expect(first).toHaveBeenCalledOnce();
  expect(second).toHaveBeenCalledOnce();
  removeSecond();
  captureActiveScroll();
  expect(second).toHaveBeenCalledOnce();
});
