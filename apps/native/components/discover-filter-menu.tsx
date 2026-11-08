import {
  DiscoverFilterMenuItems,
  type DiscoverFilterMenuProps,
} from '@native/components/discover-filter-menu-items';
import { ChevronDownIcon } from '@native/components/icons';
import { Popover } from 'heroui-native';
import { useState } from 'react';
import { ActionSheetIOS, Platform, Pressable, Text } from 'react-native';

export function DiscoverFilterMenu({ label, choices, onSelect, onClear }: DiscoverFilterMenuProps) {
  const [open, setOpen] = useState(false);
  function showNativeMenu() {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Filters',
        options: [
          ...choices.map((item) => `${item.title}: ${item.summary}`),
          'Clear all filters',
          'Cancel',
        ],
        cancelButtonIndex: choices.length + 1,
      },
      (index) => {
        if (index < choices.length) {
          onSelect(choices[index].filter);
        } else if (index === choices.length) {
          onClear();
        }
      },
    );
  }
  const trigger = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Choose a discovery filter"
      className="bg-default min-h-11 flex-row items-center justify-center gap-1 rounded-xl border border-border px-3"
      onPress={Platform.OS === 'ios' ? showNativeMenu : undefined}
    >
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <ChevronDownIcon className="size-3 text-muted" accessible={false} />
    </Pressable>
  );
  if (Platform.OS === 'ios') {
    return trigger;
  }
  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Overlay />
        <Popover.Content presentation="popover" placement="bottom" align="end" width={272}>
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
