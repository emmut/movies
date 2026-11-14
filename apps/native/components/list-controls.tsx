import { ArrowDownIcon, ArrowUpIcon } from '@native/components/icons';
import { Pressable, View } from 'react-native';

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
