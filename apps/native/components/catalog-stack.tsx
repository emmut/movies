import { GlassHeader } from '@native/components/glass-header';
import { glassHeaderOptions, navigationColor } from '@native/lib/glass-navigation';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useCSSVariable } from 'uniwind';

function canRenderGlassBackground() {
  return Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
}

export function CatalogStack({ title }: { title: string }) {
  const background = useCSSVariable('--background');
  const foreground = useCSSVariable('--foreground');
  // Native stack color APIs do not accept Uniwind classes.
  const backgroundColor = navigationColor(background);
  const headerTintColor = navigationColor(foreground);
  const glassAvailable = canRenderGlassBackground();
  return (
    <Stack
      screenOptions={{
        headerStyle: Platform.OS === 'ios' ? undefined : { backgroundColor },
        ...glassHeaderOptions(Platform.OS, glassAvailable),
        headerBackground: glassAvailable ? GlassHeader : undefined,
        headerTintColor,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title }} />
      <Stack.Screen name="[type]/[id]" options={{ title: 'Title', headerBackTitle: title }} />
    </Stack>
  );
}
