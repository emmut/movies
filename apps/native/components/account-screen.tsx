import { BottomNavigation } from '@native/components/bottom-navigation';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { authClient } from '@native/lib/auth-client';
import { useCurrentUrl } from '@native/lib/use-current-url';
import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
const SafeAreaView = withUniwind(NativeSafeAreaView);

function AccountContent({ children }: { children: (userId: string) => ReactNode }) {
  const session = authClient.useSession();
  const returnUrl = useCurrentUrl();
  if (session.isPending || session.error) {
    return (
      <ScreenQueryState
        label="your session"
        failed={Boolean(session.error)}
        retry={() => {
          void session.refetch();
        }}
      />
    );
  }
  if (!session.data) {
    return <Redirect href={{ pathname: '/login', params: { redirect_url: returnUrl } }} />;
  }
  return (
    <View key={session.data.user.id} className="flex-1">
      {children(session.data.user.id)}
    </View>
  );
}
export function AccountScreen({ children }: { children: (userId: string) => ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <AccountContent>{children}</AccountContent>
      <BottomNavigation />
    </SafeAreaView>
  );
}
