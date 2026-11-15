import {
  DiscoverFilterMenuItems,
  type DiscoverFilterMenuProps,
} from '@native/components/discover-filter-menu-items';
import { ChevronDownIcon } from '@native/components/icons';
import { Popover } from 'heroui-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

export function DiscoverFilterMenu({ label, choices, onSelect, onClear }: DiscoverFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const trigger = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Choose a discovery filter"
      className="bg-default min-h-12 flex-row items-center justify-center gap-1 rounded-xl border border-border px-3"
      accessibilityState={{ expanded: open }}
    >
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <ChevronDownIcon className="size-3 text-muted" accessible={false} />
    </Pressable>
  );
  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal disableFullWindowOverlay>
        <Popover.Overlay />
        <Popover.Content
          presentation="popover"
          placement="bottom"
          align="end"
          width={272}
          className="rounded-xl border border-border bg-background p-2"
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
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
}
