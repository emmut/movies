import type { CustomListSummary } from '@movies/api/custom-lists';
import { createListSchema } from '@movies/api/validations';
import { EMOJI_OPTIONS } from '@movies/config/constants';
import { orpc } from '@native/lib/api';
import { refreshCustomLists } from '@native/lib/custom-lists';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
const SafeAreaView = withUniwind(NativeSafeAreaView);

export function CustomListForm({
  userId,
  item,
  close,
  created,
}: {
  userId: string;
  item?: CustomListSummary;
  close: () => void;
  created?: (id: string) => void;
}) {
  const initial = listDraft(item);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [emoji, setEmoji] = useState(initial.emoji);
  const [validation, setValidation] = useState<string | null>(null);
  async function saved() {
    await refreshCustomLists(userId);
    close();
  }
  const create = useMutation(
    orpc.customLists.create.mutationOptions({
      async onSuccess(result) {
        await saved();
        created?.(result.listId);
      },
    }),
  );
  const update = useMutation(orpc.customLists.update.mutationOptions({ onSuccess: saved }));
  const pending = create.isPending || update.isPending;
  const failed = create.isError || update.isError;
  function dismiss() {
    if (!pending) {
      close();
    }
  }
  function submit() {
    const parsed = createListSchema.safeParse({ name, description, emoji });
    if (!parsed.success) {
      setValidation(parsed.error.issues[0].message);
      return;
    }
    setValidation(null);
    if (item) {
      update.mutate({ ...parsed.data, listId: item.id });
    } else {
      create.mutate(parsed.data);
    }
  }
  const title = item ? 'Edit List' : 'Create New List';
  const submitLabel = item ? 'Save Changes' : 'Create List';
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={dismiss}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerClassName="gap-5 p-5 pb-12"
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-row items-center justify-between gap-3">
              <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={'Cancel ' + title}
                disabled={pending}
                className="min-h-12 justify-center px-3"
                onPress={dismiss}
              >
                <Text className="text-foreground">Cancel</Text>
              </Pressable>
            </View>
            <Text className="text-muted">Organize your favorite movies, TV shows and people.</Text>
            <Text className="font-semibold text-foreground">Emoji</Text>
            <EmojiPicker emoji={emoji} setEmoji={setEmoji} pending={pending} />
            <Text className="font-semibold text-foreground">Name</Text>
            <TextInput
              accessibilityLabel="List name"
              value={name}
              onChangeText={setName}
              maxLength={100}
              editable={!pending}
              placeholder="e.g. Favorite Movies"
              placeholderTextColorClassName="accent-muted"
              className="min-h-12 rounded-xl border border-border px-4 text-foreground"
            />
            <Text className="font-semibold text-foreground">Description</Text>
            <TextInput
              accessibilityLabel="List description"
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              editable={!pending}
              multiline
              textAlignVertical="top"
              placeholder="Optional description for your list"
              placeholderTextColorClassName="accent-muted"
              className="min-h-28 rounded-xl border border-border p-4 text-foreground"
            />
            <FormError validation={validation} failed={failed} />
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              accessibilityState={{ disabled: pending }}
              className="min-h-12 items-center justify-center rounded-xl bg-foreground px-4"
              onPress={submit}
            >
              <Text className="font-semibold text-background">
                {pending ? 'Saving…' : submitLabel}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function listDraft(item?: CustomListSummary) {
  if (!item) {
    return { name: '', description: '', emoji: '📝' };
  }
  return { name: item.name, description: item.description ?? '', emoji: item.emoji };
}
function EmojiPicker({
  emoji,
  setEmoji,
  pending,
}: {
  emoji: string;
  setEmoji: (value: string) => void;
  pending: boolean;
}) {
  return (
    <>
      <ScrollView
        className="max-h-44 rounded-xl border border-border"
        contentContainerClassName="flex-row flex-wrap gap-2 p-2"
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {EMOJI_OPTIONS.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={'Emoji ' + option}
            accessibilityState={{ checked: emoji === option, disabled: pending }}
            aria-checked={emoji === option}
            disabled={pending}
            onPress={() => setEmoji(option)}
            className={
              'min-h-12 min-w-12 items-center justify-center rounded-lg ' +
              (emoji === option ? 'bg-foreground' : 'bg-default')
            }
          >
            <Text className="text-2xl">{option}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text className="text-foreground/75">Selected: {emoji}</Text>
    </>
  );
}
function FormError({ validation, failed }: { validation: string | null; failed: boolean }) {
  if (!validation && !failed) {
    return null;
  }
  return (
    <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
      {validation ?? 'Couldn’t save your list. Please try again.'}
    </Text>
  );
}
