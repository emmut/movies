import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
export type Choice = { value: string; label: string };

function ChoiceRow({
  item,
  checked,
  disabled,
  multiple,
  onSelect,
}: {
  item: Choice;
  checked: boolean;
  disabled: boolean;
  multiple: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <Pressable
      aria-checked={checked}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityLabel={item.label}
      disabled={disabled}
      accessibilityState={{ checked, disabled }}
      className="min-h-14 flex-row items-center justify-between border-b border-border px-5"
      onPress={() => onSelect(item.value)}
    >
      <Text className="text-base text-foreground">{item.label}</Text>
      {checked ? <Text className="font-bold text-yellow-500">✓</Text> : null}
    </Pressable>
  );
}

export function ChoiceSheet({
  title,
  options,
  selected,
  multiple,
  maxSelections,
  onSelect,
  onClose,
}: {
  title: string;
  options: Choice[];
  selected: string[];
  multiple: boolean;
  maxSelections?: number;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const limitReached = multiple && maxSelections !== undefined && selected.length >= maxSelections;
  const filtered = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between p-4">
          <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Close ' + title}
            className="min-h-11 justify-center rounded-xl bg-default px-4"
            onPress={onClose}
          >
            <Text className="font-semibold text-foreground">Done</Text>
          </Pressable>
        </View>
        <TextInput
          accessibilityLabel={'Find ' + title}
          placeholder="Find options"
          placeholderTextColorClassName="accent-muted"
          className="mx-4 mb-3 min-h-12 rounded-xl border border-border px-4 text-foreground"
          value={search}
          onChangeText={setSearch}
        />
        {limitReached ? (
          <Text accessibilityRole="alert" className="mx-4 mb-3 text-muted">
            You can select up to {maxSelections} options. Remove one to select another.
          </Text>
        ) : null}
        <FlatList
          data={filtered}
          keyExtractor={(option) => option.value}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const checked = selected.includes(item.value);
            return (
              <ChoiceRow
                item={item}
                checked={checked}
                disabled={limitReached && !checked}
                multiple={multiple}
                onSelect={onSelect}
              />
            );
          }}
          ListEmptyComponent={<Text className="p-5 text-muted">No matching options.</Text>}
        />
      </SafeAreaView>
    </Modal>
  );
}
