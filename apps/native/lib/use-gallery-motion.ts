import { getAdjacentMediaIndex, type MediaDirection } from '@movies/api/media-navigation';
import {
  galleryAxis,
  galleryRelease,
  type GalleryAxis,
  type GalleryPoint,
} from '@native/lib/gallery-gesture';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, useWindowDimensions } from 'react-native';

const nativeDriver = Platform.OS !== 'web';
const slideEasing = Easing.bezier(0.22, 1, 0.36, 1);
const backdropEasing = Easing.bezier(0.55, 0, 1, 0.45);

export function useGalleryMotion(
  index: number,
  count: number,
  select: (index: number) => void,
  close: () => void,
) {
  const { height, width: screenWidth } = useWindowDimensions();
  const [width, setWidth] = useState(Math.max(1, screenWidth - 32));
  const [x] = useState(() => new Animated.Value(0));
  const [y] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));
  const [reduced, setReduced] = useState(false);
  const state = useRef({
    index,
    axis: null as GalleryAxis,
    start: null as GalleryPoint | null,
    offset: 0,
    offsetY: 0,
    dragX: 0,
    dragY: 0,
    moving: null as MediaDirection | null,
    closing: false,
  });

  function animate(
    value: Animated.Value,
    toValue: number,
    complete?: () => void,
    easing = slideEasing,
  ) {
    Animated.timing(value, {
      toValue,
      duration: reduced ? 0 : 280,
      easing,
      useNativeDriver: nativeDriver,
    }).start(({ finished }) => {
      if (finished) {
        complete?.();
      }
    });
  }
  function commit(next: number) {
    state.current.index = next;
    select(next);
  }
  function finishMove(direction: MediaDirection) {
    state.current.moving = null;
    commit(getAdjacentMediaIndex(state.current.index, count, direction));
    x.setValue(0);
  }
  function move(direction: MediaDirection) {
    if (count < 2 || state.current.closing || state.current.moving) {
      return;
    }
    state.current.moving = direction;
    animate(x, direction === 'next' ? -width : width, () => finishMove(direction));
  }
  function jump(next: number) {
    x.stopAnimation();
    state.current.moving = null;
    x.setValue(0);
    commit(next);
  }
  function start(point: GalleryPoint) {
    if (state.current.closing) {
      return;
    }
    state.current.start = point;
    state.current.axis = null;
    y.stopAnimation((position) => {
      state.current.offsetY = position;
      state.current.dragY = position;
    });
    x.stopAnimation((position) => {
      const moving = state.current.moving;
      let offset = position;
      if (moving) {
        offset += moving === 'next' ? width : -width;
        state.current.moving = null;
        commit(getAdjacentMediaIndex(state.current.index, count, moving));
      }
      state.current.offset = offset;
      state.current.dragX = offset;
      x.setValue(offset);
    });
  }
  function update(point: GalleryPoint) {
    const gesture = state.current;
    if (!gesture.start || gesture.closing) {
      return;
    }
    const dx = point.x - gesture.start.x;
    const dy = point.y - gesture.start.y;
    gesture.axis ??= galleryAxis(dx, dy);
    if (gesture.axis === 'x' && count > 1) {
      const limit = Math.max(width * 0.85, Math.abs(gesture.offset));
      gesture.dragX = Math.max(-limit, Math.min(limit, gesture.offset + dx));
      x.setValue(gesture.dragX);
    }
    if (gesture.axis === 'y' && point.touch) {
      gesture.dragY = Math.max(0, gesture.offsetY + dy);
      y.setValue(gesture.dragY);
      opacity.setValue(Math.max(0, 1 - gesture.dragY / height));
    }
  }
  function cancel() {
    if (state.current.closing) {
      return;
    }
    state.current.start = null;
    state.current.axis = null;
    animate(x, 0);
    animate(y, 0);
    animate(opacity, 1);
  }
  function end() {
    const gesture = state.current;
    if (!gesture.start) {
      return;
    }
    const result = galleryRelease(
      gesture.axis,
      gesture.dragX - gesture.offset,
      gesture.dragY,
      gesture.start.touch,
      count,
    );
    gesture.start = null;
    if (result === 'close') {
      gesture.closing = true;
      animate(opacity, 0, undefined, backdropEasing);
      animate(y, height, close);
    } else if (result) {
      move(result);
    } else {
      cancel();
    }
  }
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) {
        setReduced(value);
      }
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
      x.stopAnimation();
      y.stopAnimation();
      opacity.stopAnimation();
    };
  }, [x, y, opacity]);
  useEffect(() => {
    if (!reduced) {
      return;
    }
    const direction = state.current.moving;
    if (direction) {
      x.stopAnimation();
      state.current.moving = null;
      const next = getAdjacentMediaIndex(state.current.index, count, direction);
      state.current.index = next;
      select(next);
      x.setValue(0);
    }
    if (state.current.closing) {
      y.stopAnimation();
      close();
    }
  }, [reduced, count, select, close, x, y]);
  return { x, y, opacity, width, setWidth, move, jump, start, update, end, cancel };
}
