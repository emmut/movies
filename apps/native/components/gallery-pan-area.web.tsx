import type { GalleryPanProps } from '@native/components/gallery-pan-area';
import { useRef } from 'react';

export function GalleryPanArea({ children, start, update, end, cancel }: GalleryPanProps) {
  const pointer = useRef<number | null>(null);
  return (
    <div
      className="flex min-h-0 flex-1 touch-none flex-col overflow-hidden select-none"
      data-testid="gallery-pan-area"
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) {
          return;
        }
        event.preventDefault();
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        start({ x: event.clientX, y: event.clientY, touch: event.pointerType === 'touch' });
      }}
      onPointerMove={(event) => {
        if (pointer.current === event.pointerId) {
          update({ x: event.clientX, y: event.clientY, touch: event.pointerType === 'touch' });
        }
      }}
      onPointerUp={(event) => {
        if (pointer.current === event.pointerId) {
          update({ x: event.clientX, y: event.clientY, touch: event.pointerType === 'touch' });
          pointer.current = null;
          end();
        }
      }}
      onPointerCancel={() => {
        pointer.current = null;
        cancel();
      }}
      onLostPointerCapture={() => {
        if (pointer.current !== null) {
          pointer.current = null;
          cancel();
        }
      }}
    >
      {children}
    </div>
  );
}
