import '@native/global.css';
import { ApiProvider } from '@movies/api/react';
import { SessionBoundary } from '@native/components/session-boundary';
import { orpc, queryClient } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from 'heroui-native';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView as NativeGestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const GestureHandlerRootView = withUniwind(NativeGestureHandlerRootView);

export const unstable_settings = { anchor: '(tabs)' };

export default function Layout() {
  const colorScheme = useColorScheme();
  const session = authClient.useSession();
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    // The app restores each scroll container; browser history must not restore a stale snapshot too.
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return function restoreBrowserDefault() {
      window.history.scrollRestoration = previous;
    };
  }, []);
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ApiProvider api={orpc} accountId={session.data?.user.id ?? null}>
            <SessionBoundary>
              <HeroUINativeProvider>
                <StatusBar style="auto" />
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  </Stack>
                </ThemeProvider>
              </HeroUINativeProvider>
            </SessionBoundary>
          </ApiProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
