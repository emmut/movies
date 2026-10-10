import { HOME_SECTIONS } from '@movies/api/home';
import { DEFAULT_REGION, regions, type RegionCode } from '@movies/config/regions';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MediaRow, TrendingCard } from '../components/media-row';
import { queryClient, orpc } from '../lib/api';

export default function Home() {
  const [region, setRegion] = useState<RegionCode>(DEFAULT_REGION);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dark = useColorScheme() === 'dark';
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
      style={[styles.screen, { backgroundColor: dark ? '#09090b' : '#fafafa' }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <Text className="text-foreground text-2xl font-bold">
          Movies<Text style={styles.accent}>.</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Region: ${regions.find((item) => item.code === region)?.name}. Change region`}
          onPress={() => setPickerOpen(true)}
          style={styles.region}
        >
          <Text className="text-foreground">{region} ▾</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            tintColor="#facc15"
          />
        }
      >
        <View style={styles.trending}>
          <Text className="text-foreground text-3xl font-bold">Trending Now</Text>
          <Text style={styles.caption}>What everyone’s watching</Text>
          <TrendingCard type="movie" />
          <TrendingCard type="tv" />
        </View>
        {HOME_SECTIONS.map((section) => (
          <MediaRow key={section.category} section={section} region={region} />
        ))}
        <Text style={styles.credit}>Movie and TV data provided by TMDB</Text>
      </ScrollView>
      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerOpen(false)}
      >
        <SafeAreaView style={[styles.screen, { backgroundColor: dark ? '#09090b' : '#fafafa' }]}>
          <View style={styles.header}>
            <Text className="text-foreground text-xl font-bold">Choose your region</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerOpen(false)}
              style={styles.region}
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
                style={styles.option}
              >
                <Text className="text-foreground text-lg">{item.name}</Text>
                <Text style={styles.accent}>{region === item.code ? '✓' : ''}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accent: { color: '#ca8a04' },
  region: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#88888820',
  },
  content: { paddingBottom: 40 },
  trending: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  caption: { color: '#88888f', fontSize: 14, marginBottom: 8 },
  option: { padding: 20, flexDirection: 'row', justifyContent: 'space-between' },
  credit: { padding: 20, color: '#88888f', fontSize: 12, textAlign: 'center' },
});
