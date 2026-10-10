import { registerScrollCapture } from '@native/lib/navigation-scroll';
import {
  canRestoreScroll,
  clampScrollOffset,
  readScrollOffset,
  readScrollDimensions,
  restoreScrollPosition,
} from '@native/lib/scroll-restoration';
import { useFocusEffect, useRoute } from 'expo-router';
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
>(key: string, scope: 'screen' | 'entry' = 'screen') {
  const route = useRoute();
  const positionKey = scope === 'entry' ? route.key + ':' + key : key;
  const ref = useRef<T>(null);
  const offset = useRef(positions.get(positionKey) ?? 0);
  const remembered = useRef(positions.has(positionKey));
  const bottomInset = useRef(0);
  const navigationOffset = useRef<number | null>(null);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const phase = useRef<'hidden' | 'restoring' | 'ready'>('hidden');

  const restore = useCallback(function restore() {
    if (phase.current !== 'restoring') {
      return;
    }
    if (!ref.current) {
      return;
    }
    const dimensions = readScrollDimensions(
      ref.current.getScrollableNode(),
      contentHeight.current + bottomInset.current,
      viewportHeight.current,
    );
    if (!canRestoreScroll(offset.current, dimensions.content, dimensions.viewport)) {
      return;
    }
    phase.current = 'ready';
    restoreScrollPosition(ref.current, offset.current);
  }, []);

  const captureBeforeNavigation = useCallback(function captureBeforeNavigation() {
    if (ref.current) {
      navigationOffset.current = readScrollOffset(ref.current.getScrollableNode(), offset.current);
    }
  }, []);

  useFocusEffect(
    useCallback(
      function focus() {
        const unregister = registerScrollCapture(captureBeforeNavigation);
        phase.current = remembered.current ? 'restoring' : 'ready';
        const frame = requestAnimationFrame(restore);
        return function blur() {
          unregister();
          cancelAnimationFrame(frame);
          if (navigationOffset.current !== null) {
            offset.current = navigationOffset.current;
          } else if (ref.current) {
            offset.current = readScrollOffset(ref.current.getScrollableNode(), offset.current);
          }
          navigationOffset.current = null;
          phase.current = 'hidden';
          if (viewportHeight.current > 0) {
            remembered.current = true;
            positions.set(positionKey, offset.current);
          }
        };
      },
      [positionKey, restore, captureBeforeNavigation],
    ),
  );

  function onLayout(event: LayoutChangeEvent) {
    viewportHeight.current = event.nativeEvent.layout.height;
    restore();
  }
  function cancelBeforeNavigation() {
    navigationOffset.current = null;
  }
  function onScrollBeginDrag() {
    cancelBeforeNavigation();
    phase.current = 'ready';
  }
  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset } = event.nativeEvent;
    const contentInset = event.nativeEvent.contentInset ?? { top: 0, bottom: 0 };
    bottomInset.current = contentInset.bottom;
    if (phase.current === 'ready') {
      offset.current = clampScrollOffset(contentOffset.y, contentInset.top);
    }
    restore();
  }
  function onContentSizeChange(_width: number, height: number) {
    contentHeight.current = height;
    restore();
  }
  return {
    ref,
    onScroll,
    onContentSizeChange,
    onLayout,
    onScrollBeginDrag,
    captureBeforeNavigation,
    cancelBeforeNavigation,
  };
}
