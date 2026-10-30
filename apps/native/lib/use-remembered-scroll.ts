import { registerScrollCapture } from '@native/lib/navigation-scroll';
import { scrollEntryIdentity } from '@native/lib/scroll-entry';
import { createScrollMemory } from '@native/lib/scroll-memory';
import {
  canRestoreScroll,
  clampScrollOffset,
  readScrollOffset,
  readScrollDimensions,
  restoreScrollPosition,
} from '@native/lib/scroll-restoration';
import { useFocusEffect, useRoute } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Platform } from 'react-native';
import type {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

const positions = new Map<string, number>();

function scrollEntry(routeKey: string) {
  const historyState =
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.history.state : undefined;
  return { routeKey, identity: scrollEntryIdentity(routeKey, historyState) };
}

/** Remember the focused screen, ignoring zero-offset events while it is hidden. */
export function useRememberedScroll<
  T extends
    | ComponentRef<typeof ScrollView>
    | Pick<FlatList<unknown>, 'scrollToOffset' | 'getScrollableNode'> = ComponentRef<
    typeof ScrollView
  >,
>(key: string, scope: 'screen' | 'entry' = 'screen') {
  const route = useRoute();
  // Capture browser history identity once per route, including when this screen is kept mounted.
  const [entry, setEntry] = useState(() => scrollEntry(route.key));
  if (entry.routeKey !== route.key) {
    setEntry(scrollEntry(route.key));
  }
  const positionKey = scope === 'entry' ? entry.identity + ':' + key : key;
  const ref = useRef<T>(null);
  const memory = useRef(createScrollMemory(positionKey, positions));
  const bottomInset = useRef(0);
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
    if (!canRestoreScroll(memory.current.offset, dimensions.content, dimensions.viewport)) {
      return;
    }
    phase.current = 'ready';
    restoreScrollPosition(ref.current, memory.current.offset);
  }, []);

  const captureBeforeNavigation = useCallback(function captureBeforeNavigation() {
    if (ref.current) {
      memory.current.navigationOffset = readScrollOffset(
        ref.current.getScrollableNode(),
        memory.current.offset,
      );
    }
  }, []);

  useFocusEffect(
    useCallback(
      function focus() {
        const keyChanged = memory.current.select(positionKey);
        const unregister = registerScrollCapture(captureBeforeNavigation);
        phase.current = memory.current.remembered || keyChanged ? 'restoring' : 'ready';
        const frame = requestAnimationFrame(restore);
        return function blur() {
          unregister();
          cancelAnimationFrame(frame);
          if (memory.current.navigationOffset !== null) {
            memory.current.offset = memory.current.navigationOffset;
          } else if (ref.current) {
            memory.current.offset = readScrollOffset(
              ref.current.getScrollableNode(),
              memory.current.offset,
            );
          }
          memory.current.navigationOffset = null;
          phase.current = 'hidden';
          if (viewportHeight.current > 0) {
            memory.current.remember();
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
    memory.current.navigationOffset = null;
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
      memory.current.offset = clampScrollOffset(contentOffset.y, contentInset.top);
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
