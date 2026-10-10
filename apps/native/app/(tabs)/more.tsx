import { Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { BottomNavigation } from '../../components/bottom-navigation';
import { MORE_MENU_ITEMS } from '../../lib/navigation-menu';
import { useNavigationMenu } from '../../lib/use-navigation-menu';

const SafeAreaView = withUniwind(NativeSafeAreaView);

export default function More() {
  const select = useNavigationMenu();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-5">
        <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
          More
        </Text>
        <Text className="text-muted">
          These workflows currently open in your browser. Native pages are planned.
        </Text>
        {MORE_MENU_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="link"
            accessibilityLabel={item.label + ' (opens browser)'}
            className="min-h-14 justify-center rounded-xl border border-border bg-default px-4"
            onPress={() => select(item.id)}
          >
            <Text className="font-semibold text-foreground">{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}
