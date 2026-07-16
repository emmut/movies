import { Suspense } from 'react';

import { AppSidebar, AppSidebarGhost } from './app-sidebar';
import { UserFooter } from './app-sidebar-user-footer';
import { UserNav } from './app-sidebar-user-nav';

export function AppSidebarWrapper() {
  return (
    // The sidebar reads dynamic client state (NavLink's `usePathname`), so under
    // `cacheComponents` it must sit behind a Suspense boundary; AppSidebarGhost
    // is the static shell prerendered in its place.
    <Suspense fallback={<AppSidebarGhost />}>
      <AppSidebar
        userNav={
          <Suspense fallback={<UserNav.Ghost />}>
            <UserNav />
          </Suspense>
        }
        userFooter={
          <Suspense fallback={<UserFooter.Ghost />}>
            <UserFooter />
          </Suspense>
        }
      />
    </Suspense>
  );
}
