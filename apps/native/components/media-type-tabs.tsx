import { Pressable, Text, View } from 'react-native';

export function MediaTypeTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <View
      accessibilityLabel={label}
      className="bg-default flex-row rounded-xl border border-border p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            aria-pressed={selected}
            className={`min-h-11 grow items-center justify-center rounded-lg px-2 ${selected ? 'bg-yellow-400' : ''}`}
            onPress={() => onChange(option.value)}
          >
            <Text
              numberOfLines={1}
              className={`text-sm font-semibold ${selected ? 'text-zinc-950' : 'text-muted'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
