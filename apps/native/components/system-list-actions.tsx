import type { SystemListResourceInput } from '@movies/api/system-lists';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { authClient } from '@native/lib/auth-client';
import { useSystemListMembership, useSystemListToggle } from '@native/lib/system-lists';
import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

const actions = [
  {
    listType: 'watchlist',
    active: 'In Watchlist',
    inactive: 'Add to Watchlist',
    remove: 'Remove from Watchlist',
    field: 'inWatchlist',
    icon: '★',
  },
  {
    listType: 'watched',
    active: 'Watched',
    inactive: 'Mark as Watched',
    remove: 'Mark as not watched',
    field: 'watched',
    icon: '✓',
  },
] as const;

function AuthenticatedActions({
  input,
  userId,
}: {
  input: SystemListResourceInput;
  userId: string;
}) {
  const { query } = useSystemListMembership(input);
  const mutation = useSystemListToggle(userId);
  const membership = query.data;
  if (!membership || query.isError) {
    return (
      <CatalogSectionState
        label="list actions"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {actions.map((action) => {
          const active = membership[action.field];
          return (
            <Pressable
              key={action.listType}
              accessibilityRole="button"
              accessibilityLabel={active ? action.remove : action.inactive}
              accessibilityState={{ disabled: mutation.isPending, selected: active }}
              disabled={mutation.isPending}
              className={
                'min-h-12 items-center justify-center rounded-lg border px-4 ' +
                (active ? 'bg-default border-foreground' : 'border-border')
              }
              onPress={() => mutation.mutate({ ...input, listType: action.listType })}
            >
              <Text className="font-semibold text-foreground">
                {action.icon} {active ? action.active : action.inactive}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {mutation.isError ? (
        <Text accessibilityRole="alert" className="text-red-500">
          Couldn’t update your list. Please try again.
        </Text>
      ) : null}
    </View>
  );
}

export function SystemListActions({ input }: { input: SystemListResourceInput }) {
  const session = authClient.useSession();
  const pathname = usePathname();
  if (session.error) {
    return (
      <CatalogSectionState
        label="your session"
        pending={false}
        failed
        retry={() => {
          void session.refetch();
        }}
      />
    );
  }
  if (session.isPending) {
    return <Text className="text-muted">Loading list actions…</Text>;
  }
  if (!session.data) {
    return (
      <Link href={{ pathname: '/login', params: { redirect_url: pathname } }} asChild>
        <Pressable
          accessibilityRole="link"
          className="min-h-12 justify-center rounded-lg border border-border px-4"
        >
          <Text className="font-semibold text-foreground">Sign in to manage your lists</Text>
        </Pressable>
      </Link>
    );
  }
  return (
    <AuthenticatedActions key={session.data.user.id} input={input} userId={session.data.user.id} />
  );
}
