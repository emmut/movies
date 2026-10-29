import type { CustomListSummary } from '@movies/api/custom-lists';
import { orpc } from '@native/lib/api';
import { refreshCustomLists } from '@native/lib/custom-lists';
import { useMutation } from '@tanstack/react-query';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
const SafeAreaView = withUniwind(NativeSafeAreaView);

export function CustomListDelete({
  item,
  userId,
  close,
  deleted,
}: {
  item: CustomListSummary;
  userId: string;
  close: () => void;
  deleted?: () => void;
}) {
  const mutation = useMutation(
    orpc.customLists.delete.mutationOptions({
      async onSuccess() {
        await refreshCustomLists(userId);
        close();
        deleted?.();
      },
    }),
  );
  function dismiss() {
    if (!mutation.isPending) {
      close();
    }
  }
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={dismiss}>
      <SafeAreaView className="flex-1 justify-center bg-background p-5">
        <View className="gap-5 rounded-xl border border-border p-5">
          <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
            Delete {item.name}?
          </Text>
          <Text className="text-muted">
            This permanently deletes the list and removes its {item.itemCount} saved items.
          </Text>
          {mutation.isError ? (
            <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
              Couldn’t delete your list. Please try again.
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirm Delete List"
            disabled={mutation.isPending}
            className="min-h-12 items-center justify-center rounded-xl bg-red-700 px-4"
            onPress={() => mutation.mutate({ listId: item.id })}
          >
            <Text className="font-semibold text-white">
              {mutation.isPending ? 'Deleting…' : 'Delete List'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={mutation.isPending}
            className="bg-default min-h-12 items-center justify-center rounded-xl px-4"
            onPress={dismiss}
          >
            <Text className="text-foreground">Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
