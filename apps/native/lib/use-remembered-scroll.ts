import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

const positions = new Map<string, number>();

/** Remember the focused screen, ignoring zero-offset events while it is hidden. */
export function useRememberedScroll(key: string) {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(positions.get(key) ?? 0);
  const contentHeight = useRef(0);
  const phase = useRef<'hidden' | 'restoring' | 'ready'>('hidden');

  const restore = useCallback(function restore() {
    if (phase.current !== 'restoring') return;
    if (!ref.current || contentHeight.current < offset.current) return;
    phase.current = 'ready';
    ref.current.scrollTo({ y: offset.current, animated: false });
  }, []);

  useFocusEffect(
    useCallback(
      function focus() {
        phase.current = 'restoring';
        const frame = requestAnimationFrame(restore);
        return function blur() {
          cancelAnimationFrame(frame);
          phase.current = 'hidden';
          positions.set(key, offset.current);
        };
      },
      [key, restore],
    ),
  );

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (phase.current === 'ready') offset.current = Math.max(0, event.nativeEvent.contentOffset.y);
  }
  function onContentSizeChange(_width: number, height: number) {
    contentHeight.current = height;
    restore();
  }
  return { ref, onScroll, onContentSizeChange };
}
