'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
  type TransitionEvent,
} from 'react';

import type { MediaSlide } from '@/components/media-viewer';
import {
  getAdjacentMediaIndex,
  getSwipeMediaDirection,
  type MediaDirection,
} from '@/lib/media-navigation';

function getDragAxis(x: number, y: number) {
  if (Math.max(Math.abs(x), Math.abs(y)) < 8) {
    return null;
  }
  return Math.abs(y) > Math.abs(x) ? 'y' : 'x';
}

function getTrackTransform(count: number, moving: MediaDirection | null) {
  let offset = 'var(--media-drag, 0px)';
  if (moving) {
    offset = moving === 'next' ? '-100%' : '100%';
  }
  return `translate3d(calc(${count > 1 ? -100 : 0}% + ${offset}), 0, 0)`;
}

function getNeighbors(index: number, count: number) {
  const neighbors = [index];
  if (count > 1) {
    neighbors.unshift(getAdjacentMediaIndex(index, count, 'previous'));
    neighbors.push(getAdjacentMediaIndex(index, count, 'next'));
  }
  return neighbors;
}

/** Keep only the current image and its neighbors mounted, warming the browser's picture cache. */
export function ImageViewport({
  items,
  index,
  onMove,
  moving,
  onRequest,
  onClose,
  dialogRef,
}: {
  items: MediaSlide[];
  index: number;
  onMove: (direction: MediaDirection) => void;
  moving: MediaDirection | null;
  onRequest: (direction: MediaDirection) => void;
  onClose: () => void;
  dialogRef: RefObject<HTMLDivElement | null>;
}) {
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const drag = useRef(0);
  const dragY = useRef(0);
  const [closing, setClosing] = useState(false);
  const [settling, setSettling] = useState(false);
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    offset: number;
    offsetY: number;
    axis: 'x' | 'y' | null;
    width: number;
  } | null>(null);

  function writeDrag(value: number, y = 0, animateDismiss = false) {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    drag.current = value;
    dragY.current = y;
    track.current?.style.setProperty('--media-drag', `${value}px`);
    dialogRef.current?.style.setProperty('--media-dismiss-y', `${y}px`);
    let transition = 'none';
    if (animateDismiss) {
      transition = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)';
    }
    dialogRef.current?.style.setProperty('--media-dismiss-transition', transition);
  }

  function flushDrag() {
    frame.current = null;
    track.current?.style.setProperty('--media-drag', `${drag.current}px`);
    dialogRef.current?.style.setProperty('--media-dismiss-y', `${dragY.current}px`);
  }

  useEffect(
    () => () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    },
    [],
  );

  function finishMove() {
    if (pointer.current) {
      return;
    }
    if (closing) {
      onClose();
      return;
    }
    setSettling(false);
    if (!moving) {
      return;
    }
    onMove(moving);
    writeDrag(0);
  }

  // A suppressed transition may never emit an end or cancellation event.
  useEffect(() => {
    if (!moving) {
      return;
    }
    const timeout = window.setTimeout(() => onMove(moving), 350);
    return () => window.clearTimeout(timeout);
  }, [moving, onMove]);

  useEffect(() => {
    if (!closing) {
      return;
    }
    const timeout = window.setTimeout(onClose, 350);
    return () => window.clearTimeout(timeout);
  }, [closing, onClose]);

  function cancelDrag(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current?.id !== event.pointerId) {
      return;
    }
    pointer.current = null;
    setSettling(true);
    writeDrag(0, 0, true);
  }

  function handleTransition(event: TransitionEvent<HTMLDivElement>) {
    // A new slide cancels any earlier snap-back. That cancellation belongs to
    // the old gesture; only reduced motion should finish navigation immediately.
    if (
      event.type === 'transitioncancel' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    if (event.target === event.currentTarget && event.propertyName === 'transform') {
      finishMove();
    }
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) {
      return;
    }
    pointer.current = null;
    if (start.axis === 'y' && start.offsetY + event.clientY - start.y >= 100) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        onClose();
      } else {
        setClosing(true);
        writeDrag(0, window.innerHeight, true);
      }
      return;
    }
    const direction = getSwipeMediaDirection(start.x, event.clientX);
    if (start.axis === 'x' && direction && items.length > 1) {
      onRequest(direction);
    }
    setSettling(true);
    writeDrag(0, 0, true);
  }

  const neighbors = getNeighbors(index, items.length);

  return (
    <div
      className="relative min-h-0 flex-1 touch-none overflow-hidden select-none"
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0 || closing) {
          return;
        }
        const width = event.currentTarget.clientWidth;
        const transform = getComputedStyle(track.current!).transform;
        const matrix = new DOMMatrixReadOnly(transform);
        let offset = matrix.m41 + (items.length > 1 ? width : 0);
        // Rebase an interrupted slide onto its destination without moving the pixels.
        if (moving) {
          offset += moving === 'next' ? width : -width;
          onMove(moving);
        }
        const dismissTransform = getComputedStyle(dialogRef.current!).transform;
        const offsetY = new DOMMatrixReadOnly(dismissTransform).m42;
        writeDrag(offset, offsetY);
        setSettling(false);
        pointer.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          offset,
          offsetY,
          axis: null,
          width,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const start = pointer.current;
        if (!start || start.id !== event.pointerId) {
          return;
        }
        const x = event.clientX - start.x;
        const y = event.clientY - start.y;
        start.axis ??= getDragAxis(x, y);
        if (!start.axis) {
          return;
        }
        const limit = Math.max(start.width * 0.85, Math.abs(start.offset));
        drag.current = start.offset;
        if (start.axis === 'x' && items.length > 1) {
          drag.current = Math.max(-limit, Math.min(limit, start.offset + x));
        }
        dragY.current = start.axis === 'y' ? Math.max(0, start.offsetY + y) : start.offsetY;
        if (frame.current === null) {
          frame.current = requestAnimationFrame(flushDrag);
        }
      }}
      onPointerUp={endDrag}
      onPointerCancel={cancelDrag}
      onLostPointerCapture={cancelDrag}
    >
      <div
        ref={track}
        className="flex h-full w-full motion-reduce:transition-none!"
        style={{
          transform: getTrackTransform(items.length, moving),
          willChange: 'transform',
          transition:
            moving || settling || closing
              ? 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
        }}
        data-slot="media-image-track"
        onTransitionEnd={handleTransition}
        onTransitionCancel={handleTransition}
      >
        {neighbors.map((itemIndex, slot) => (
          <figure
            key={
              items.length === 2 && slot === 0
                ? `${items[itemIndex]!.id}-previous`
                : items[itemIndex]!.id
            }
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
