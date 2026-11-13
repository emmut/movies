import { getSwipeMediaDirection } from '@movies/api/media-navigation';

export type GalleryPoint = { x: number; y: number; touch: boolean };
export type GalleryAxis = 'x' | 'y' | null;
export function galleryAxis(x: number, y: number): GalleryAxis {
  if (Math.max(Math.abs(x), Math.abs(y)) < 8) {
    return null;
  }
  return Math.abs(y) > Math.abs(x) ? 'y' : 'x';
}
export function galleryRelease(
  axis: GalleryAxis,
  x: number,
  y: number,
  touch: boolean,
  count: number,
) {
  if (axis === 'y' && touch && y >= 100) {
    return 'close';
  }
  if (axis === 'x' && count > 1) {
    return getSwipeMediaDirection(0, x);
  }
  return null;
}
