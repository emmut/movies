import { Skeleton as NativeSkeleton } from 'heroui-native';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export function Skeleton({ className }: { className: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <NativeSkeleton
      variant={reducedMotion ? 'none' : 'pulse'}
      className={`bg-border ${className}`}
    />
  );
}

function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {children}
      </View>
    </View>
  );
}

function PosterPlaceholder() {
  return (
    <View
      testID="poster-skeleton"
      className="bg-default aspect-2/3 overflow-hidden rounded-xl border border-border"
    >
      <Skeleton className="absolute inset-0 size-full rounded-xl" />
      <View className="absolute right-3 bottom-3 left-3 gap-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <View className="flex-row justify-between">
          <Skeleton className="h-3 w-10 rounded" />
          <Skeleton className="h-3 w-8 rounded" />
        </View>
      </View>
    </View>
  );
}

export function PosterGridSkeleton({ label }: { label: string }) {
  return (
    <ScrollView
      className="flex-1"
      scrollEnabled={false}
      contentContainerClassName="px-2"
      testID="poster-grid-skeleton"
    >
      <Loading label={label}>
        <View className="flex-row flex-wrap">
          {[0, 1, 2, 3, 4, 5].map((id) => (
            <View key={id} className="w-1/2 px-2 pb-4">
              <PosterPlaceholder />
            </View>
          ))}
        </View>
      </Loading>
    </ScrollView>
  );
}

export function SectionSkeleton({ label }: { label: string }) {
  return (
    <Loading label={label}>
      <View className="gap-3 py-2">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
      </View>
    </Loading>
  );
}

export function ContentSkeleton({ label }: { label: string }) {
  return (
    <ScrollView className="flex-1" scrollEnabled={false} contentContainerClassName="gap-6 p-4">
      <Skeleton className="h-7 w-1/2 rounded-lg" />
      <SectionSkeleton label={label} />
      {[0, 1, 2].map((id) => (
        <View key={id} className="bg-default gap-3 rounded-xl border border-border p-4">
          <Skeleton className="h-5 w-1/3 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </View>
      ))}
    </ScrollView>
  );
}

export function DetailSkeleton({ label }: { label: string }) {
  return (
    <ScrollView
      className="flex-1"
      scrollEnabled={false}
      contentContainerClassName="gap-6 p-4"
      testID="detail-skeleton"
    >
      <Loading label={label}>
        <View className="gap-5">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4 rounded" />
          <View className="flex-row gap-3">
            {[0, 1, 2].map((id) => (
              <Skeleton key={id} className="h-20 flex-1 rounded-lg" />
            ))}
          </View>
          <SectionSkeleton label="Loading overview" />
        </View>
      </Loading>
    </ScrollView>
  );
}

export function PosterRowSkeleton({
  label,
  featured = false,
}: {
  label: string;
  featured?: boolean;
}) {
  if (featured) {
    return (
      <Loading label={label}>
        <View className="h-64 w-full overflow-hidden rounded-2xl border border-border">
          <Skeleton className="absolute inset-0 size-full" />
          <View className="absolute right-5 bottom-5 left-5 gap-2">
            <Skeleton className="h-7 w-3/4 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="mt-2 h-5 w-28 rounded" />
          </View>
        </View>
      </Loading>
    );
  }
  return (
    <Loading label={label}>
      <View className="flex-row gap-3 overflow-hidden">
        {[0, 1, 2].map((id) => (
          <View key={id} className="w-36">
            <PosterPlaceholder />
          </View>
        ))}
      </View>
    </Loading>
  );
}

export function DiscoverSkeleton() {
  return (
    <View className="flex-1" testID="discover-skeleton">
      <View className="gap-3 p-4">
        <Skeleton className="h-8 w-32 rounded" />
        <View className="flex-row justify-between gap-4">
          <Skeleton className="h-13 w-44 rounded-xl" />
          <Skeleton className="h-11 w-24 rounded-xl" />
        </View>
      </View>
      <PosterGridSkeleton label="Loading Discover" />
    </View>
  );
}
