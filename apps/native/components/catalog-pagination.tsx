import { Pressable, Text, View } from 'react-native';

function PageButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const opacity = disabled ? 'opacity-40' : '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      className={'min-h-11 justify-center rounded-xl bg-default px-4 ' + opacity}
      onPress={onPress}
    >
      <Text className="text-foreground">{label}</Text>
    </Pressable>
  );
}
export function CatalogPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <View className="items-center gap-3 p-4">
      <Text className="text-muted">
        Page {page} of {Math.max(1, totalPages)}
      </Text>
      <View className="flex-row gap-4">
        <PageButton label="Previous page" disabled={page <= 1} onPress={() => onChange(page - 1)} />
        <PageButton
          label="Next page"
          disabled={page >= totalPages}
          onPress={() => onChange(page + 1)}
        />
      </View>
    </View>
  );
}
