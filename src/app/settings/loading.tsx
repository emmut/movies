import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the settings page.
 *
 * Renders the static page heading for real and a stack of card skeletons
 * matching the real cards (account, region, watch providers), so the layout
 * stays stable when the fetched settings render in.
 */
export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your personal settings</p>
      </div>

      {/* Account / passkeys card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>

      {/* Region card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full max-w-xs" />
        </CardContent>
      </Card>

      {/* Watch providers card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 @2xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
