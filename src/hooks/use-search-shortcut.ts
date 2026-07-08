'use client';

import { useEffect } from 'react';

const EDITABLE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

type ShortcutEvent = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  target: unknown;
};

function isEditableTarget(target: unknown) {
  const element = (target ?? {}) as { tagName?: string; isContentEditable?: boolean };
  return element.isContentEditable === true || EDITABLE_TAGS.includes(element.tagName ?? '');
}

/**
 * Whether a keydown should open the search palette: ⌘K/Ctrl+K anywhere, or
 * `/` when the user is not typing in a form field.
 */
export function shouldOpenSearch(event: ShortcutEvent) {
  if (event.key === 'k') {
    return event.metaKey || event.ctrlKey;
  }

  return event.key === '/' && !isEditableTarget(event.target);
}

/**
 * Registers the global keyboard shortcuts that open the search palette.
 *
 * @param onOpen - Called when a shortcut fires; must be referentially stable
 */
export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (shouldOpenSearch(event)) {
        event.preventDefault();
        onOpen();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onOpen]);
}
