import {
  canRestoreScroll,
  readScrollOffset,
  restoreScrollPosition,
} from '@native/lib/scroll-restoration';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import type {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

const positions = new Map<string, number>();

/** Remember the focused screen, ignoring zero-offset events while it is hidden. */
export function useRememberedScroll<
  T extends ScrollView | Pick<FlatList<unknown>, 'scrollToOffset' | 'getScrollableNode'> =
    ScrollView,
>(key: string) {
  const ref = useRef<T>(null);
  const offset = useRef(positions.get(key) ?? 0);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const phase = useRef<'hidden' | 'restoring' | 'ready'>('hidden');

  const restore = useCallback(function restore() {
    if (phase.current !== 'restoring') return;
    if (!ref.current) return;
    if (!canRestoreScroll(offset.current, contentHeight.current, viewportHeight.current)) return;
    phase.current = 'ready';
    restoreScrollPosition(ref.current, offset.current);
  }, []);

  useFocusEffect(
    useCallback(
      function focus() {
        phase.current = 'restoring';
        const frame = requestAnimationFrame(restore);
        return function blur() {
          cancelAnimationFrame(frame);
          if (ref.current)
            offset.current = readScrollOffset(ref.current.getScrollableNode(), offset.current);
          phase.current = 'hidden';
          positions.set(key, offset.current);
        };
      },
      [key, restore],
    ),
  );

  function onLayout(event: LayoutChangeEvent) {
    viewportHeight.current = event.nativeEvent.layout.height;
    restore();
  }
  function onScrollBeginDrag() {
    phase.current = 'ready';
  }
  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (phase.current === 'ready') offset.current = Math.max(0, event.nativeEvent.contentOffset.y);
  }
  function onContentSizeChange(_width: number, height: number) {
    contentHeight.current = height;
    restore();
  }
  return { ref, onScroll, onContentSizeChange, onLayout, onScrollBeginDrag };
}
