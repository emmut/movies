import { Stack } from 'expo-router';
import { useCSSVariable } from 'uniwind';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeLayout() {
  const background = useCSSVariable('--background');
  const foreground = useCSSVariable('--foreground');
  // Native stack color APIs do not accept Uniwind classes.
  const backgroundColor = typeof background === 'string' ? background : undefined;
  const headerTintColor = typeof foreground === 'string' ? foreground : undefined;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor },
        headerTintColor,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
      <Stack.Screen name="[type]/[id]" options={{ title: 'Title', headerBackTitle: 'Home' }} />
    </Stack>
  );
}
