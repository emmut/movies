import { createFileRoute, redirect } from '@tanstack/react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUser } from '@/lib/auth-server';
import { regions } from '@/lib/regions';
import {
  getAllWatchProviders,
  getUserRegion,
  getUserWatchProviders,
  updateUserRegion,
} from '@/lib/user-actions';
import { AddPasskey } from './settings/add-passkey';
import { LinkAccount } from './settings/link-account';
import { getUserPasskeys } from './settings/passkey-actions';
import { PasskeyList } from './settings/passkey-list';
import { RegionForm } from './settings/region-form';
import { WatchProviderForm } from './settings/watch-provider-form';

export const Route = createFileRoute('/settings')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: search.error as string | undefined,
  }),
  beforeLoad: async () => {
    const user = await getUser();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  loader: async ({ context }) => {
    const { user } = context;

    let currentRegion: string;
    try {
      currentRegion = await getUserRegion();
    } catch (err) {
      console.error('Error fetching user region:', err);
      throw redirect({ to: '/login' });
    }

    const passkeys = user.isAnonymous ? [] : await getUserPasskeys();
    const [allWatchProviders, userWatchProviders] = await Promise.all([
      getAllWatchProviders(currentRegion),
      getUserWatchProviders(),
    ]);

    return { user, currentRegion, passkeys, allWatchProviders, userWatchProviders };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { user, currentRegion, passkeys, allWatchProviders, userWatchProviders } =
    Route.useLoaderData();
  const { error } = Route.useSearch();

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
            <PasskeyList passkeys={passkeys} />
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
          <RegionForm
            currentRegion={currentRegion}
            regions={regions}
            updateRegionAction={(region) => updateUserRegion({ data: region })}
          />
        </CardContent>
      </Card>

      <WatchProviderForm
        availableProviders={allWatchProviders}
        userProviders={userWatchProviders}
      />
    </div>
  );
}
