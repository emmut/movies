import { Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { PRIMARY_MENU_ITEMS } from '../lib/navigation-menu';
import { useNavigationMenu } from '../lib/use-navigation-menu';
import { BottomNavigation } from './bottom-navigation';

const SafeAreaView = withUniwind(NativeSafeAreaView);

export function DeferredWorkflow({ id }: { id: 'discover' | 'search' }) {
  const select = useNavigationMenu();
  const item = PRIMARY_MENU_ITEMS.find((entry) => entry.id === id);
  if (!item) return null;
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-1 gap-4 p-5">
        <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
          {item.label}
        </Text>
        <Text className="text-muted">
          This workflow currently opens in your browser. Its native page is planned.
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={'Open ' + item.label + ' in browser'}
          className="min-h-12 items-center justify-center rounded-xl bg-default px-4"
          onPress={() => select(id)}
        >
          <Text className="font-semibold text-foreground">Open in browser</Text>
        </Pressable>
      </View>
      <BottomNavigation />
    </SafeAreaView>
  );
}
