import { regions } from '@movies/config/regions';
import { Brand } from '@native/components/brand';
import { Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';

function RegionControl({ region, onPress }: { region: string; onPress: () => void }) {
  const name = regions.find((item) => item.code === region)?.name ?? region;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Region: ' + name + '. Change region'}
      onPress={onPress}
      className="min-h-11 justify-center rounded-xl px-3"
    >
      <Text className="font-semibold text-foreground">{region} ▾</Text>
    </Pressable>
  );
}

/** Uses the same native stack glass/material background as the detail header. */
export function HomeHeader({ region, onOpenRegion }: { region: string; onOpenRegion: () => void }) {
  return (
    <Stack.Screen
      options={{
        headerShown: true,
        title: 'Home',
        headerTitle: Brand,
        headerRight: () => <RegionControl region={region} onPress={onOpenRegion} />,
      }}
    />
  );
}
