import type { MediaCard } from '@movies/api/home';
import { CustomListPicker } from '@native/components/custom-list-picker';
import { PlusIcon } from '@native/components/icons';
import { SystemListActions } from '@native/components/system-list-actions';
import { authClient } from '@native/lib/auth-client';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
export function SystemQuickAdd({ item }: { item: MediaCard }) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const session = authClient.useSession();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Quick add ' + item.title}
        className="size-11 items-center justify-center rounded-full border border-white/30 bg-black/70"
        onPress={() => setOpen(true)}
      >
        <PlusIcon className="size-5 text-white" accessible={false} />
      </Pressable>
      {open ? (
        <Modal
          visible
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setOpen(false)}
        >
          <SafeAreaView className="flex-1 gap-6 bg-background p-5">
            <View className="flex-row items-center justify-between gap-3">
              <Text accessibilityRole="header" className="flex-1 text-xl font-bold text-foreground">
                {item.title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close quick add"
                className="bg-default min-h-12 justify-center rounded-lg px-4"
                onPress={() => setOpen(false)}
              >
                <Text className="text-foreground">Done</Text>
              </Pressable>
            </View>
            <SystemListActions
              input={{ resourceId: item.id, resourceType: item.type }}
              onSignIn={() => setOpen(false)}
            />
            {session.data ? (
              <Pressable
                accessibilityRole="button"
                className="bg-default min-h-12 justify-center rounded-lg border border-border px-4"
                onPress={() => {
                  setOpen(false);
                  setCustomOpen(true);
                }}
              >
                <Text className="font-semibold text-foreground">Add to Lists</Text>
              </Pressable>
            ) : null}
          </SafeAreaView>
        </Modal>
      ) : null}
      {customOpen && session.data ? (
        <CustomListPicker
          key={session.data.user.id}
          userId={session.data.user.id}
          input={{ resourceId: item.id, resourceType: item.type }}
          close={() => setCustomOpen(false)}
        />
      ) : null}
    </>
  );
}
