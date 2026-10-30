import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import type { ComponentRef } from 'react';
import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

export function CustomListScroll({
  memoryKey,
  children,
}: {
  memoryKey: string;
  children: ReactNode;
}) {
  const {
    ref,
    onScroll,
    onLayout,
    onContentSizeChange,
    onScrollBeginDrag,
    captureBeforeNavigation,
    cancelBeforeNavigation,
  } = useRememberedScroll<ComponentRef<typeof ScrollView>>(memoryKey);
  return (
    <ScrollNavigationProvider capture={captureBeforeNavigation} cancel={cancelBeforeNavigation}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 p-5 pb-12"
        contentInsetAdjustmentBehavior="automatic"
        ref={ref}
        onScroll={onScroll}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        onScrollBeginDrag={onScrollBeginDrag}
        onTouchMove={onScrollBeginDrag}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    </ScrollNavigationProvider>
  );
}
