import { HOME_SECTIONS } from '@movies/api/home';
import { regions } from '@movies/config/regions';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { Brand } from '@native/components/brand';
import { MediaRow, TrendingCard } from '@native/components/media-row';
import { RegionPicker } from '@native/components/region-picker';
import { queryClient, orpc } from '@native/lib/api';
import { useRegion } from '@native/lib/preferences';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);

export default function Home() {
  const { region, setRegion } = useRegion();
  const {
    ref: homeScrollRef,
    onScroll: rememberHomeScroll,
    onContentSizeChange: restoreHomeScroll,
    onLayout,
    onScrollBeginDrag,
  } = useRememberedScroll('home');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  async function refresh() {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: orpc.home.key() });
    } finally {
      setRefreshing(false);
    }
  }
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
      collapsable={false}
    >
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Brand />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Region: ${regions.find((item) => item.code === region)?.name}. Change region`}
          onPress={() => setPickerOpen(true)}
          className="rounded-xl bg-default px-4 py-3"
        >
          <Text className="text-foreground">{region} ▾</Text>
        </Pressable>
      </View>
      <ScrollView
        className="flex-1"
        testID="home-scroll"
        contentInsetAdjustmentBehavior="automatic"
        ref={homeScrollRef}
        onScroll={rememberHomeScroll}
        onContentSizeChange={restoreHomeScroll}
        onLayout={onLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        scrollEventThrottle={16}
        contentContainerClassName="gap-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            tintColorClassName="accent-yellow-400"
          />
        }
      >
        <View className="gap-4 px-4 pt-5">
          <Text
            accessibilityRole="header"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Trending Now
          </Text>
          <TrendingCard type="movie" />
          <TrendingCard type="tv" />
        </View>
        {HOME_SECTIONS.map((section) => (
          <MediaRow key={section.category} section={section} region={region} />
        ))}
        <Text className="p-5 text-center text-xs text-muted">
          Movie and TV data provided by TMDB
        </Text>
      </ScrollView>
      <BottomNavigation />
      <RegionPicker
        visible={pickerOpen}
        selected={region}
        onSelect={setRegion}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
