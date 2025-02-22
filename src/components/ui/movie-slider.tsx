'use client';
import { ReactNode, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type MovieSliderProps = {
  children: ReactNode;
};

export function MovieSlider({ children }: MovieSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [disableArrows, setDisableArrows] = useState(false);

  // Check scroll position and update arrow visibility
  const updateArrowVisibility = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    const container = scrollContainerRef.current;
    const supportsHover = window.matchMedia('(hover: hover)').matches;

    if (!supportsHover) {
      setDisableArrows(true);
    }

    if (container) {
      container.addEventListener('scroll', updateArrowVisibility, {
        signal: controller.signal,
      });
      // Initial check
      updateArrowVisibility();

      return () => {
        controller.abort();
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      {showLeftArrow && (
        <>
          <button
            onClick={() => scroll('left')}
            className={cn(
              'border-muted-foreground/30 hover:bg-muted/30 bg-background/80 absolute top-1/2 left-2 z-20 -translate-y-1/2 cursor-pointer rounded-full border p-2 transition-all',
              { 'opacity-0': disableArrows }
            )}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div
            className={`from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-30 bg-gradient-to-r to-transparent ${!showLeftArrow ? 'opacity-0' : ''}`}
          />
        </>
      )}

      <div
        ref={scrollContainerRef}
        className="scrollbar-thin relative flex snap-x space-x-4 overflow-x-auto pb-2"
      >
        {children}
      </div>

      {showRightArrow && (
        <>
          <button
            onClick={() => scroll('right')}
            className={cn(
              'border-muted-foreground/30 hover:bg-muted/30 bg-background/80 absolute top-1/2 right-2 z-20 -translate-y-1/2 cursor-pointer rounded-full border p-2 transition-all',
              { 'opacity-0': disableArrows }
            )}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div
            className={`from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-30 bg-gradient-to-l to-transparent ${!showRightArrow ? 'opacity-0' : ''}`}
          />
        </>
      )}
    </div>
  );
}
