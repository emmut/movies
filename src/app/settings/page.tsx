import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUser } from '@/lib/auth-server';
import { regions } from '@/lib/regions';
import {
  getUserRegion,
  getUserWatchProviders,
  getWatchProviders,
  updateUserRegion,
} from '@/lib/user-actions';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { AddPasskey } from './add-passkey';
import { LinkAccount } from './link-account';
import { getUserPasskeys } from './passkey-actions';
import { PasskeyList } from './passkey-list';
import { RegionForm } from './region-form';
import { WatchProviderForm } from './watch-provider-form';

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

/**
 * Renders the user settings page, enforcing authentication and region selection.
 *
 * Redirects to the login page if the user is not authenticated or if the user's region cannot be determined. Displays account linking options for anonymous users and provides a form to select or update the user's region.
 *
 * @param props - Contains a promise resolving to search parameters, which may include an error message for account linking.
 * @returns The settings page UI as a React element.
 */
export default async function SettingsPage(props: SettingsPageProps) {
  noStore();
  const { error } = await props.searchParams;

  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  let currentRegion: string;

  try {
    currentRegion = await getUserRegion();
  } catch (error) {
    console.error('Error fetching user region:', error);
    redirect('/login');
  }

  const passkeys = user.isAnonymous ? [] : await getUserPasskeys();
  const [availableWatchProviders, allWatchProviders] = await Promise.all([
    getWatchProviders(currentRegion),
    getWatchProviders(),
  ]);
  const userWatchProviders = await getUserWatchProviders();

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
            updateRegionAction={updateUserRegion}
          />
        </CardContent>
      </Card>

      {!user.isAnonymous && (
        <WatchProviderForm
          availableProviders={availableWatchProviders}
          userProviders={userWatchProviders}
          allWatchProviders={allWatchProviders}
        />
      )}
    </div>
  );
}
