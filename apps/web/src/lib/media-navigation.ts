export type MediaDirection = 'previous' | 'next';

const SWIPE_THRESHOLD = 60;
const KEYBOARD_DIRECTIONS = new Map<string, MediaDirection>([
  ['ArrowLeft', 'previous'],
  ['ArrowRight', 'next'],
]);

export function getKeyboardMediaDirection(key: string): MediaDirection | null {
  return KEYBOARD_DIRECTIONS.get(key) ?? null;
}

export function getSwipeMediaDirection(startX: number, endX: number): MediaDirection | null {
  const distance = startX - endX;
  if (Math.abs(distance) >= SWIPE_THRESHOLD) {
    return distance > 0 ? 'next' : 'previous';
  }
  return null;
}

export function getAdjacentMediaIndex(index: number, count: number, direction: MediaDirection) {
  const offset = direction === 'next' ? 1 : -1;
  return (index + offset + count) % count;
}
