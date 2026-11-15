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
      className={'bg-default min-h-12 justify-center rounded-xl px-4 ' + opacity}
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
  disabled = false,
}: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <View className="items-center gap-3 p-4">
      <Text className="text-muted">
        Page {page} of {Math.max(1, totalPages)}
      </Text>
      <View className="flex-row flex-wrap justify-center gap-3">
        <PageButton
          label="Previous page"
          disabled={disabled || page <= 1}
          onPress={() => onChange(page - 1)}
        />
        <PageButton
          label="Next page"
          disabled={disabled || page >= totalPages}
          onPress={() => onChange(page + 1)}
        />
      </View>
    </View>
  );
}
