import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import { authClient } from '@/lib/auth-client';
import { AddPasskey } from '@/components/add-passkey';
import { LinkAccount } from '@/components/link-account';
import { PasskeyList } from '@/components/passkey-list';
import { RegionForm } from '@/components/region-form';
import { WatchProviderForm } from '@/components/watch-provider-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@movies/ui/components/card';
import { regions } from '@movies/media';
import { orpc } from '@/utils/orpc';

export const Route = createFileRoute('/settings')({
  validateSearch: z.object({ error: z.string().optional() }),
  component: SettingsRoute,
});

function SettingsRoute() {
  const { error } = Route.useSearch();
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const passkeys = useQuery(orpc.passkey.list.queryOptions());
  const region = useQuery(orpc.user.region.queryOptions());
  const allProviders = useQuery(orpc.user.allWatchProviders.queryOptions({ input: { region: region.data } }));
  const userProviders = useQuery(orpc.user.userWatchProviders.queryOptions());

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
      </div>
    );
  }

  if (!session?.user) {
    navigate({ to: '/login' });
    return null;
  }

  const { user } = session;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your personal settings</p>
      </div>

      {user.isAnonymous && <LinkAccount error={error} />}

      {!user.isAnonymous && (
        <Card>
          <CardHeader>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              Manage your passkeys for secure, passwordless authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddPasskey />
            <PasskeyList passkeys={passkeys.data ?? []} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Region</CardTitle>
          <CardDescription>
            Choose your region to get relevant movies and streaming services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegionForm currentRegion={region.data ?? 'US'} regions={regions} />
        </CardContent>
      </Card>

      <WatchProviderForm
        availableProviders={allProviders.data ?? []}
        userProviders={userProviders.data ?? []}
      />
    </div>
  );
}
