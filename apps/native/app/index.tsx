import { HOME_SECTIONS } from '@movies/api/home';
import { DEFAULT_REGION, regions, type RegionCode } from '@movies/config/regions';
import { useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { MediaRow, TrendingCard } from '../components/media-row';
import { queryClient, orpc } from '../lib/api';

const SafeAreaView = withUniwind(NativeSafeAreaView);

export default function Home() {
  const [region, setRegion] = useState<RegionCode>(DEFAULT_REGION);
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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-foreground text-2xl font-bold">
          Movies<Text className="text-yellow-600">.</Text>
        </Text>
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
        contentContainerClassName="pb-10"
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
        <View className="gap-3 px-5 pt-5">
          <Text className="text-foreground text-3xl font-bold">Trending Now</Text>
          <Text className="mb-2 text-sm text-muted">What everyone’s watching</Text>
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
      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="text-foreground text-xl font-bold">Choose your region</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerOpen(false)}
              className="rounded-xl bg-default px-4 py-3"
            >
              <Text className="text-foreground">Done</Text>
            </Pressable>
          </View>
          <ScrollView>
            {regions.map((item) => (
              <Pressable
                key={item.code}
                accessibilityRole="radio"
                accessibilityState={{ checked: region === item.code }}
                onPress={() => {
                  setRegion(item.code);
                  setPickerOpen(false);
                }}
                className="flex-row justify-between p-5"
              >
                <Text className="text-foreground text-lg">{item.name}</Text>
                <Text className="text-yellow-600">{region === item.code ? '✓' : ''}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
