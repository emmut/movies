import {
  canRestoreScroll,
  clampScrollOffset,
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
  const remembered = useRef(positions.has(key));
  const bottomInset = useRef(0);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const phase = useRef<'hidden' | 'restoring' | 'ready'>('hidden');

  const restore = useCallback(function restore() {
    if (phase.current !== 'restoring') return;
    if (!ref.current) return;
    if (
      !canRestoreScroll(
        offset.current,
        contentHeight.current + bottomInset.current,
        viewportHeight.current,
      )
    )
      return;
    phase.current = 'ready';
    restoreScrollPosition(ref.current, offset.current);
  }, []);

  useFocusEffect(
    useCallback(
      function focus() {
        phase.current = remembered.current ? 'restoring' : 'ready';
        const frame = requestAnimationFrame(restore);
        return function blur() {
          cancelAnimationFrame(frame);
          if (ref.current)
            offset.current = readScrollOffset(ref.current.getScrollableNode(), offset.current);
          phase.current = 'hidden';
          if (viewportHeight.current > 0) {
            remembered.current = true;
            positions.set(key, offset.current);
          }
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
    const { contentOffset } = event.nativeEvent;
    const contentInset = event.nativeEvent.contentInset ?? { top: 0, bottom: 0 };
    bottomInset.current = contentInset.bottom;
    if (phase.current === 'ready')
      offset.current = clampScrollOffset(contentOffset.y, contentInset.top);
    restore();
  }
  function onContentSizeChange(_width: number, height: number) {
    contentHeight.current = height;
    restore();
  }
  return { ref, onScroll, onContentSizeChange, onLayout, onScrollBeginDrag };
}
