import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export function CatalogSectionState({
  label,
  pending,
  failed,
  retry,
}: {
  label: string;
  pending: boolean;
  failed: boolean;
  retry: () => void;
}) {
  if (pending) return <ActivityIndicator accessibilityLabel={`Loading ${label}`} />;
  if (!failed) return null;
  return (
    <View className="items-start gap-3">
      <Text className="text-sm text-muted">Couldn’t load {label}.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Retry ${label}`}
        onPress={retry}
        className="min-h-11 justify-center rounded-lg bg-default px-4 py-2"
      >
        <Text className="font-semibold text-foreground">Try again</Text>
      </Pressable>
    </View>
  );
}
