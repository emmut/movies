import { ArrowDownIcon, ArrowUpIcon } from '@native/components/icons';
import { Pressable, Text, View } from 'react-native';

export function ListMoveControls({
  name,
  position,
  total,
  pending,
  move,
}: {
  name: string;
  position: number;
  total: number;
  pending: boolean;
  move: (position: number) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {(['up', 'down'] as const).map((direction) => {
        const disabled = pending || (direction === 'up' ? position <= 0 : position >= total - 1);
        const Icon = direction === 'up' ? ArrowUpIcon : ArrowDownIcon;
        return (
          <Pressable
            key={direction}
            accessibilityRole="button"
            accessibilityLabel={'Move ' + name + ' ' + direction}
            disabled={disabled}
            accessibilityState={{ disabled }}
            className="bg-default min-h-12 min-w-12 items-center justify-center rounded-lg px-3"
            onPress={() => move(position + (direction === 'up' ? -1 : 1))}
          >
            <Icon className="size-5 text-foreground" accessible={false} />
          </Pressable>
        );
      })}
    </View>
  );
}
export function ListPageControls({
  page,
  pages,
  blocked,
  change,
}: {
  page: number;
  pages: number;
  blocked: boolean;
  change: (page: number) => void;
}) {
  return (
    <View className="items-center gap-3 p-5">
      <Text className="text-muted">
        Page {page} of {Math.max(1, pages)}
      </Text>
      <View className="flex-row gap-4">
        {(['Previous', 'Next'] as const).map((label) => {
          const disabled = blocked || (label === 'Previous' ? page <= 1 : page >= pages);
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              disabled={disabled}
              accessibilityState={{ disabled }}
              className="bg-default min-h-12 justify-center rounded-lg px-4"
              onPress={() => change(page + (label === 'Previous' ? -1 : 1))}
            >
              <Text className="text-foreground">{label} page</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
