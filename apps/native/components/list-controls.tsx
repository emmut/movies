import { ArrowDownIcon, ArrowUpIcon } from '@native/components/icons';
import { Pressable, View } from 'react-native';

const moves = [
  { direction: 'up', offset: -1, Icon: ArrowUpIcon },
  { direction: 'down', offset: 1, Icon: ArrowDownIcon },
] as const;

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
      {moves.map(({ direction, offset, Icon }) => {
        const target = position + offset;
        const disabled = pending || target < 0 || target > total - 1;
        return (
          <Pressable
            key={direction}
            accessibilityRole="button"
            accessibilityLabel={'Move ' + name + ' ' + direction}
            disabled={disabled}
            accessibilityState={{ disabled }}
            className="bg-default min-h-12 min-w-12 items-center justify-center rounded-lg px-3"
            onPress={() => move(target)}
          >
            <Icon className="size-5 text-foreground" accessible={false} />
          </Pressable>
        );
      })}
    </View>
  );
}
