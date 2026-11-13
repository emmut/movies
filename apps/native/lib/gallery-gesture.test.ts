import { galleryAxis, galleryRelease } from '@native/lib/gallery-gesture';
import { describe, expect, it } from 'vite-plus/test';

describe('gallery gestures', () => {
  it('waits for deliberate motion and chooses the dominant axis', () => {
    expect(galleryAxis(7, 7)).toBeNull();
    expect(galleryAxis(8, 4)).toBe('x');
    expect(galleryAxis(40, 100)).toBe('y');
  });
  it('requires a downward touch swipe to dismiss', () => {
    expect(galleryRelease('y', 100, 99, true, 3)).toBeNull();
    expect(galleryRelease('y', 100, 100, true, 3)).toBe('close');
    expect(galleryRelease('y', 0, 150, false, 3)).toBeNull();
    expect(galleryRelease('y', 0, -150, true, 3)).toBeNull();
    expect(galleryRelease(null, 100, 150, true, 3)).toBeNull();
  });
  it('navigates only horizontal gestures and keeps single-image galleries still', () => {
    expect(galleryRelease('x', -59, 0, true, 3)).toBeNull();
    expect(galleryRelease('x', -60, 0, true, 3)).toBe('next');
    expect(galleryRelease('x', 60, 0, false, 3)).toBe('previous');
    expect(galleryRelease('x', -200, 0, true, 1)).toBeNull();
    expect(galleryRelease('y', -200, 20, true, 3)).toBeNull();
  });
});
