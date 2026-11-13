'use client';

import { Button } from '@movies/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@movies/ui/components/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  createContext,
  useContext,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type TouchEvent,
} from 'react';

import { ImageViewport } from '@/components/image-viewport';
import {
  getAdjacentMediaIndex,
  getKeyboardMediaDirection,
  getSwipeMediaDirection,
  type MediaDirection,
} from '@/lib/media-navigation';

export type MediaSlide = { id: string; title: string; content: ReactNode };

const IMAGE_DIALOG_STYLE = {
  transform: 'translate3d(0, var(--media-dismiss-y, 0px), 0)',
  transition: 'var(--media-dismiss-transition, none)',
  willChange: 'transform',
};

const MediaViewerContext = createContext<((index: number) => void) | null>(null);

export function MediaViewerTrigger({
  index,
  label,
  className,
  children,
}: {
  index: number;
  label: string;
  className: string;
  children: ReactNode;
}) {
  const selectSlide = useContext(MediaViewerContext);
  if (!selectSlide) {
    throw new Error('MediaViewerTrigger must be inside MediaViewer');
  }

  return (
    <DialogTrigger className={className} aria-label={label} onClick={() => selectSlide(index)}>
      {children}
    </DialogTrigger>
  );
}

function MediaViewport({
  slide,
  onMove,
}: {
  slide: MediaSlide;
  onMove: (direction: MediaDirection) => void;
}) {
  const touchStart = useRef<number | null>(null);

  function handleTouchEnd(event: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (start === null || !touch) {
      return;
    }
    const direction = getSwipeMediaDirection(start, touch.clientX);
    if (direction) {
      onMove(direction);
    }
  }

  return (
    <figure
      aria-roledescription="slide"
      aria-label={slide.title}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStart.current = null;
      }}
      className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-2 [&_picture]:contents"
    >
      {slide.content}
    </figure>
  );
}

function MediaControls({
  title,
  index,
  count,
  onMove,
}: {
  title: string;
  index: number;
  count: number;
  onMove: (direction: MediaDirection) => void;
}) {
  return (
    <div className="shrink-0 space-y-2 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
      <p className="mx-auto line-clamp-2 max-w-3xl text-center text-sm font-medium wrap-anywhere">
        {title}
      </p>
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-11"
          aria-label="Previous media"
          disabled={count < 2}
          onClick={() => onMove('previous')}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <p
          className="min-w-16 text-center text-xs text-zinc-400 tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="sr-only">{title}. </span>
          {index + 1} of {count}
        </p>
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-11"
          aria-label="Next media"
          disabled={count < 2}
          onClick={() => onMove('next')}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export function MediaViewer({
  title,
  items,
  children,
  images = false,
}: {
  images?: boolean;
  title: string;
  items: MediaSlide[];
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [swipeDismissed, setSwipeDismissed] = useState(false);
  const [moving, setMoving] = useState<MediaDirection | null>(null);
  const selected = selectedIndex === null ? null : items[selectedIndex];

  function selectSlide(index: number) {
    setSwipeDismissed(false);
    setSelectedIndex(index);
  }

  function closeFromSwipe() {
    setSwipeDismissed(true);
    handleOpenChange(false);
  }

  function commitSlide(direction: MediaDirection) {
    setMoving(null);
    setSelectedIndex((current) =>
      current === null ? null : getAdjacentMediaIndex(current, items.length, direction),
    );
  }

  function moveSlide(direction: MediaDirection) {
    if (items.length < 2 || moving) {
      return;
    }
    if (images && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMoving(direction);
    } else {
      commitSlide(direction);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelectedIndex(null);
      setMoving(null);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setMoving(null);
      setSelectedIndex(event.key === 'Home' ? 0 : items.length - 1);
      return;
    }
    const direction = getKeyboardMediaDirection(event.key);
    if (!direction) {
      return;
    }
    event.preventDefault();
    moveSlide(direction);
  }

  return (
    <MediaViewerContext value={selectSlide}>
      <Dialog open={selectedIndex !== null} onOpenChange={handleOpenChange}>
        {children}
        <DialogContent
          ref={dialogRef}
          data-swipe-dismissed={swipeDismissed || undefined}
          style={images ? IMAGE_DIALOG_STYLE : undefined}
          showCloseButton={false}
          className="inset-0 top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-black p-0 text-white ring-0 data-[swipe-dismissed]:animate-none! motion-reduce:transition-none! sm:max-w-none"
          onKeyDown={handleKeyDown}
        >
          <DialogDescription className="sr-only">
            Use Left and Right arrow keys to browse. Home selects the first item and End selects the
            last. Press Escape to close.
          </DialogDescription>
          <div className="flex shrink-0 items-center justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-8">
            <DialogTitle className="min-w-0 truncate text-base leading-normal">{title}</DialogTitle>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="size-11"
                  aria-label="Close media viewer"
                />
              }
            >
              <X aria-hidden="true" />
            </DialogClose>
          </div>
          {selected && selectedIndex !== null && (
            <>
              {images ? (
                <ImageViewport
                  dialogRef={dialogRef}
                  items={items}
                  index={selectedIndex}
                  moving={moving}
                  onRequest={moveSlide}
                  onMove={commitSlide}
                  onClose={closeFromSwipe}
                />
              ) : (
                <MediaViewport key={selected.id} slide={selected} onMove={moveSlide} />
              )}
              <MediaControls
                title={selected.title}
                index={selectedIndex}
                count={items.length}
                onMove={moveSlide}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </MediaViewerContext>
  );
}
