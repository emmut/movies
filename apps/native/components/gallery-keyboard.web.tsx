import { getKeyboardMediaDirection } from '@movies/api/media-navigation';
import type { GalleryKeyboardProps } from '@native/components/gallery-keyboard';
import { useEffect, useRef, type KeyboardEvent } from 'react';

function moveTabFocus(event: KeyboardEvent<HTMLDialogElement>) {
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), iframe, [href], [tabindex="0"]',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  if (controls.length === 0) {
    return;
  }
  const current = controls.indexOf(document.activeElement as HTMLElement);
  const direction = event.shiftKey ? -1 : 1;
  let next = (current + direction + controls.length) % controls.length;
  if (current < 0) {
    next = event.shiftKey ? controls.length - 1 : 0;
  }
  event.preventDefault();
  controls[next].focus();
}

/** DOM keyboard/focus APIs belong to the browser preview adapter. */
export function GalleryKeyboard({ children, move, jump, count, close }: GalleryKeyboardProps) {
  const container = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    container.current?.querySelector<HTMLElement>('[aria-label="Close media viewer"]')?.focus();
    return () => {
      requestAnimationFrame(() => {
        if (previous instanceof HTMLElement && previous.isConnected) {
          previous.focus();
        }
      });
    };
  }, []);
  return (
    <dialog
      open
      tabIndex={-1}
      ref={container}
      className="relative m-0 flex min-h-0 w-full max-w-none flex-1 flex-col border-0 bg-transparent p-0 text-inherit"
      aria-modal="true"
      aria-label="Media gallery"
      aria-describedby="gallery-instructions"
      onKeyDown={(event) => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
          return;
        }
        if (event.key === 'Tab') {
          moveTabFocus(event);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
          return;
        }
        if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          jump(event.key === 'Home' ? 0 : count - 1);
          return;
        }
        const direction = getKeyboardMediaDirection(event.key);
        if (direction) {
          event.preventDefault();
          move(direction);
        }
      }}
    >
      <p id="gallery-instructions" className="sr-only">
        Use Left and Right arrow keys to browse. Home selects the first item and End selects the
        last. Press Escape to close.
      </p>
      {children}
    </dialog>
  );
}
