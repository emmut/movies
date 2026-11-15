export type ImageDrag = {
  id: number;
  x: number;
  y: number;
  offset: number;
  offsetY: number;
  axis: 'x' | 'y' | null;
  width: number;
};

type DragEvent = { clientX: number; clientY: number; pointerType: string };

function getDragAxis(x: number, y: number) {
  if (Math.max(Math.abs(x), Math.abs(y)) < 8) {
    return null;
  }
  return Math.abs(y) > Math.abs(x) ? 'y' : 'x';
}

/** Locks the drag axis after the movement threshold; vertical dismissal is touch-only. */
export function readImageDrag(start: ImageDrag, event: DragEvent, count: number) {
  const x = event.clientX - start.x;
  const y = event.clientY - start.y;
  start.axis ??= getDragAxis(x, y);
  if (!start.axis || (start.axis === 'y' && event.pointerType !== 'touch')) {
    return null;
  }
  return {
    x: horizontalOffset(start, x, count),
    y: start.axis === 'y' ? Math.max(0, start.offsetY + y) : start.offsetY,
  };
}

function horizontalOffset(start: ImageDrag, delta: number, count: number) {
  if (start.axis !== 'x' || count <= 1) {
    return start.offset;
  }
  const limit = Math.max(start.width * 0.85, Math.abs(start.offset));
  return Math.max(-limit, Math.min(limit, start.offset + delta));
}

export function shouldDismissImage(
  start: ImageDrag,
  event: Pick<DragEvent, 'clientY' | 'pointerType'>,
) {
  return (
    event.pointerType === 'touch' &&
    start.axis === 'y' &&
    start.offsetY + event.clientY - start.y >= 100
  );
}
