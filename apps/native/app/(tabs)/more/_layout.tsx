import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

export default function MoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'More' }} />
      <Stack.Screen name="lists/index" options={{ title: 'My Lists', headerBackTitle: 'More' }} />
      <Stack.Screen
        name="lists/[listId]"
        options={{ title: 'List', headerBackTitle: 'My Lists' }}
      />
      <Stack.Screen name="watchlist" options={{ title: 'Watchlist', headerBackTitle: 'More' }} />
      <Stack.Screen name="watched" options={{ title: 'Watched', headerBackTitle: 'More' }} />
      <Stack.Screen name="[type]/[id]" options={{ title: 'Title', headerBackTitle: 'Back' }} />
      <Stack.Screen
        name="[type]/[id]/reviews"
        options={{ title: 'Reviews', headerBackTitle: 'Back' }}
      />
      <Stack.Screen name="settings" options={{ title: 'Settings', headerBackTitle: 'More' }} />
    </Stack>
  );
}
