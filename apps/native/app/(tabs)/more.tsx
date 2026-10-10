import { BottomNavigation } from '@native/components/bottom-navigation';
import { authClient } from '@native/lib/auth-client';
import { MORE_MENU_ITEMS } from '@native/lib/navigation-menu';
import { useNavigationMenu } from '@native/lib/use-navigation-menu';
import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);

function SignOut() {
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    setError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError('Couldn’t sign out. Please try again.');
      }
    } catch {
      setError('Couldn’t sign out. Check your connection and try again.');
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <>
      <Pressable
        accessibilityRole="button"
        disabled={signingOut}
        accessibilityState={{ disabled: signingOut }}
        className="min-h-14 justify-center rounded-xl border border-border bg-default px-4"
        onPress={() => {
          void signOut();
        }}
      >
        <Text className="font-semibold text-foreground">
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Text>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" className="text-red-500">
          {error}
        </Text>
      ) : null}
    </>
  );
}

function SessionSummary() {
  const { data: session } = authClient.useSession();
  const message = session?.user
    ? 'Signed in as ' + session.user.name
    : 'Sign in to save favorites and create watchlists.';
  return <Text className="text-muted">{message}</Text>;
}
export default function More() {
  const select = useNavigationMenu();
  const { data: session } = authClient.useSession();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-5">
        <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
          More
        </Text>
        <SessionSummary />
        {MORE_MENU_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="link"
            accessibilityLabel={item.id === 'login' ? 'Sign in' : item.label + ' (opens browser)'}
            className="min-h-14 justify-center rounded-xl border border-border bg-default px-4"
            onPress={() => select(item.id)}
          >
            <Text className="font-semibold text-foreground">{item.label}</Text>
          </Pressable>
        ))}
        {session?.user ? <SignOut /> : null}
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}
