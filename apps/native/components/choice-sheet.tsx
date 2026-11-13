import { CheckIcon } from '@native/components/icons';
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
      {checked ? <CheckIcon className="size-5 text-yellow-500" accessible={false} /> : null}
    </Pressable>
  );
}

type ChoiceFeedbackProps = {
  pending: boolean;
  failed: boolean;
  retry?: () => void;
  emptyLabel: string;
};

function ChoiceFeedback({ pending, failed, retry, emptyLabel }: ChoiceFeedbackProps) {
  if (pending) {
    return (
      <Text accessibilityRole="progressbar" className="px-5 py-3 text-muted">
        Searching…
      </Text>
    );
  }
  if (failed) {
    return (
      <Pressable
        accessibilityRole="button"
        className="min-h-12 justify-center px-5"
        onPress={retry}
      >
        <Text className="text-foreground">Couldn’t load options. Try again.</Text>
      </Pressable>
    );
  }
  return <Text className="p-5 text-muted">{emptyLabel}</Text>;
}

function ChoiceOptions({
  options,
  selected,
  multiple,
  maxSelections = Infinity,
  onSelect,
  feedback,
}: {
  options: Choice[];
  selected: string[];
  multiple: boolean;
  maxSelections?: number;
  onSelect: (value: string) => void;
  feedback: ChoiceFeedbackProps;
}) {
  const limitReached = multiple && selected.length >= maxSelections;
  return (
    <>
      {limitReached ? (
        <Text accessibilityRole="alert" className="mx-4 mb-3 text-muted">
          You can select up to {maxSelections} options. Remove one to select another.
        </Text>
      ) : null}
      <FlatList
        data={options}
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
        ListHeaderComponent={<SearchFeedback {...feedback} hasOptions={options.length > 0} />}
        ListEmptyComponent={<ChoiceFeedback {...feedback} />}
      />
    </>
  );
}

function SearchFeedback({
  pending,
  failed,
  retry,
  hasOptions,
}: ChoiceFeedbackProps & { hasOptions: boolean }) {
  if (!hasOptions) {
    return null;
  }
  if (pending || failed) {
    return <ChoiceFeedback pending={pending} failed={failed} retry={retry} emptyLabel="" />;
  }
  return null;
}

export function ChoiceSheet({
  title,
  options,
  selected,
  multiple,
  maxSelections,
  onSelect,
  onClose,
  onSearch,
  pending = false,
  failed = false,
  retry,
  emptyLabel = 'No matching options.',
}: {
  title: string;
  options: Choice[];
  selected: string[];
  multiple: boolean;
  maxSelections?: number;
  onSelect: (value: string) => void;
  onClose: () => void;
  onSearch?: (query: string) => void;
  pending?: boolean;
  failed?: boolean;
  retry?: () => void;
  emptyLabel?: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () =>
      onSearch
        ? options
        : options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase())),
    [options, search, onSearch],
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
            className="bg-default min-h-11 justify-center rounded-xl px-4"
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
          maxLength={onSearch ? 100 : undefined}
          onChangeText={(value) => {
            setSearch(value);
            onSearch?.(value);
          }}
        />
        <ChoiceOptions
          options={filtered}
          selected={selected}
          multiple={multiple}
          maxSelections={maxSelections}
          onSelect={onSelect}
          feedback={{ pending, failed, retry, emptyLabel }}
        />
      </SafeAreaView>
    </Modal>
  );
}
