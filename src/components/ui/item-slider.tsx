'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { useHasHover } from '@/hooks/use-has-hover';

type ItemSliderProps = {
  children: ReactNode;
};

export function ItemSlider({ children }: ItemSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const hasHover = useHasHover();
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const preventClickRef = useRef(false);

  function handleMouseDown(e: React.MouseEvent) {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    if (e.button !== 0) {
      return;
    }

    isDraggingRef.current = true;
    preventClickRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = container.scrollLeft;
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDraggingRef.current) {
      return;
    }
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const walkX = e.pageX - startXRef.current;

    if (Math.abs(walkX) > 5) {
      preventClickRef.current = true;
      e.preventDefault();
      container.scrollLeft = scrollLeftRef.current - walkX;
    }
  }

  function handleMouseUp() {
    isDraggingRef.current = false;
  }

  function handleMouseLeave() {
    isDraggingRef.current = false;
  }

  function handleClickCapture(e: React.MouseEvent) {
    if (preventClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      preventClickRef.current = false;
    }
  }

  function handleDragStart(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      container.scrollBy({ left: -container.clientWidth * 0.75, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      container.scrollBy({ left: container.clientWidth * 0.75, behavior: 'smooth' });
    }
  }

  function updateArrowVisibility() {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
  }

  useEffect(() => {
    updateArrowVisibility();
  }, []);

  function scroll(direction: 'left' | 'right') {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  return (
    // `isolate`: the scroll arrows (z-20) and edge fades (z-10) stack above the
    // track, which is internal to the slider. Without a stacking context here
    // they compete with the sticky header's z-index and paint over it as the
    // slider scrolls past.
    <div className="relative isolate">
      {showLeftArrow && (
        <>
          {/*
            Unmounted rather than hidden without a pointer: an opacity-0 button
            still hit-tests and still takes focus, so it swallowed taps where it
            overlapped the sticky header and put a Tab stop on a control nobody
            could see. Arrow keys on the track below scroll the slider either
            way, so touch loses no affordance. The edge fade stays — it is the
            "more this way" hint, and it is the only one touch gets.
          */}
          {hasHover && (
            <button
              onClick={() => scroll('left')}
              className="absolute top-1/2 left-2 z-20 -translate-y-1/2 cursor-pointer rounded-full border border-muted-foreground/30 bg-background/80 p-2 transition-all hover:bg-muted/30"
            >
              <span className="sr-only">Previous slide</span>
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="pointer-events-none absolute inset-y-0 -left-3 z-10 w-10 bg-linear-to-r from-background to-transparent lg:w-30" />
        </>
      )}

      {showRightArrow && (
        <>
          {hasHover && (
            <button
              onClick={() => scroll('right')}
              className="absolute top-1/2 right-2 z-20 -translate-y-1/2 cursor-pointer rounded-full border border-muted-foreground/30 bg-background/80 p-2 transition-all hover:bg-muted/30"
            >
              <span className="sr-only">Next slide</span>
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          <div className="pointer-events-none absolute inset-y-0 -right-3 z-10 w-10 bg-linear-to-l from-background to-transparent lg:w-30" />
        </>
      )}

      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- drag-to-scroll + keyboard nav on a scroll container */}
      <div
        role="application"
        aria-label="Scrollable items"
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClickCapture={handleClickCapture}
        onDragStart={handleDragStart}
        onScroll={updateArrowVisibility}
        onKeyDown={handleKeyDown}
        /*
          `-mx-3` + `p-3` bleeds the scroll box 0.75rem past the wrapper on both
          sides so hover scale and focus rings are not clipped, while the
          padding keeps the items themselves aligned with the page content. The
          bleed must stay symmetric: those two clip edges are what the
          `-left-3`/`-right-3` fades are anchored to, and an edge that lands
          short of its fade shears items off mid-gradient instead of fading them
          out. No explicit width — `width: auto` already resolves to the
          wrapper's width plus both margins, so the two can never disagree.
        */
        className="relative -mx-3 scrollbar-hide flex cursor-grab snap-x gap-4 overflow-x-auto p-3 select-none active:cursor-grabbing [*]:cursor-grab active:[*]:cursor-grabbing"
      >
        {children}
      </div>
    </div>
  );
}
