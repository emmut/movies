import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { regions } from '@/lib/regions';
import { getUserRegion, updateUserRegion } from '@/lib/user-actions';
import { redirect } from 'next/navigation';
import { RegionForm } from './region-form';

export default async function SettingsPage() {
  let currentRegion: string;

  try {
    currentRegion = await getUserRegion();
  } catch (error) {
    console.error('Error fetching user region:', error);
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your personal settings</p>
      </div>

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
    </div>
  );
}
