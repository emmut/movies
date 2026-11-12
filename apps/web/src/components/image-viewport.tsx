'use client';

import { useRef, useState, type PointerEvent } from 'react';

import type { MediaSlide } from '@/components/media-viewer';
import {
  getAdjacentMediaIndex,
  getSwipeMediaDirection,
  type MediaDirection,
} from '@/lib/media-navigation';

/** Keep only the current image and its neighbors mounted, warming the browser's picture cache. */
export function ImageViewport({
  items,
  index,
  onMove,
  moving,
  onRequest,
}: {
  items: MediaSlide[];
  index: number;
  onMove: (direction: MediaDirection) => void;
  moving: MediaDirection | null;
  onRequest: (direction: MediaDirection) => void;
}) {
  const [drag, setDrag] = useState(0);
  const [settling, setSettling] = useState(false);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);

  function finishMove() {
    setSettling(false);
    if (!moving) return;
    onMove(moving);
    setDrag(0);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== event.pointerId) return;
    const direction = getSwipeMediaDirection(start.x, event.clientX);
    if (direction && Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y)) {
      onRequest(direction);
    }
    setSettling(true);
    setDrag(0);
  }

  const neighbors =
    items.length > 1
      ? [
          getAdjacentMediaIndex(index, items.length, 'previous'),
          index,
          getAdjacentMediaIndex(index, items.length, 'next'),
        ]
      : [index];

  return (
    <div
      className="relative min-h-0 flex-1 touch-pan-y overflow-hidden select-none"
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0 || moving || items.length < 2) return;
        setSettling(false);
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const start = pointer.current;
        if (!start || start.id !== event.pointerId) return;
        const x = event.clientX - start.x;
        if (Math.abs(event.clientY - start.y) > Math.abs(x)) {
          pointer.current = null;
          setDrag(0);
          return;
        }
        const limit = event.currentTarget.clientWidth * 0.85;
        setDrag(Math.max(-limit, Math.min(limit, x)));
      }}
      onPointerUp={endDrag}
      onPointerCancel={() => {
        pointer.current = null;
        setDrag(0);
      }}
      onLostPointerCapture={() => {
        pointer.current = null;
        setDrag(0);
      }}
    >
      <div
        className="flex h-full w-full motion-reduce:transition-none!"
        style={{
          transform: `translateX(calc(${items.length > 1 ? -100 : 0}% + ${moving ? (moving === 'next' ? '-100%' : '100%') : `${drag}px`}))`,
          transition:
            moving || settling ? 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
        onTransitionEnd={finishMove}
      >
        {neighbors.map((itemIndex, slot) => (
          <figure
            key={slot}
            aria-roledescription="slide"
            aria-label={items[itemIndex]!.title}
            aria-hidden={itemIndex !== index || (neighbors.length > 1 && slot !== 1)}
            className="flex h-full min-w-full items-center justify-center px-4 py-2 [&_picture]:contents"
          >
            {items[itemIndex]!.content}
          </figure>
        ))}
      </div>
    </div>
  );
}
