import { getSafeRedirectUrl } from '@movies/auth/redirect';
import { LOGIN_COPY, LOGIN_FEATURES } from '@movies/config/login';
import { authClient } from '@native/lib/auth-client';
import { runSignIn } from '@native/lib/sign-in';
import type { SignInMethod } from '@native/lib/sign-in-flow';
import { Stack, useLocalSearchParams, useRouter, Redirect, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
type Method = SignInMethod;
const methods: { id: Method; label: string; className: string }[] = [
  { id: 'discord', label: 'Continue with Discord', className: 'bg-[#5865F2]' },
  { id: 'github', label: 'Continue with GitHub', className: 'bg-[#24292e]' },
  { id: 'passkey', label: 'Authenticate with Passkey', className: 'bg-default' },
  { id: 'anonymous', label: 'Continue as anonymous', className: 'bg-gray-500' },
];

function LoginIntroduction() {
  return (
    <View className="gap-6">
      <View className="items-center gap-3">
        <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
          Welcome Back
        </Text>
        <Text className="text-center text-muted">{LOGIN_COPY.subtitle}</Text>
      </View>
      {LOGIN_FEATURES.map((feature) => (
        <View key={feature.id} className="bg-default gap-1 rounded-xl border border-border p-4">
          <Text className="font-semibold text-foreground">{feature.title}</Text>
          <Text className="text-sm text-muted">{feature.description}</Text>
        </View>
      ))}
      <Text className="text-center text-muted">{LOGIN_COPY.methodPrompt}</Text>
    </View>
  );
}
function passkeyUnavailable(method: Method) {
  return method === 'passkey' && Platform.OS !== 'web';
}
function loginButtonTextClass(method: Method) {
  return method === 'passkey' ? 'text-foreground' : 'text-white';
}
function LoginMethod({
  method,
  pending,
  authenticate,
}: {
  method: (typeof methods)[number];
  pending: Method | null;
  authenticate: (method: Method) => Promise<void>;
}) {
  const unavailable = passkeyUnavailable(method.id);
  const busy = pending === method.id;
  const disabled = pending !== null || unavailable;
  const textClass = loginButtonTextClass(method.id);
  return (
    <View className="gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={method.label}
        disabled={disabled}
        accessibilityState={{ disabled, busy }}
        className={'min-h-12 items-center justify-center rounded-xl px-4 ' + method.className}
        onPress={() => {
          void authenticate(method.id);
        }}
      >
        {busy ? (
          <ActivityIndicator accessibilityLabel="Signing in" />
        ) : (
          <Text className={'font-semibold ' + textClass}>{method.label}</Text>
        )}
      </Pressable>
      {unavailable ? (
        <Text className="text-sm text-muted">
          Passkeys are not available in this app yet. Continue with Discord or GitHub for now.
        </Text>
      ) : null}
    </View>
  );
}
function LoginMethods({
  pending,
  authenticate,
}: {
  pending: Method | null;
  authenticate: (method: Method) => Promise<void>;
}) {
  return methods.map((method) => (
    <LoginMethod key={method.id} method={method} pending={pending} authenticate={authenticate} />
  ));
}

function LoginError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <Text accessibilityRole="alert" className="text-red-500">
      {message}
    </Text>
  );
}
function loginError(error: string | null, routeError?: string) {
  if (error) {
    return error;
  }
  return routeError === 'failed_to_login' ? 'Couldn’t sign in. Please try again.' : null;
}
function signedInAccount(user?: { isAnonymous?: boolean | null } | null) {
  return Boolean(user && !user.isAnonymous);
}
export function LoginScreen() {
  const params = useLocalSearchParams<{ redirect_url?: string; error?: string }>();
  const destination = getSafeRedirectUrl(params.redirect_url);
  const router = useRouter();
  const session = authClient.useSession();
  const [pending, setPending] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function authenticate(method: Method) {
    if (method === 'anonymous' && session.data?.user.isAnonymous) {
      router.replace(destination as Href);
      return;
    }
    setPending(method);
    setError(null);
    const failure = await runSignIn(method, destination);
    setPending(null);
    if (failure) {
      setError(failure);
      return;
    }
    router.replace(destination as Href);
  }
  if (signedInAccount(session.data?.user)) {
    return <Redirect href={destination as Href} />;
  }
  const failure = loginError(error, params.error);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Sign in' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-6 px-5 pt-6 pb-12"
      >
        <LoginIntroduction />
        <LoginError message={failure} />
        <LoginMethods pending={pending} authenticate={authenticate} />
        <Text className="text-center text-xs text-muted">{LOGIN_COPY.terms}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
