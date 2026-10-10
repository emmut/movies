import { PRIMARY_MENU_ITEMS } from '@native/lib/navigation-menu';
import { useNavigationMenu } from '@native/lib/use-navigation-menu';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

/** Browser preview only; iOS and Android render NativeTabs instead. */
export function BottomNavigation() {
  const select = useNavigationMenu();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <View
      testID="bottom-navigation"
      accessibilityLabel="Bottom navigation"
      className="shrink-0 px-4 pb-4 pt-2"
    >
      <View className="min-h-16 flex-row items-center justify-between rounded-full border border-border bg-default px-4 shadow-lg">
        {PRIMARY_MENU_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: pathname === item.path }}
            className="min-h-11 justify-center px-2"
            onPress={() => {
              if (item.id === 'home') select('home');
              else router.navigate(item.path);
            }}
          >
            <Text className="text-sm font-semibold text-foreground">{item.label}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More navigation"
          accessibilityState={{ selected: pathname === '/more' }}
          className="min-h-11 items-center justify-center px-2"
          onPress={() => router.navigate('/more')}
        >
          <Text className="text-xl font-bold text-foreground">…</Text>
          <Text className="text-sm font-semibold text-foreground">More</Text>
        </Pressable>
      </View>
    </View>
  );
}
