import type { MediaDirection } from '@movies/api/media-navigation';
import type { ReactNode } from 'react';
export type GalleryKeyboardProps = {
  children: ReactNode;
  move: (direction: MediaDirection) => void;
  jump: (index: number) => void;
  count: number;
  close: () => void;
};
/** Native Modal supplies system Back and screen-reader focus containment. */
export function GalleryKeyboard({ children }: GalleryKeyboardProps) {
  return children;
}
