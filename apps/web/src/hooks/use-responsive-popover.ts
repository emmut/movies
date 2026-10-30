import { useEffect, useRef, useState } from 'react';

/** Close portaled content when a responsive layout hides its trigger. */
export function useResponsivePopover() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (trigger.getClientRects().length === 0) {
        setOpen(false);
      }
    });
    observer.observe(trigger);
    return () => observer.disconnect();
  }, []);

  return { open, setOpen, triggerRef };
}
