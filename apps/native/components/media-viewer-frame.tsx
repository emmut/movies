import type { MediaDirection } from '@movies/api/media-navigation';
import { MediaViewerControls } from '@native/components/media-viewer-controls';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView as NativeSafeAreaView,
} from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);

/** Native modals measure their own insets; the browser preview uses this same frame. */
export function MediaViewerFrame({
  title,
  caption,
  index,
  count,
  move,
  close,
  children,
}: {
  title: string;
  caption: string;
  index: number;
  count: number;
  move: (direction: MediaDirection) => void;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      visible
      accessibilityLabel="Media gallery"
      animationType="fade"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={close}
    >
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-black">
          <StatusBar style="light" />
          <View className="flex-row items-center gap-3 px-4 py-2">
            <Text
              accessibilityRole="header"
              numberOfLines={2}
              className="flex-1 text-lg font-semibold text-white"
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close media viewer"
              onPress={close}
              className="min-h-12 justify-center rounded-xl bg-white/10 px-4"
            >
              <Text className="font-semibold text-white">Done</Text>
            </Pressable>
          </View>
          {children}
          <MediaViewerControls title={caption} index={index} count={count} move={move} />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
