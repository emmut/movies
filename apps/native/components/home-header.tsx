import { regions } from '@movies/config/regions';
import { Brand } from '@native/components/brand';
import { ChevronDownIcon } from '@native/components/icons';
import { Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

function RegionControl({
  region,
  onPress,
  disabled,
}: {
  region: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const name = regions.find((item) => item.code === region)?.name ?? region;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Region: ' + name + '. Change region'}
      disabled={disabled}
      accessibilityState={{ disabled, busy: disabled }}
      onPress={onPress}
      className="min-h-11 justify-center rounded-xl px-3"
    >
      <View className="flex-row items-center gap-1">
        <Text className="font-semibold text-foreground">{region}</Text>
        <ChevronDownIcon className="size-4 text-foreground" accessible={false} />
      </View>
    </Pressable>
  );
}

/** Uses the same native stack glass/material background as the detail header. */
export function HomeHeader({
  region,
  onOpenRegion,
  saving = false,
}: {
  region: string;
  onOpenRegion: () => void;
  saving?: boolean;
}) {
  return (
    <Stack.Screen
      options={{
        headerShown: true,
        title: 'Home',
        headerTitle: Brand,
        headerRight: () => (
          <RegionControl region={region} onPress={onOpenRegion} disabled={saving} />
        ),
      }}
    />
  );
}
