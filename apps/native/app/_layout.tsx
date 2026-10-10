import '../global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView as NativeGestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCSSVariable, withUniwind } from 'uniwind';

import { queryClient } from '../lib/api';

const GestureHandlerRootView = withUniwind(NativeGestureHandlerRootView);

export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  const background = useCSSVariable('--background');
  const foreground = useCSSVariable('--foreground');
  // Native stack options accept color/style objects, not Uniwind classes.
  const backgroundColor = typeof background === 'string' ? background : undefined;
  const headerTintColor = typeof foreground === 'string' ? foreground : undefined;
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <HeroUINativeProvider>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor },
                headerTintColor,
                contentStyle: { backgroundColor },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
              <Stack.Screen
                name="[type]/[id]"
                options={{ title: 'Title', headerBackTitle: 'Home' }}
              />
            </Stack>
          </HeroUINativeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
