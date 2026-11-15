import type { MediaCard } from '@movies/api/home';
import { CustomListPicker } from '@native/components/custom-list-picker';
import { PlusIcon } from '@native/components/icons';
import { Sheet } from '@native/components/sheet';
import { SystemListActions } from '@native/components/system-list-actions';
import { authClient } from '@native/lib/auth-client';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
        <Sheet visible onRequestClose={() => setOpen(false)}>
          <QuickAddContents
            item={item}
            close={() => setOpen(false)}
            canUseLists={Boolean(session.data)}
            openLists={() => {
              setOpen(false);
              setCustomOpen(true);
            }}
          />
        </Sheet>
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

function QuickAddContents({
  item,
  close,
  canUseLists,
  openLists,
}: {
  item: MediaCard;
  close: () => void;
  canUseLists: boolean;
  openLists: () => void;
}) {
  return (
    <SafeAreaView className="flex-1 gap-6 bg-background p-5">
      <View className="flex-row items-center justify-between gap-3">
        <Text accessibilityRole="header" className="flex-1 text-xl font-bold text-foreground">
          {item.title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close quick add"
          className="bg-default min-h-12 justify-center rounded-lg px-4"
          onPress={close}
        >
          <Text className="text-foreground">Done</Text>
        </Pressable>
      </View>
      <SystemListActions
        input={{ resourceId: item.id, resourceType: item.type }}
        onSignIn={close}
      />
      {canUseLists ? (
        <Pressable
          accessibilityRole="button"
          className="bg-default min-h-12 justify-center rounded-lg border border-border px-4"
          onPress={openLists}
        >
          <Text className="font-semibold text-foreground">Add to Lists</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}
