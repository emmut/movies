import { ContentSkeleton } from '@native/components/loading-skeletons';
import { Pressable, Text, View } from 'react-native';

/** Full-screen loading or failure state for a screen backed by one query. */
export function ScreenQueryState({
  label,
  failed,
  retry,
}: {
  label: string;
  failed: boolean;
  retry: () => void;
}) {
  if (!failed) {
    return <ContentSkeleton label={`Loading ${label}`} />;
  }
  return (
    <View className="flex-1 items-start gap-3 p-5">
      <Text className="text-foreground">Couldn’t load {label}.</Text>
      <Pressable
        accessibilityRole="button"
        className="bg-default min-h-11 justify-center rounded-xl px-4"
        onPress={retry}
      >
        <Text className="text-foreground">Try again</Text>
      </Pressable>
    </View>
  );
}
