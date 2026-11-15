import { describe, expect, it } from 'vite-plus/test';

import { readImageDrag, shouldDismissImage, type ImageDrag } from './image-drag';

function start(overrides: Partial<ImageDrag> = {}): ImageDrag {
  return { id: 1, x: 10, y: 20, offset: 0, offsetY: 0, axis: null, width: 400, ...overrides };
}
function event(clientX: number, clientY: number, pointerType = 'touch') {
  return { clientX, clientY, pointerType };
}

describe('image drag coordinates', () => {
  it('ignores jitter, then locks the first meaningful axis', () => {
    const gesture = start();
    expect(readImageDrag(gesture, event(13, 24), 3)).toBeNull();
    expect(gesture.axis).toBeNull();
    expect(readImageDrag(gesture, event(30, 24), 3)).toEqual({ x: 20, y: 0 });
    expect(readImageDrag(gesture, event(40, 200), 3)).toEqual({ x: 30, y: 0 });
    expect(gesture.axis).toBe('x');
  });
  it('clamps horizontal travel and preserves an interrupted slide offset', () => {
    expect(readImageDrag(start(), event(1000, 20), 3)).toEqual({ x: 340, y: 0 });
    expect(readImageDrag(start(), event(-1000, 20), 3)).toEqual({ x: -340, y: 0 });
    expect(readImageDrag(start({ offset: -380 }), event(-10, 20), 3)).toEqual({ x: -380, y: 0 });
  });
  it('keeps a single image stationary on horizontal drags', () => {
    expect(readImageDrag(start(), event(100, 20), 1)).toEqual({ x: 0, y: 0 });
  });
  it('permits downward touch dismissal, preserving the existing vertical offset', () => {
    const gesture = start({ offsetY: 40 });
    expect(readImageDrag(gesture, event(10, 50), 3)).toEqual({ x: 0, y: 70 });
    expect(readImageDrag(gesture, event(10, -100), 3)).toEqual({ x: 0, y: 0 });
  });
  it('ignores vertical mouse drags', () => {
    expect(readImageDrag(start(), event(10, 200, 'mouse'), 3)).toBeNull();
  });
});

describe('image dismissal threshold', () => {
  it('dismisses only a vertical touch drag reaching 100 pixels', () => {
    const gesture = start({ axis: 'y', offsetY: 40 });
    expect(shouldDismissImage(gesture, event(10, 79))).toBe(false);
    expect(shouldDismissImage(gesture, event(10, 80))).toBe(true);
    expect(shouldDismissImage(gesture, event(10, 200, 'mouse'))).toBe(false);
    expect(shouldDismissImage(start({ axis: 'x' }), event(10, 200))).toBe(false);
    expect(shouldDismissImage(start(), event(10, 200))).toBe(false);
  });
});
