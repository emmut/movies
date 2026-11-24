import { getSafeRedirectUrl } from '@movies/auth/redirect';
import { LOGIN_COPY, LOGIN_FEATURES } from '@movies/config/login';
import { XIcon } from '@native/components/icons';
import { authClient } from '@native/lib/auth-client';
import { isPasskeySupported } from '@native/lib/passkeys';
import { runSignIn } from '@native/lib/sign-in';
import type { SignInMethod, SignInOutcome } from '@native/lib/sign-in-flow';
import { Stack, useLocalSearchParams, useRouter, Redirect, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
const methods: { id: SignInMethod; label: string; className: string }[] = [
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
function passkeyUnavailable(method: SignInMethod) {
  return method === 'passkey' && !isPasskeySupported();
}
function loginButtonTextClass(method: SignInMethod) {
  return method === 'passkey' ? 'text-foreground' : 'text-white';
}
function LoginMethod({
  method,
  pending,
  authenticate,
}: {
  method: (typeof methods)[number];
  pending: SignInMethod | null;
  authenticate: (method: SignInMethod) => Promise<void>;
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
          Passkeys aren’t available here. Continue with Discord or GitHub.
        </Text>
      ) : null}
    </View>
  );
}
function LoginMethods({
  pending,
  authenticate,
}: {
  pending: SignInMethod | null;
  authenticate: (method: SignInMethod) => Promise<void>;
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
/** A dismissed passkey prompt, like a success, leaves no message behind. */
function outcomeError(outcome: SignInOutcome) {
  if (outcome.status === 'failed') {
    return outcome.message;
  }
  return null;
}
function signedInAccount(user?: { isAnonymous?: boolean | null } | null) {
  return Boolean(user && !user.isAnonymous);
}

function CloseSignIn({ close }: { close: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close sign in"
      accessibilityHint="Return to More"
      className="min-h-11 min-w-11 items-center justify-center"
      onPress={close}
    >
      <XIcon className="size-6 text-foreground" accessible={false} />
    </Pressable>
  );
}

export function LoginScreen() {
  const params = useLocalSearchParams<{ redirect_url?: string; error?: string }>();
  const destination = getSafeRedirectUrl(params.redirect_url);
  const destinationHref = destination as Href;
  const router = useRouter();
  const session = authClient.useSession();
  const [pending, setPending] = useState<SignInMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const dismissed = useRef(false);
  function close() {
    dismissed.current = true;
    setLeaving(true);
    // A callback or protected-page redirect may leave no safe history entry to pop.
    router.dismissTo('/more');
  }
  function finishSignIn(outcome: SignInOutcome) {
    if (dismissed.current) {
      return;
    }
    setPending(null);
    setError(outcomeError(outcome));
    if (outcome.status === 'signed-in') {
      router.replace(destinationHref);
    }
  }
  async function authenticate(method: SignInMethod) {
    if (method === 'anonymous' && session.data?.user.isAnonymous) {
      router.replace(destinationHref);
      return;
    }
    setPending(method);
    setError(null);
    finishSignIn(await runSignIn(method, destination));
  }
  if (!leaving && signedInAccount(session.data?.user)) {
    return <Redirect href={destinationHref} />;
  }
  const failure = loginError(error, params.error);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
      <Stack.Screen
        options={{ title: 'Sign in', headerRight: () => <CloseSignIn close={close} /> }}
      />
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
