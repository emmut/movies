import type { MediaDirection } from '@movies/api/media-navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@native/components/icons';
import { Pressable, Text, View } from 'react-native';

export function MediaViewerControls({
  title,
  index,
  count,
  move,
}: {
  title: string;
  index: number;
  count: number;
  move: (direction: MediaDirection) => void;
}) {
  return (
    <View className="gap-3 px-4 pt-3 pb-2">
      <Text numberOfLines={2} className="text-center font-medium text-white">
        {title}
      </Text>
      <View className="flex-row items-center justify-between gap-3">
        <MediaButton direction="previous" disabled={count < 2} move={move} />
        <Text accessibilityLiveRegion="polite" className="text-white/70">
          {index + 1} / {count}
        </Text>
        <MediaButton direction="next" disabled={count < 2} move={move} />
      </View>
    </View>
  );
}

function MediaButton({
  direction,
  disabled,
  move,
}: {
  direction: MediaDirection;
  disabled: boolean;
  move: (direction: MediaDirection) => void;
}) {
  const Icon = direction === 'previous' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === 'previous' ? 'Previous media' : 'Next media'}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={() => move(direction)}
      className="min-h-12 min-w-12 items-center justify-center rounded-xl bg-white/10"
    >
      <Icon className="size-5 text-white" accessible={false} />
    </Pressable>
  );
}
