/* oxlint-disable jsx-a11y/prefer-tag-over-role -- summary is the native disclosure control; replacing it with button breaks details. */
import {
  DiscoverFilterMenuItems,
  type DiscoverFilterMenuProps,
} from '@native/components/discover-filter-menu-items';
import { ChevronDownIcon } from '@native/components/icons';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

/** Browser preview uses native disclosure; HeroUI's animated popover requires native layout measurements. */
export function DiscoverFilterMenu({ label, choices, onSelect, onClear }: DiscoverFilterMenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) {
        ref.current?.removeAttribute('open');
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && ref.current?.open) {
        ref.current?.removeAttribute('open');
        ref.current?.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  function close() {
    ref.current?.removeAttribute('open');
  }
  return (
    <details ref={ref} className="relative">
      <summary
        role="button"
        aria-label={label}
        className="bg-default flex min-h-12 cursor-pointer list-none items-center justify-center gap-1 rounded-xl border border-border px-3 [&::-webkit-details-marker]:hidden"
      >
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <ChevronDownIcon className="size-3 text-muted" accessible={false} />
      </summary>
      <View className="absolute top-full right-0 z-50 mt-2 w-68 rounded-xl border border-border bg-background p-2 shadow-lg">
        <DiscoverFilterMenuItems
          choices={choices}
          onSelect={(filter) => {
            close();
            onSelect(filter);
          }}
          onClear={() => {
            close();
            onClear();
          }}
        />
      </View>
    </details>
  );
}
