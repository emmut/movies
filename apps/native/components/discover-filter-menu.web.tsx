import { Popover } from '@base-ui/react/popover';
import {
  DiscoverFilterMenuItems,
  type DiscoverFilterMenuProps,
} from '@native/components/discover-filter-menu-items';
import { ChevronDownIcon } from '@native/components/icons';
import { useState } from 'react';
import { Text } from 'react-native';

/** Use DOM positioning and focus management in the browser; HeroUI handles native platforms. */
export function DiscoverFilterMenu({ label, choices, onSelect, onClear }: DiscoverFilterMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="bg-default flex min-h-12 cursor-pointer items-center justify-center gap-1 rounded-xl border border-border px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <ChevronDownIcon className="size-3 text-muted" accessible={false} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8} collisionPadding={16} className="z-50">
          <Popover.Popup
            aria-label="Discovery filters"
            className="flex max-h-(--available-height) w-68 max-w-(--available-width) flex-col overflow-y-auto rounded-xl border border-border bg-background p-2 shadow-lg outline-none"
          >
            <DiscoverFilterMenuItems
              choices={choices}
              onSelect={(filter) => {
                setOpen(false);
                onSelect(filter);
              }}
              onClear={() => {
                setOpen(false);
                onClear();
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
