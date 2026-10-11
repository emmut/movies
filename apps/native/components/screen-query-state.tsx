import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator accessibilityLabel={`Loading ${label}`} />
      </View>
    );
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
