import type { Filter } from '@native/lib/discover-filters';
import { Pressable, Text } from 'react-native';

export type DiscoverFilterMenuProps = {
  label: string;
  choices: { filter: Filter; title: string; summary: string }[];
  onSelect: (filter: Filter) => void;
  onClear: () => void;
};

export function DiscoverFilterMenuItems({
  choices,
  onSelect,
  onClear,
}: Omit<DiscoverFilterMenuProps, 'label'>) {
  return (
    <>
      {choices.map((item) => (
        <Pressable
          key={item.filter}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          className="min-h-12 justify-center border-b border-border px-3 py-2"
          onPress={() => onSelect(item.filter)}
        >
          <Text className="font-semibold text-foreground">{item.title}</Text>
          <Text numberOfLines={1} className="text-xs text-muted">
            {item.summary}
          </Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        className="min-h-11 justify-center px-3"
        onPress={onClear}
      >
        <Text className="font-semibold text-foreground">Clear all filters</Text>
      </Pressable>
    </>
  );
}
