'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { useIsClient } from '@/hooks/use-is-client';
import { cn } from '@/lib/utils';

type ItemSliderProps = {
  children: ReactNode;
};

export function ItemSlider({ children }: ItemSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const isClient = useIsClient();
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

  const disableArrows = isClient ? !window.matchMedia('(hover: hover)').matches : false;

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
    <div className="relative">
      {showLeftArrow && (
        <>
          <button
            onClick={() => scroll('left')}
            className={cn(
              'absolute top-1/2 left-2 z-20 -translate-y-1/2 cursor-pointer rounded-full border border-muted-foreground/30 bg-background/80 p-2 transition-all hover:bg-muted/30',
              { 'opacity-0': disableArrows },
            )}
          >
            <span className="sr-only">Previous slide</span>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div
            className={`pointer-events-none absolute inset-y-0 -left-3 z-10 w-10 bg-linear-to-r from-background to-transparent lg:w-30 ${!showLeftArrow ? 'opacity-0' : ''}`}
          />
        </>
      )}

      {showRightArrow && (
        <>
          <button
            onClick={() => scroll('right')}
            className={cn(
              'absolute top-1/2 right-2 z-20 -translate-y-1/2 cursor-pointer rounded-full border border-muted-foreground/30 bg-background/80 p-2 transition-all hover:bg-muted/30',
              { 'opacity-0': disableArrows },
            )}
          >
            <span className="sr-only">Next slide</span>
            <ChevronRight className="h-6 w-6" />
          </button>
          <div
            className={`pointer-events-none absolute inset-y-0 -right-3 z-10 w-10 bg-linear-to-l from-background to-transparent lg:w-30 ${!showRightArrow ? 'opacity-0' : ''}`}
          />
        </>
      )}

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
        className="relative -mx-3 scrollbar-hide flex w-[calc(100%+0.75rem)] cursor-grab snap-x gap-4 overflow-x-auto p-3 select-none active:cursor-grabbing [*]:cursor-grab active:[*]:cursor-grabbing"
      >
        {children}
      </div>
    </div>
  );
}
